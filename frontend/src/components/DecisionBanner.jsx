import React from 'react';
import { Compass, GitBranch, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function DecisionBanner({ decision, compact = false }) {
  if (!decision) return null;

  const ruleLabels = {
    RULE_TARGETED_GAP_FOLLOW_UP: 'Path A: Targeted Gap Follow-up (Drill-down)',
    RULE_BROADEN_COVERAGE_HIGH_PRIORITY: 'Path B: Competency Broadening (Multi-Skill Coverage)',
    RULE_SAME_COMPETENCY_SECONDARY_PROBE: 'Secondary Inquiry on Inconclusive Skill',
    RULE_MAX_QUESTIONS_REACHED: 'Question Budget Satisfied',
    RULE_ALL_COMPETENCIES_DEMONSTRATED: 'Comprehensive Evidence Collected',
    RULE_QUESTION_BANK_EXHAUSTED: 'Exhaustive Review Completed'
  };

  const ruleName = ruleLabels[decision.decision_rule] || decision.decision_rule || 'Adaptive Decision Engine';
  const alternatives = Array.isArray(decision.alternatives_considered)
    ? decision.alternatives_considered
    : (typeof decision.alternatives_considered === 'string' ? JSON.parse(decision.alternatives_considered || '[]') : []);

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:border-indigo-200">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-sm">
          <Compass className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Adaptive Selection Rationale
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-indigo-100/80 px-2 py-0.5 text-[11px] font-medium text-indigo-800">
              <GitBranch className="h-3 w-3" />
              {ruleName}
            </span>
          </div>

          <p className="mt-1.5 text-sm text-slate-800 leading-relaxed font-medium">
            {decision.decision_rationale}
          </p>

          {!compact && alternatives.length > 0 && (
            <div className="mt-3 border-t border-indigo-100/80 pt-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Alternatives Evaluated & Discarded:
              </span>
              <ul className="mt-1 space-y-1">
                {alternatives.map((alt, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" />
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
