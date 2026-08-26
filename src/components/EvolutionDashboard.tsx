import { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Shuffle, 
  ShieldCheck, 
  RefreshCw, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Menu,
  ChevronRight,
  Flame
} from 'lucide-react';
import type { Journal, EvolutionAnalysis } from '../types';

interface EvolutionDashboardProps {
  journals: Journal[];
  analysis: EvolutionAnalysis | null;
  isLoading: boolean;
  onRunAnalysis: () => Promise<void>;
  onOpenMobileSidebar?: () => void;
  onNavigateToJournal?: (journalId: string) => void;
}

export function EvolutionDashboard({
  journals,
  analysis,
  isLoading,
  onRunAnalysis,
  onOpenMobileSidebar,
  onNavigateToJournal,
}: EvolutionDashboardProps) {
  const summarizedJournals = journals.filter((j) => Boolean(j.summary));
  const hasSufficientData = summarizedJournals.length >= 2;

  const getTrendBadge = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <TrendingUp className="w-3 h-3" />
            <span>Increasing</span>
          </span>
        );
      case 'decreasing':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-800 text-stone-400 border border-stone-700 whitespace-nowrap">
            <TrendingDown className="w-3 h-3" />
            <span>Decreasing</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <Minus className="w-3 h-3" />
            <span>Stable</span>
          </span>
        );
    }
  };

  const getCommitmentBadge = (status: 'emerging' | 'repeated' | 'resolved' | 'abandoned') => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      case 'repeated':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Flame className="w-3 h-3" />
            <span>Repeated</span>
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-800 text-stone-500 border border-stone-700 whitespace-nowrap">
            <span>Abandoned</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            <span>Emerging</span>
          </span>
        );
    }
  };

  return (
    <main id="evolution-dashboard-view" className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 bg-stone-900/60 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold text-stone-100 tracking-tight">Journal Evolution Intelligence</h1>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                Longitudinal Synthesis
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Generated only from your private journal history.
            </p>
          </div>
        </div>

        {/* Action button & Security Badge */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Analyzed from your UID-scoped private vault</span>
          </div>

          <button
            id="run-evolution-analysis-btn"
            type="button"
            disabled={isLoading || !hasSufficientData}
            onClick={onRunAnalysis}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              !hasSufficientData
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
                : isLoading
                ? 'bg-amber-500/50 text-stone-950 cursor-wait'
                : 'bg-amber-400 text-stone-950 hover:bg-amber-300 active:scale-[0.98] shadow-md'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Synthesizing...' : analysis ? 'Re-analyze Vault' : 'Analyze Evolution'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Mobile Security Notice */}
        <div className="sm:hidden flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Analyzed from your UID-scoped private vault</span>
        </div>

        {/* Empty State: Fewer than 2 Summarized Journals */}
        {!hasSufficientData ? (
          <div id="evolution-empty-state" className="p-8 md:p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center mx-auto text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-base font-semibold text-stone-200">Insufficient Summarized Data</h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                Create and summarize at least two journal sessions to unlock Evolution Intelligence.
              </p>
              <div className="pt-2 text-xs text-stone-500 font-mono">
                Current summarized journals: {summarizedJournals.length} / 2 required
              </div>
            </div>
          </div>
        ) : !analysis && !isLoading ? (
          /* Prompt to run first analysis */
          <div className="p-8 md:p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-base font-semibold text-stone-200">Ready for Longitudinal Synthesis</h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                You have {summarizedJournals.length} summarized journal sessions. Click below to run a private analysis of recurring themes, decision drift, open questions, and commitment evolution.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onRunAnalysis}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-stone-950 font-semibold text-xs hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  Generate Evolution Intelligence
                </button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 space-y-4 animate-pulse">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-stone-200">Synthesizing Longitudinal Insights</h3>
              <p className="text-xs text-stone-400">
                Examining summarized themes, decisions, and trajectory across {summarizedJournals.length} journal sessions...
              </p>
            </div>
          </div>
        ) : analysis ? (
          /* Populated Evolution Intelligence Dashboard */
          <div id="evolution-analysis-content" className="space-y-6">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  Last synthesized: {analysis.generatedAt ? new Date(analysis.generatedAt).toLocaleString() : 'Just now'}
                </span>
              </div>
              <div className="font-mono text-[11px] text-amber-400/90">
                {analysis.analyzedJournalsCount || summarizedJournals.length} journal sessions synthesized
              </div>
            </div>

            {/* Overall Reflection Card */}
            <div id="overall-reflection-section" className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-900/80 border border-stone-800 space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-amber-400">
                <Sparkles className="w-4 h-4" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-200">Overall Synthesis & Reflection</h2>
              </div>
              <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">
                {analysis.overallReflection}
              </p>
            </div>

            {/* Bento Grid: Recurring Themes & Priority Changes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Recurring Themes */}
              <div id="recurring-themes-section" className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center space-x-2 text-stone-200">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold">Recurring Themes</h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    {analysis.recurringThemes.length} Identified
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {analysis.recurringThemes.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4">No recurring cross-session themes detected yet.</p>
                  ) : (
                    analysis.recurringThemes.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl bg-stone-850 border border-stone-800/80 space-y-2 hover:border-stone-700/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-stone-100 leading-snug">
                            {item.theme}
                          </span>
                          {getTrendBadge(item.trend)}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-stone-400">
                          <span className="font-mono text-amber-400/90 bg-stone-800 px-1.5 py-0.5 rounded text-[10px]">
                            {item.frequency} {item.frequency === 1 ? 'session' : 'sessions'}
                          </span>
                          {item.evidence && item.evidence.length > 0 && (
                            <span className="text-stone-500 text-[10px] truncate max-w-full">
                              Evidence: {item.evidence.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. Priority Evolution */}
              <div id="priority-changes-section" className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center space-x-2 text-stone-200">
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold">Priority Evolution</h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    {analysis.priorityChanges.length} Shifts
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {analysis.priorityChanges.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4">Priorities have remained steady across recorded sessions.</p>
                  ) : (
                    analysis.priorityChanges.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl bg-stone-850 border border-stone-800/80 space-y-2 hover:border-stone-700/80 transition-colors"
                      >
                        <div className="flex items-center space-x-2 text-xs font-medium">
                          <span className="text-stone-400 bg-stone-800 px-2 py-0.5 rounded text-[11px] truncate">
                            {item.from}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px] truncate font-semibold">
                            {item.to}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed pt-1">
                          {item.explanation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bento Grid: Unresolved Questions & Decision Drift */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3. Unresolved Questions */}
              <div id="unresolved-questions-section" className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center space-x-2 text-stone-200">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold">Unresolved Questions Carried Across Sessions</h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    {analysis.unresolvedQuestions.length} Tracked
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {analysis.unresolvedQuestions.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4">No recurring open questions detected.</p>
                  ) : (
                    analysis.unresolvedQuestions.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl bg-stone-850 border border-stone-800/80 space-y-2 hover:border-stone-700/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-stone-200 leading-snug">
                            "{item.question}"
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                            item.stillOpen 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {item.stillOpen ? 'Open' : 'Answered'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-stone-500 pt-1 font-mono">
                          {item.firstSeen && <span>First seen: {item.firstSeen}</span>}
                          {item.lastSeen && <span>&bull; Latest: {item.lastSeen}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Decision Drift */}
              <div id="decision-drift-section" className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center space-x-2 text-stone-200">
                    <Shuffle className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold">Decision Drift & Perspective Shifts</h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    {analysis.decisionDrift.length} Recorded
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {analysis.decisionDrift.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4">No significant decision drift observed across sessions.</p>
                  ) : (
                    analysis.decisionDrift.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl bg-stone-850 border border-stone-800/80 space-y-2 hover:border-stone-700/80 transition-colors"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start space-x-2">
                            <span className="text-stone-500 text-[10px] uppercase font-mono mt-0.5 shrink-0">Earlier:</span>
                            <span className="text-stone-400 line-through decoration-stone-600">{item.earlierPosition}</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-400 text-[10px] uppercase font-mono mt-0.5 shrink-0">Later:</span>
                            <span className="text-stone-100 font-medium">{item.laterPosition}</span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 pt-1 border-t border-stone-800/60 leading-relaxed">
                          {item.interpretation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 5. Commitments & Intentions */}
            <div id="commitments-section" className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2 text-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold">Commitments & Repeated Intentions</h3>
                </div>
                <span className="text-[11px] font-mono text-stone-500">
                  {analysis.commitments.length} Monitored
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.commitments.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 col-span-2">No explicit commitments recorded across sessions.</p>
                ) : (
                  analysis.commitments.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl bg-stone-850 border border-stone-800/80 flex items-start justify-between gap-3 hover:border-stone-700/80 transition-colors"
                    >
                      <span className="text-xs text-stone-200 font-medium leading-relaxed">
                        {item.commitment}
                      </span>
                      {getCommitmentBadge(item.status)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
