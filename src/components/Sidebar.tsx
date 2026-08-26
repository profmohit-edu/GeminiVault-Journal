import { useState } from 'react';
import { 
  Lock, 
  Plus, 
  Search, 
  BookOpen, 
  Trash2, 
  ShieldCheck, 
  LogOut, 
  MessageSquare, 
  Sparkles,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import type { Journal } from '../types';
import type { User } from '../lib/firebase';

interface SidebarProps {
  journals: Journal[];
  activeJournalId: string | null;
  activeView: 'journal' | 'evolution';
  onSelectJournal: (journalId: string) => void;
  onSelectView: (view: 'journal' | 'evolution') => void;
  onNewJournal: () => void;
  onDeleteJournal: (journalId: string) => void;
  onOpenSecurityModal: () => void;
  onSignOut: () => void;
  currentUser: User;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  journals,
  activeJournalId,
  activeView,
  onSelectJournal,
  onSelectView,
  onNewJournal,
  onDeleteJournal,
  onOpenSecurityModal,
  onSignOut,
  currentUser,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const summarizedCount = journals.filter((j) => Boolean(j.summary)).length;

  const filteredJournals = journals.filter((j) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = j.title.toLowerCase().includes(q);
    const themeMatch = j.summary?.themes?.some((t) => t.toLowerCase().includes(q));
    return titleMatch || themeMatch;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 md:hidden backdrop-blur-xs" 
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 bg-stone-900 border-r border-stone-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="p-4 border-b border-stone-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-stone-100 text-sm tracking-tight">GeminiVault</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-stone-800 text-amber-400/90 font-mono border border-stone-700">
                  Journal
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Journal Action */}
          <button
            id="new-journal-btn"
            onClick={() => {
              onNewJournal();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-stone-100 text-stone-900 text-xs font-semibold hover:bg-white active:scale-[0.99] transition-all duration-150 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Session</span>
          </button>

          {/* Search Box */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search journals or themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-850 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500/50"
            />
          </div>

          {/* Navigation Item: Evolution Intelligence */}
          <div className="mt-3">
            <button
              id="nav-evolution-intelligence-btn"
              type="button"
              onClick={() => {
                onSelectView('evolution');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                activeView === 'evolution'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-stone-300 hover:bg-stone-850 hover:text-stone-100 border border-stone-800/80 bg-stone-850/40'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`p-1 rounded-lg ${activeView === 'evolution' ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-800 text-stone-400'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold">Evolution Intelligence</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                summarizedCount >= 2
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-stone-800 text-stone-500'
              }`}>
                {summarizedCount >= 2 ? `${summarizedCount} ready` : `${summarizedCount}/2`}
              </span>
            </button>
          </div>
        </div>

        {/* Journal Entries List */}
        <div id="journals-list-container" className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 flex items-center justify-between">
            <span>Your Journals</span>
            <span className="text-[10px] font-mono">{filteredJournals.length}</span>
          </div>

          {filteredJournals.length === 0 ? (
            <div className="p-6 text-center text-stone-500 text-xs space-y-1">
              <BookOpen className="w-6 h-6 mx-auto text-stone-600 mb-2" />
              <p>No journal entries found</p>
              <p className="text-[11px] text-stone-600">Start a new session to begin reflection</p>
            </div>
          ) : (
            filteredJournals.map((journal) => {
              const isActive = activeView === 'journal' && journal.id === activeJournalId;
              const dateStr = new Date(journal.updatedAt || journal.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={journal.id}
                  id={`journal-item-${journal.id}`}
                  onClick={() => {
                    onSelectJournal(journal.id);
                    onSelectView('journal');
                    onCloseMobile();
                  }}
                  className={`group relative flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-stone-800/90 text-stone-100 border border-stone-700 shadow-xs'
                      : 'text-stone-400 hover:bg-stone-850 hover:text-stone-200 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-medium truncate text-stone-200">
                        {journal.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-stone-500">
                      <span>{dateStr}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {journal.messages?.length || 0}
                      </span>
                      {journal.summary && (
                        <span className="flex items-center gap-0.5 text-amber-400/90 bg-amber-500/10 px-1.5 py-0.2 rounded text-[10px]">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Summarized</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Action (visible on hover) */}
                  <button
                    type="button"
                    title="Delete Journal"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${journal.title}"? This cannot be undone.`)) {
                        onDeleteJournal(journal.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & User Profile */}
        <div className="p-3 border-t border-stone-800 space-y-2 bg-stone-900/90">
          {/* Privacy & Security Modal Trigger */}
          <button
            id="open-security-inspector-btn"
            type="button"
            onClick={onOpenSecurityModal}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Security</span>
            </div>
            <span className="text-[10px] text-emerald-400/90 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
              Isolated
            </span>
          </button>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-850/50 border border-stone-800/60">
            <div className="flex items-center space-x-2.5 min-w-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-stone-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-xs font-semibold text-stone-200 shrink-0">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-stone-200 truncate">
                  {currentUser.displayName || 'Journal Owner'}
                </div>
                <div className="text-[10px] text-stone-500 truncate font-mono">
                  {currentUser.email || currentUser.uid.slice(0, 12) + '...'}
                </div>
              </div>
            </div>

            <button
              id="sign-out-btn"
              type="button"
              title="Sign Out"
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
