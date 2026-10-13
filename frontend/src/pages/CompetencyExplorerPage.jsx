import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Activity,
  Check,
  AlertCircle,
  Quote,
  ArrowRight,
  Compass,
  Sparkles
} from 'lucide-react';

export default function CompetencyExplorerPage({ assessmentId, navigate }) {
  const [data, setData] = useState(null);
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getCompetencies(assessmentId);
        setData(res);
        if (res.competencies && res.competencies.length > 0) {
          setSelectedCompId(res.competencies[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (assessmentId) {
      load();
    } else {
      setLoading(false);
      setError('No assessment selected.');
    }
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading Competency Map...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-slate-600">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-2 text-xs font-medium">{error || 'Competencies could not be loaded.'}</p>
        <button
          onClick={() => navigate('landing')}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const competencies = data.competencies || [];
  const selectedComp = competencies.find((c) => c.id === selectedCompId) || competencies[0];

  const demonstratedCount = competencies.filter((c) => c.current_status === 'demonstrated').length;
  const partialCount = competencies.filter((c) => c.current_status === 'partially_demonstrated').length;
  const untestedCount = competencies.filter((c) => c.current_status === 'not_assessed').length;
  const coveragePercent =
    competencies.length > 0
      ? Math.round(((competencies.length - untestedCount) / competencies.length) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Competency Intelligence Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.assessmentTitle || 'Role skill demonstration and knowledge gap analysis'}
          </p>
        </div>

        <button
          onClick={() => navigate('interview', { id: assessmentId })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <span>Return to Workspace</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Role Skills
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{competencies.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Curriculum mapped</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Fully Demonstrated
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{demonstratedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified with evidence</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Partially Demonstrated
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{partialCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active drill-down targets</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
            Assessment Coverage
          </div>
          <div className="mt-1 text-2xl font-bold text-indigo-600">{coveragePercent}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{untestedCount} untested domains</div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Visual Competency Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Role Competencies ({competencies.length})
          </div>

          <div className="space-y-2.5">
            {competencies.map((comp) => {
              const isSelected = comp.id === selectedCompId;
              const isDemonstrated = comp.current_status === 'demonstrated';
              const isPartial = comp.current_status === 'partially_demonstrated';
              const isInsufficient = comp.current_status === 'insufficient_evidence';

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompId(comp.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all text-xs ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm break-words leading-snug">
                        {comp.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {comp.category} • Weight: {comp.weight}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={comp.current_status} size="sm" />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {comp.description}
                  </p>

                  {/* Progress Indicator */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Inquiries Asked: {comp.questionsAskedCount || 0}</span>
                    <span className="font-medium text-slate-700">
                      Quotes: {comp.evidenceQuotes?.length || 0}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isDemonstrated
                          ? 'bg-emerald-500 w-full'
                          : isPartial
                          ? 'bg-amber-500 w-1/2'
                          : isInsufficient
                          ? 'bg-rose-500 w-1/4'
                          : 'bg-transparent w-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep-Dive Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedComp ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Competency Card Header */}
              <div className="border-b border-slate-100 pb-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Competency Details
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 break-words">
                      {selectedComp.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedComp.description}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={selectedComp.current_status} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                    Category: {selectedComp.category}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                    Weight: {selectedComp.weight}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                    Times Assessed: {selectedComp.times_assessed}x
                  </span>
                </div>
              </div>

              {/* Verified Evidence Criteria */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Demonstrated Criteria ({selectedComp.demonstratedCriteria?.length || 0})</span>
                </div>

                {selectedComp.demonstratedCriteria?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedComp.demonstratedCriteria.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 text-xs"
                      >
                        <div className="font-semibold text-emerald-900">{item.name || item.criterionName}</div>
                        {item.supportingExcerpt && (
                          <div className="mt-1.5 flex items-start gap-1.5 bg-white p-2 rounded border border-emerald-100 text-[11px] text-slate-700">
                            <Quote className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                            <span className="italic leading-relaxed">"{item.supportingExcerpt}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No criteria demonstrated for this competency yet.
                  </p>
                )}
              </div>

              {/* Unresolved Gaps */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Unresolved Knowledge Gaps ({selectedComp.missingGaps?.length || 0})</span>
                </div>

                {selectedComp.missingGaps?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedComp.missingGaps.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-amber-100 bg-amber-50/30 p-3 text-xs"
                      >
                        <div className="font-semibold text-amber-900">{item.name || item.criterionName}</div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {item.missingReason || item.reason || 'Criteria not yet demonstrated in candidate response.'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No unresolved gaps recorded.
                  </p>
                )}
              </div>

              {/* Recommended Next Assessment Inquiry */}
              {selectedComp.recommendedNextAssessment && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Adaptive Engine Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {selectedComp.recommendedNextAssessment}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              Select a competency on the left to inspect evidence citations and rubric gaps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
