import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { ChevronDown, ChevronUp, Quote, Check, AlertCircle, Code, Cpu } from 'lucide-react';

export default function EvidenceCard({ event, sequence }) {
  const [expanded, setExpanded] = useState(true);

  const criteriaDemo = Array.isArray(event.criteria_demonstrated)
    ? event.criteria_demonstrated
    : JSON.parse(event.criteria_demonstrated || '[]');

  const criteriaUncert = Array.isArray(event.criteria_uncertain)
    ? event.criteria_uncertain
    : JSON.parse(event.criteria_uncertain || '[]');

  const excerpts = Array.isArray(event.supporting_excerpts)
    ? event.supporting_excerpts
    : JSON.parse(event.supporting_excerpts || '[]');

  const isCodeChallenge = Boolean(event.code_results || event.evaluator_type === 'isolated_test_runner');

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            #{sequence || event.event_sequence}
          </span>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Competency:
            </span>
            <span className="ml-1.5 text-sm font-semibold text-slate-900">
              {event.competency_name || 'Core Assessment'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={event.evaluation_status} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Question Prompt */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Question Administered
          </div>
          <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
            {event.question_text}
          </p>
        </div>

        {expanded && (
          <>
            {/* Candidate Response Excerpt */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <span>Candidate Response</span>
                {isCodeChallenge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-600">
                    <Code className="h-3 w-3" /> Python Code Execution
                  </span>
                )}
              </div>
              <div className="relative rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-100 text-xs font-mono overflow-x-auto max-h-48">
                <pre className="whitespace-pre-wrap">{event.candidate_response}</pre>
              </div>
            </div>

            {/* Rubric Evaluation Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Demonstrated Criteria */}
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                  <Check className="h-3.5 w-3.5" />
                  Criteria Demonstrated ({criteriaDemo.length})
                </div>
                {criteriaDemo.length > 0 ? (
                  <ul className="space-y-2">
                    {criteriaDemo.map((c, idx) => (
                      <li key={idx} className="text-xs">
                        <div className="font-semibold text-emerald-900">{c.name}</div>
                        {c.supportingExcerpt && (
                          <div className="mt-1 flex items-start gap-1 text-slate-600 bg-white/80 p-1.5 rounded border border-emerald-100">
                            <Quote className="h-3 w-3 shrink-0 text-emerald-500 mt-0.5" />
                            <span className="italic">"{c.supportingExcerpt}"</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No criteria demonstrated in this response.</p>
                )}
              </div>

              {/* Unresolved Gaps */}
              <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Unresolved Criteria / Gaps ({criteriaUncert.length})
                </div>
                {criteriaUncert.length > 0 ? (
                  <ul className="space-y-2">
                    {criteriaUncert.map((u, idx) => (
                      <li key={idx} className="text-xs">
                        <div className="font-semibold text-amber-900">{u.name}</div>
                        <div className="text-slate-600 mt-0.5">{u.missingReason || u.reason}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">All evaluated criteria successfully satisfied.</p>
                )}
              </div>
            </div>

            {/* Evaluation Reasoning */}
            {event.evaluation_reasoning && (
              <div className="rounded-lg bg-slate-100/70 p-3 text-xs text-slate-700 border border-slate-200">
                <span className="font-semibold text-slate-900">Evaluation Rationale: </span>
                {event.evaluation_reasoning}
              </div>
            )}

            {/* Adaptive Trigger */}
            {event.follow_up_reason && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-2.5 text-xs text-indigo-900 flex items-start gap-2">
                <Cpu className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Adaptive Trigger: </span>
                  {event.follow_up_reason}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
