import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  Download, 
  Edit2, 
  Check, 
  Menu, 
  Bot, 
  User as UserIcon, 
  Clock, 
  FileText,
  AlertCircle,
  CornerDownLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import type { Journal, JournalMessage, JournalSummary } from '../types';
import { SummaryCard } from './SummaryCard';

interface JournalWorkspaceProps {
  journal: Journal;
  onSendMessage: (content: string) => Promise<void>;
  onSummarize: () => Promise<void>;
  onUpdateTitle: (newTitle: string) => Promise<void>;
  isGeneratingReply: boolean;
  isSummarizing: boolean;
  onOpenMobileSidebar: () => void;
}

export function JournalWorkspace({
  journal,
  onSendMessage,
  onSummarize,
  onUpdateTitle,
  isGeneratingReply,
  isSummarizing,
  onOpenMobileSidebar,
}: JournalWorkspaceProps) {
  const [inputText, setInputText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(journal.title);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync title input when active journal changes
  useEffect(() => {
    setTitleText(journal.title);
  }, [journal.id, journal.title]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [journal.messages, isGeneratingReply]);

  const handleSend = async () => {
    if (!inputText.trim() || isGeneratingReply) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (titleText.trim() && titleText !== journal.title) {
      await onUpdateTitle(titleText.trim());
    }
  };

  const handleExportMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${journal.title}`);
    lines.push(`*Created: ${new Date(journal.createdAt).toLocaleString()}*`);
    lines.push(`*Updated: ${new Date(journal.updatedAt).toLocaleString()}*\n`);

    if (journal.summary) {
      lines.push(`## Cognitive Summary`);
      lines.push(`${journal.summary.rawSummaryText}\n`);
      if (journal.summary.themes?.length) {
        lines.push(`**Themes:** ${journal.summary.themes.join(', ')}`);
      }
      if (journal.summary.keyIdeas?.length) {
        lines.push(`**Key Ideas:**`);
        journal.summary.keyIdeas.forEach((i) => lines.push(`- ${i}`));
      }
      if (journal.summary.decisions?.length) {
        lines.push(`**Decisions:**`);
        journal.summary.decisions.forEach((d) => lines.push(`- ${d}`));
      }
      if (journal.summary.nextSteps?.length) {
        lines.push(`**Next Steps:**`);
        journal.summary.nextSteps.forEach((s) => lines.push(`- ${s}`));
      }
      lines.push('\n---\n');
    }

    lines.push(`## Transcript\n`);
    journal.messages.forEach((m) => {
      const sender = m.sender === 'assistant' ? 'Gemini AI' : 'User';
      lines.push(`### ${sender} (${new Date(m.timestamp).toLocaleTimeString()})`);
      lines.push(`${m.content}\n`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${journal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journal.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const promptStarters = [
    "What is one decision I need clarity on right now?",
    "Reflect on something that challenged me recently and what I learned.",
    "What am I genuinely excited about, and what fears are holding me back?",
    "Help me organize and structure a complicated idea."
  ];

  return (
    <main id="journal-workspace" className="flex-1 flex flex-col h-screen bg-stone-925 text-stone-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <header id="workspace-header" className="px-5 py-3.5 border-b border-stone-800 bg-stone-900/80 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  id="edit-journal-title-input"
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitleText(journal.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="text-sm font-semibold bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1 text-stone-100 focus:outline-hidden focus:border-amber-500 w-full max-w-md"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 group">
                <h1 className="text-sm sm:text-base font-serif font-medium tracking-tight text-stone-100 truncate">
                  {journal.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  title="Rename Journal"
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-stone-300 transition-opacity"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(journal.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span>&bull;</span>
              <span>{journal.messages.length} reflections</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="export-markdown-btn"
            type="button"
            onClick={handleExportMarkdown}
            title="Export Markdown Transcript"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            id="save-and-summarize-btn"
            type="button"
            onClick={onSummarize}
            disabled={isSummarizing || journal.messages.length < 2}
            title={journal.messages.length < 2 ? "Write a few messages to enable AI summarization" : "Summarize session with Gemini"}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSummarizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Save &amp; Summarize</span>
                <span className="sm:hidden">Summarize</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <div id="messages-scroll-area" className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Render Summary Card if exists */}
        {journal.summary && (
          <div className="mb-6">
            <SummaryCard summary={journal.summary} />
          </div>
        )}

        {/* Messages Flow */}
        {journal.messages.map((message) => {
          const isUser = message.sender === 'user';

          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Gemini Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-stone-850 border border-stone-700/80 flex items-center justify-center text-amber-400 shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-amber-600/90 text-stone-50 rounded-tr-xs shadow-md selection:bg-amber-800'
                    : 'bg-stone-850 border border-stone-800 text-stone-200 rounded-tl-xs shadow-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap font-sans">{message.content}</p>
                ) : (
                  <div className="markdown-body prose prose-invert prose-stone max-w-none text-stone-200 text-xs sm:text-sm leading-relaxed space-y-2">
                    <Markdown>{message.content}</Markdown>
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] flex items-center gap-1 ${
                    isUser ? 'text-amber-200/75 justify-end' : 'text-stone-500 justify-start'
                  }`}
                >
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isUser && <span>&bull; Gemini 2.5 Flash</span>}
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-300 shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* AI Generating Pulse */}
        {isGeneratingReply && (
          <div id="ai-generating-indicator" className="flex items-start gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-stone-850 border border-stone-700/80 flex items-center justify-center text-amber-400 shrink-0 mt-1 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-stone-850 border border-stone-800 rounded-2xl rounded-tl-xs p-4 text-xs text-stone-400 flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
              </div>
              <span className="text-stone-400 text-xs">Reflecting deeply...</span>
            </div>
          </div>
        )}

        {/* Empty / Prompt Starters State when few messages */}
        {journal.messages.length <= 1 && (
          <div className="pt-4 pb-2 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Suggested Reflection Prompts
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {promptStarters.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="p-3 rounded-xl bg-stone-850/60 hover:bg-stone-850 border border-stone-800/80 hover:border-amber-500/30 text-left text-xs text-stone-300 hover:text-stone-100 transition-all duration-150 flex items-center justify-between group cursor-pointer"
                >
                  <span className="leading-snug">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Area */}
      <footer id="workspace-composer" className="p-4 border-t border-stone-800 bg-stone-900/90 shrink-0">
        <div className="max-w-4xl mx-auto w-full">
          <div className="relative bg-stone-850 border border-stone-800 rounded-2xl p-2.5 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all shadow-lg">
            <textarea
              id="journal-message-input"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reflection, thoughts, questions, or journal entry... (Cmd/Ctrl + Enter to send)"
              disabled={isGeneratingReply}
              className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden p-2 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 px-2 text-xs">
              <div className="flex items-center space-x-2 text-[11px] text-stone-500">
                <span className="hidden sm:inline">Press Enter or Cmd+Enter to send</span>
                <span className="sm:hidden">Send message</span>
                <span>&bull;</span>
                <span>{inputText.length} chars</span>
              </div>

              <button
                id="send-message-btn"
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || isGeneratingReply}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-medium hover:bg-amber-400 active:scale-95 transition-all text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
