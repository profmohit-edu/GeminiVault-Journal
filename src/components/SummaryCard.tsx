import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, CheckCircle, HelpCircle, ArrowRight, Tag, Lightbulb, FileText } from 'lucide-react';
import type { JournalSummary } from '../types';

interface SummaryCardProps {
  summary: JournalSummary;
  onClose?: () => void;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div id="journal-summary-card" className="bg-stone-900 border border-amber-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200">
      {/* Amber subtle background accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
              <span>Cognitive Summary & Synthesis</span>
              <span className="text-[10px] font-mono font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Gemini AI
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">
              Generated {new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Persisted to private vault
            </p>
          </div>
        </div>

        <button 
          type="button"
          aria-label={expanded ? "Collapse summary" : "Expand summary"}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Collapsible Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-stone-800/80 space-y-4 text-xs">
          {/* Executive Narrative */}
          {summary.rawSummaryText && (
            <div className="bg-stone-850/70 border border-stone-800 rounded-xl p-3.5 text-stone-300 leading-relaxed">
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Executive Synthesis
              </div>
              <p className="whitespace-pre-line text-xs font-serif leading-relaxed text-stone-200">{summary.rawSummaryText}</p>
            </div>
          )}

          {/* Themes Tags */}
          {summary.themes && summary.themes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Major Themes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.themes.map((theme, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-lg bg-stone-800 text-amber-200/90 border border-stone-700/80 text-[11px] font-medium"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Ideas & Decisions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Key Ideas */}
            {summary.keyIdeas && summary.keyIdeas.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-850/60 border border-stone-800">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Key Insights
                </div>
                <ul className="space-y-1.5">
                  {summary.keyIdeas.map((idea, i) => (
                    <li key={i} className="text-stone-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 mt-1.5 shrink-0" />
                      <span className="text-[11px] leading-relaxed">{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decisions */}
            {summary.decisions && summary.decisions.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-850/60 border border-stone-800">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Decisions Clarified
                </div>
                <ul className="space-y-1.5">
                  {summary.decisions.map((dec, i) => (
                    <li key={i} className="text-stone-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="text-[11px] leading-relaxed">{dec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Unresolved Questions & Next Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Questions */}
            {summary.unresolvedQuestions && summary.unresolvedQuestions.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-850/60 border border-stone-800">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  Open Questions
                </div>
                <ul className="space-y-1.5">
                  {summary.unresolvedQuestions.map((q, i) => (
                    <li key={i} className="text-stone-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                      <span className="text-[11px] leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {summary.nextSteps && summary.nextSteps.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-850/60 border border-stone-800">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  Potential Next Steps
                </div>
                <ul className="space-y-1.5">
                  {summary.nextSteps.map((step, i) => (
                    <li key={i} className="text-stone-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span className="text-[11px] leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
