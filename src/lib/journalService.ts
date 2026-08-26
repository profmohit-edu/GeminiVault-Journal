import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  type Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Journal, JournalMessage, JournalSummary, EvolutionAnalysis } from '../types';

/**
 * Helper to get the Firestore collection reference for a user's journals.
 * Enforces strictly scoped path: users/{uid}/journals
 */
export function getUserJournalsCollection(uid: string) {
  if (!uid) throw new Error('User ID is required for Firestore operations.');
  return collection(db, 'users', uid, 'journals');
}

/**
 * Helper to get a specific journal document reference for a user.
 * Enforces path: users/{uid}/journals/{journalId}
 */
export function getUserJournalDoc(uid: string, journalId: string) {
  if (!uid || !journalId) throw new Error('User ID and Journal ID are required.');
  return doc(db, 'users', uid, 'journals', journalId);
}

/**
 * Helper to get the user's insights document reference.
 * Enforces path: users/{uid}/insights/{insightId}
 */
export function getUserInsightDoc(uid: string, insightId: string = 'evolution') {
  if (!uid) throw new Error('User ID is required for Firestore operations.');
  return doc(db, 'users', uid, 'insights', insightId);
}

/**
 * Creates a new journal session for the authenticated user
 */
export async function createNewJournal(uid: string, title?: string): Promise<Journal> {
  const journalsCol = getUserJournalsCollection(uid);
  const newDocRef = doc(journalsCol);
  const now = new Date().toISOString();
  
  const initialJournal: Journal = {
    id: newDocRef.id,
    title: title || 'Untitled Journal Reflection',
    userId: uid,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        content: "Welcome to your private journal vault. I am your personal AI reflection partner. What is on your mind today, or what would you like to explore together?",
        timestamp: now
      }
    ],
    summary: null,
    status: 'active'
  };

  await setDoc(newDocRef, {
    ...initialJournal,
    _serverCreatedAt: serverTimestamp(),
    _serverUpdatedAt: serverTimestamp(),
  });

  return initialJournal;
}

/**
 * Updates an existing journal document for the authenticated user
 */
export async function updateJournal(
  uid: string, 
  journalId: string, 
  updates: Partial<Omit<Journal, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const docRef = getUserJournalDoc(uid, journalId);
  const now = new Date().toISOString();
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: now,
    _serverUpdatedAt: serverTimestamp(),
  });
}

/**
 * Appends a message to the journal and updates the Firestore document
 */
export async function appendJournalMessage(
  uid: string,
  journalId: string,
  message: JournalMessage
): Promise<void> {
  const docRef = getUserJournalDoc(uid, journalId);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    throw new Error('Journal not found or access denied.');
  }

  const data = snapshot.data() as Journal;
  const currentMessages = data.messages || [];
  const updatedMessages = [...currentMessages, message];

  await updateDoc(docRef, {
    messages: updatedMessages,
    updatedAt: new Date().toISOString(),
    _serverUpdatedAt: serverTimestamp(),
  });
}

/**
 * Saves generated summary to the authenticated user's journal
 */
export async function saveJournalSummary(
  uid: string,
  journalId: string,
  summary: JournalSummary,
  suggestedTitle?: string
): Promise<void> {
  const docRef = getUserJournalDoc(uid, journalId);
  const now = new Date().toISOString();
  
  const updates: Record<string, any> = {
    summary,
    updatedAt: now,
    _serverUpdatedAt: serverTimestamp(),
  };

  if (suggestedTitle && suggestedTitle.trim().length > 0) {
    updates.title = suggestedTitle.trim();
  }

  await updateDoc(docRef, updates);
}

/**
 * Deletes a journal session document belonging to the user
 */
export async function deleteJournal(uid: string, journalId: string): Promise<void> {
  const docRef = getUserJournalDoc(uid, journalId);
  await deleteDoc(docRef);
}

/**
 * Real-time listener for the authenticated user's journals list
 */
export function subscribeToUserJournals(
  uid: string,
  onJournalsChanged: (journals: Journal[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const journalsCol = getUserJournalsCollection(uid);
  const q = query(journalsCol, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const journals: Journal[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || 'Untitled Journal',
          userId: data.userId || uid,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messages: Array.isArray(data.messages) ? data.messages : [],
          summary: data.summary || null,
          status: data.status || 'active',
        };
      });
      onJournalsChanged(journals);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
  * Persists the computed Evolution Analysis to the authenticated user's isolated path:
  * users/{uid}/insights/evolution
  */
export async function saveUserEvolutionAnalysis(
  uid: string,
  analysis: EvolutionAnalysis
): Promise<void> {
  const docRef = getUserInsightDoc(uid, 'evolution');
  await setDoc(docRef, {
    ...analysis,
    userId: uid,
    updatedAt: new Date().toISOString(),
    _serverUpdatedAt: serverTimestamp(),
  });
}

/**
 * Retrieves the persisted Evolution Analysis for the user.
 */
export async function getUserEvolutionAnalysis(uid: string): Promise<EvolutionAnalysis | null> {
  const docRef = getUserInsightDoc(uid, 'evolution');
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as EvolutionAnalysis;
}

/**
 * Real-time listener for the user's Evolution Analysis document.
 */
export function subscribeToUserEvolutionAnalysis(
  uid: string,
  onAnalysisChanged: (analysis: EvolutionAnalysis | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = getUserInsightDoc(uid, 'evolution');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onAnalysisChanged(null);
        return;
      }
      onAnalysisChanged(docSnap.data() as EvolutionAnalysis);
    },
    (err) => {
      console.error('Firestore insight subscription error:', err);
      if (onError) onError(err);
    }
  );
}

