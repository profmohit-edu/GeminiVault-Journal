/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  subscribeToAuthState, 
  logOut, 
  getAuthToken, 
  type User 
} from './lib/firebase';
import { 
  createNewJournal, 
  updateJournal, 
  deleteJournal, 
  appendJournalMessage, 
  saveJournalSummary, 
  subscribeToUserJournals,
  saveUserEvolutionAnalysis,
  subscribeToUserEvolutionAnalysis
} from './lib/journalService';
import type { Journal, JournalMessage, EvolutionAnalysis } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { JournalWorkspace } from './components/JournalWorkspace';
import { EvolutionDashboard } from './components/EvolutionDashboard';
import { SecurityModal } from './components/SecurityModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [activeJournalId, setActiveJournalId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'journal' | 'evolution'>('journal');
  const [evolutionAnalysis, setEvolutionAnalysis] = useState<EvolutionAnalysis | null>(null);
  const [isAnalyzingEvolution, setIsAnalyzingEvolution] = useState(false);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Monitor Firebase Authentication State
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        setJournals([]);
        setActiveJournalId(null);
        setEvolutionAnalysis(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time Cloud Firestore updates for user-isolated journals
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeJournals = subscribeToUserJournals(
      currentUser.uid,
      (userJournals) => {
        setJournals(userJournals);
        // If active journal is not set or was removed, set to the first one available
        if (userJournals.length > 0) {
          setActiveJournalId((prev) => {
            if (prev && userJournals.some((j) => j.id === prev)) {
              return prev;
            }
            return userJournals[0].id;
          });
        }
      },
      (err) => {
        console.error('Failed to subscribe to user journals:', err);
        setErrorMessage('Failed to connect to Cloud Firestore. Please check your connection.');
      }
    );

    const unsubscribeEvolution = subscribeToUserEvolutionAnalysis(
      currentUser.uid,
      (analysis) => {
        setEvolutionAnalysis(analysis);
      },
      (err) => {
        console.warn('Could not load cached evolution insight:', err);
      }
    );

    return () => {
      unsubscribeJournals();
      unsubscribeEvolution();
    };
  }, [currentUser]);

  // Handle New Journal Creation
  const handleNewJournal = async () => {
    if (!currentUser) return;
    try {
      setErrorMessage(null);
      const newJournal = await createNewJournal(currentUser.uid);
      setActiveJournalId(newJournal.id);
      setActiveView('journal');
    } catch (err: any) {
      console.error('Error creating new journal:', err);
      setErrorMessage('Could not create new journal: ' + (err?.message || 'Unknown error'));
    }
  };

  // Handle Journal Evolution Intelligence Analysis
  const handleRunEvolutionAnalysis = async () => {
    if (!currentUser) return;

    const summarized = journals.filter((j) => Boolean(j.summary));
    if (summarized.length < 2) {
      setErrorMessage('At least two summarized journal sessions are required for Evolution Intelligence analysis.');
      return;
    }

    try {
      setIsAnalyzingEvolution(true);
      setErrorMessage(null);

      const token = await getAuthToken();
      if (!token) throw new Error('Authentication token unavailable.');

      const response = await fetch('/api/evolution-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Evolution analysis failed with status ${response.status}`);
      }

      const { analysis } = await response.json();

      // Persist to user's isolated Firestore path: users/{uid}/insights/evolution
      await saveUserEvolutionAnalysis(currentUser.uid, analysis);
      setEvolutionAnalysis(analysis);
    } catch (err: any) {
      console.error('Error running Evolution Intelligence analysis:', err);
      setErrorMessage(err?.message || 'Failed to synthesize Evolution Intelligence.');
    } finally {
      setIsAnalyzingEvolution(false);
    }
  };

  // Handle User Message and Server-side Gemini Reply
  const handleSendMessage = async (content: string) => {
    if (!currentUser || !activeJournalId) return;

    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    try {
      setIsGeneratingReply(true);
      setErrorMessage(null);

      // 1. Append user message to Firestore
      await appendJournalMessage(currentUser.uid, activeJournalId, userMessage);

      // 2. Prepare message history for server
      const currentJournal = journals.find((j) => j.id === activeJournalId);
      const messageHistory = currentJournal ? [...currentJournal.messages, userMessage] : [userMessage];

      // 3. Acquire Firebase ID token for secure server-side verification
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication token unavailable.');

      // 4. Call server-side Gemini chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          journalId: activeJournalId,
          messages: messageHistory,
          currentTitle: currentJournal?.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI generation failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: JournalMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'assistant',
        content: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      // 5. Append assistant reply to Firestore
      await appendJournalMessage(currentUser.uid, activeJournalId, assistantMessage);
    } catch (err: any) {
      console.error('Error handling journal message:', err);
      setErrorMessage(err?.message || 'Failed to communicate with AI reflection service.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // Handle Automatic Session Summarization
  const handleSummarize = async () => {
    if (!currentUser || !activeJournalId) return;

    const currentJournal = journals.find((j) => j.id === activeJournalId);
    if (!currentJournal || currentJournal.messages.length < 2) return;

    try {
      setIsSummarizing(true);
      setErrorMessage(null);

      const token = await getAuthToken();
      if (!token) throw new Error('Authentication token unavailable.');

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: currentJournal.messages,
          currentTitle: currentJournal.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Summarization failed with status ${response.status}`);
      }

      const { summary, suggestedTitle } = await response.json();

      // Persist summary to Cloud Firestore
      await saveJournalSummary(currentUser.uid, activeJournalId, summary, suggestedTitle);
    } catch (err: any) {
      console.error('Error summarizing journal session:', err);
      setErrorMessage(err?.message || 'Failed to generate cognitive summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle Title Update
  const handleUpdateTitle = async (newTitle: string) => {
    if (!currentUser || !activeJournalId) return;
    try {
      await updateJournal(currentUser.uid, activeJournalId, { title: newTitle });
    } catch (err: any) {
      console.error('Error updating title:', err);
      setErrorMessage('Failed to update title.');
    }
  };

  // Handle Journal Deletion
  const handleDeleteJournal = async (journalId: string) => {
    if (!currentUser) return;
    try {
      await deleteJournal(currentUser.uid, journalId);
      if (activeJournalId === journalId) {
        const remaining = journals.filter((j) => j.id !== journalId);
        setActiveJournalId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error('Error deleting journal:', err);
      setErrorMessage('Failed to delete journal.');
    }
  };

  // Handle User Sign Out
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div id="app-loading-screen" className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-stone-200 space-y-4">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-stone-400">Verifying secure authentication context...</p>
      </div>
    );
  }

  // Unauthenticated State: Show Sign-In Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  const activeJournal = journals.find((j) => j.id === activeJournalId);

  return (
    <div id="geminivault-app" className="flex h-screen w-screen overflow-hidden bg-stone-950 text-stone-100 font-sans">
      {/* Toast / Global Error Notification */}
      {errorMessage && (
        <div 
          id="global-error-toast" 
          className="fixed top-4 right-4 z-50 max-w-md bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-xs shadow-2xl flex items-start space-x-2"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-red-400 hover:text-red-200 ml-2 font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        journals={journals}
        activeJournalId={activeJournalId}
        activeView={activeView}
        onSelectJournal={(id) => {
          setActiveJournalId(id);
          setActiveView('journal');
        }}
        onSelectView={setActiveView}
        onNewJournal={handleNewJournal}
        onDeleteJournal={handleDeleteJournal}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onSignOut={handleSignOut}
        currentUser={currentUser}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      {activeView === 'evolution' ? (
        <EvolutionDashboard
          journals={journals}
          analysis={evolutionAnalysis}
          isLoading={isAnalyzingEvolution}
          onRunAnalysis={handleRunEvolutionAnalysis}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateToJournal={(id) => {
            setActiveJournalId(id);
            setActiveView('journal');
          }}
        />
      ) : activeJournal ? (
        <JournalWorkspace
          journal={activeJournal}
          onSendMessage={handleSendMessage}
          onSummarize={handleSummarize}
          onUpdateTitle={handleUpdateTitle}
          isGeneratingReply={isGeneratingReply}
          isSummarizing={isSummarizing}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-925">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-serif text-stone-100">Welcome to GeminiVault</h2>
            <p className="text-stone-400 text-sm">
              Your personal, cryptographically isolated journal sanctuary. Create your first journal session to begin.
            </p>
            <button
              onClick={handleNewJournal}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-medium text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-lg"
            >
              Start First Journal Session
            </button>
          </div>
        </main>
      )}

      {/* Security & Privacy Inspector Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        uid={currentUser.uid}
        email={currentUser.email}
      />
    </div>
  );
}
