import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  History,
  Compass,
  ArrowRight,
  Quote,
  Check,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Code,
  Search,
  Filter
} from 'lucide-react';

export default function EvidenceTimelinePage({ assessmentId, navigate }) {
  const [events, setEvents] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'demonstrated', 'gaps'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const asmtData = await api.getAssessment(assessmentId);
        setAssessment(asmtData.assessment);

        const evData = await api.getEvents(assessmentId);
        setEvents(evData.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (assessmentId) load();
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading Evidence Timeline...</p>
        </div>
      </div>
    );
  }

  const filteredEvents = events.filter((e) => {
    if (filter === 'demonstrated' && e.evaluation_status !== 'demonstrated') return false;
    if (filter === 'gaps' && e.evaluation_status === 'demonstrated') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.question_text?.toLowerCase().includes(q) ||
        e.competency_name?.toLowerCase().includes(q) ||
        e.candidate_response?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Evidence Audit Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {assessment?.candidate_name ? `${assessment.candidate_name} • ${assessment.job_title}` : 'Chronological audit log of assessment responses and adaptive decisions'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilter('demonstrated')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                filter === 'demonstrated'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fully Demonstrated
            </button>
            <button
              onClick={() => setFilter('gaps')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                filter === 'gaps'
                  ? 'bg-white text-amber-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gaps Only
            </button>
          </div>

          <button
            onClick={() => navigate('interview', { id: assessmentId })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            Workspace
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-white">
          <History className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-800">No Assessment Events Recorded</p>
          <p className="text-xs text-slate-500 mt-1">
            Answer questions in the workspace to construct the chronological evidence timeline.
          </p>
          <button
            onClick={() => navigate('interview', { id: assessmentId })}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Start Assessment
          </button>
        </div>
      ) : (
        /* Visual Vertical Timeline Layout */
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 space-y-6">
          {filteredEvents.map((ev, idx) => {
            const isDemo = ev.evaluation_status === 'demonstrated';
            const isPartial = ev.evaluation_status === 'partially_demonstrated';
            const demoCriteria = Array.isArray(ev.criteria_demonstrated)
              ? ev.criteria_demonstrated
              : JSON.parse(ev.criteria_demonstrated || '[]');
            const gaps = Array.isArray(ev.criteria_uncertain)
              ? ev.criteria_uncertain
              : JSON.parse(ev.criteria_uncertain || '[]');
            const quotes = Array.isArray(ev.supporting_excerpts)
              ? ev.supporting_excerpts
              : JSON.parse(ev.supporting_excerpts || '[]');

            return (
              <div key={ev.id || idx} className="relative group">
                {/* Timeline Step Node Circle */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs border-2 border-white ring-2 ${
                    isDemo
                      ? 'bg-emerald-600 ring-emerald-200'
                      : isPartial
                      ? 'bg-amber-500 ring-amber-200'
                      : 'bg-rose-500 ring-rose-200'
                  }`}
                >
                  {ev.event_sequence || idx + 1}
                </div>

                {/* Event Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5 transition-all hover:border-slate-300">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {ev.competency_name || 'Technical Inquiry'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Sequence #{ev.event_sequence}
                      </span>
                    </div>
                    <StatusBadge status={ev.evaluation_status} size="sm" />
                  </div>

                  {/* Question Administered */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Inquiry Administered
                    </div>
                    <div className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                      {ev.question_text}
                    </div>
                  </div>

                  {/* Candidate Response snippet */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Observed Candidate Response
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-200 text-xs font-mono max-h-36 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{ev.candidate_response}</pre>
                    </div>
                  </div>

                  {/* Verbatim Quotes Highlight */}
                  {quotes.length > 0 && (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 text-xs space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                        <Quote className="h-3 w-3" />
                        <span>Verbatim Evidence Quote Citations</span>
                      </div>
                      {quotes.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="italic text-slate-700 bg-white/80 p-2 rounded border border-indigo-100"
                        >
                          "{q}"
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rubric Criteria Demonstrated vs Uncertain */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Satisfied Criteria */}
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-2.5 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Satisfied Criteria ({demoCriteria.length})</span>
                      </div>
                      {demoCriteria.length > 0 ? (
                        <ul className="space-y-1">
                          {demoCriteria.map((c, cIdx) => (
                            <li key={cIdx} className="text-slate-700 text-[11px]">
                              • <strong className="text-emerald-950">{c.name}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">None satisfied</p>
                      )}
                    </div>

                    {/* Knowledge Gaps */}
                    <div className="rounded-lg border border-amber-100 bg-amber-50/30 p-2.5 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        <span>Unresolved Gaps ({gaps.length})</span>
                      </div>
                      {gaps.length > 0 ? (
                        <ul className="space-y-1">
                          {gaps.map((g, gIdx) => (
                            <li key={gIdx} className="text-slate-700 text-[11px]">
                              • <strong className="text-amber-950">{g.name}</strong>:{' '}
                              <span className="text-slate-600">{g.missingReason || g.reason}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">All criteria met</p>
                      )}
                    </div>
                  </div>

                  {/* Adaptive Branching Rationale */}
                  {ev.follow_up_reason && (
                    <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-indigo-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <GitBranch className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                          Adaptive Selection:
                        </span>{' '}
                        <span className="text-slate-700">{ev.follow_up_reason}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
