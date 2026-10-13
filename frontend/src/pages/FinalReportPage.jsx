import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  FileText,
  Printer,
  Copy,
  Check,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Quote,
  Layers,
  Activity,
  Compass,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function FinalReportPage({ assessmentId, navigate }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getReport(assessmentId);
        if (!data || !data.report || !data.assessment) {
          throw new Error('Report data is not available for this assessment.');
        }
        setReportData(data);
      } catch (err) {
        setError(err.message || 'Failed to load report');
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

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    if (!reportData || !reportData.assessment || !reportData.report) return;
    const { assessment, report } = reportData;

    let md = `# ProofPath Evidence-Backed Technical Assessment Report\n\n`;
    md += `**Candidate:** ${assessment.candidate_name}\n`;
    md += `**Role:** ${assessment.job_title}\n`;
    md += `**Coverage Score:** ${report.coverage_score}%\n`;
    md += `**Assessment Date:** ${new Date(report.created_at).toLocaleDateString()}\n\n`;
    md += `## Executive Summary\n${report.summary}\n\n`;

    md += `## Competency Evidence Breakdown\n`;
    for (const c of report.competency_breakdown || []) {
      md += `### ${c.name} (${c.current_status})\n`;
      md += `- Category: ${c.category} (Weight: ${c.weight})\n`;
      md += `- Inquiries Administered: ${c.times_assessed}\n\n`;
    }

    md += `## Verified Technical Evidence\n`;
    for (const v of report.verified_evidence || []) {
      md += `- **${v.criterionName}**: "${v.excerpt}" (Question: ${v.question})\n`;
    }

    md += `\n## Unverified Claims & Knowledge Gaps\n`;
    for (const u of report.unverified_claims || []) {
      md += `- **${u.criterionName}**: ${u.missingReason}\n`;
    }

    md += `\n## Recommended Follow-up Inquiries for Human Interviewers\n`;
    for (const s of report.recommended_next_steps || []) {
      md += `- ${s}\n`;
    }

    md += `\n## Limitations & Ethics\n${report.limitations_disclosure}\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Compiling Evidence Report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData || !reportData.assessment || !reportData.report) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-slate-600">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-2 text-xs font-medium">{error || 'Report could not be loaded.'}</p>
        <button
          onClick={() => navigate('landing')}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { assessment, report } = reportData;
  const coverageScore = report.coverage_score || 0;
  const verifiedList = report.verified_evidence || [];
  const unverifiedList = report.unverified_claims || [];
  const untestedList = report.untested_areas || [];
  const nextSteps = report.recommended_next_steps || [];
  const competencyList = report.competency_breakdown || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
              Official Assessment Record
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-xs text-slate-400">{assessment.id}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Evidence-Backed Assessment Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
            <span>{assessment.candidate_name} • {assessment.job_title}</span>
            {assessment.resume_filename && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                <FileText className="h-3 w-3" />
                <span>Resume: {assessment.resume_filename}</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* VISUAL TELEMETRY & COVERAGE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
        {/* Visual Coverage Gauge Card */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-xs flex flex-col justify-between text-center md:text-left">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Evidence Coverage
            </span>
            <div className="mt-2 flex items-baseline justify-center md:justify-start gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-indigo-950">
                {coverageScore}%
              </span>
              <span className="text-xs font-semibold text-indigo-600">Score</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-indigo-200 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${coverageScore}%` }}
              />
            </div>
            <p className="text-[10px] text-indigo-800 font-medium mt-1.5">
              Verified across core curriculum
            </p>
          </div>
        </div>

        {/* Metric 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Verified Evidence
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{verifiedList.length}</div>
          <div className="text-[11px] text-slate-400">Concrete quote excerpts</div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Unverified Gaps
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{unverifiedList.length}</div>
          <div className="text-[11px] text-slate-400">Missing criteria identified</div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Untested Domains
            </span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700">{untestedList.length}</div>
          <div className="text-[11px] text-slate-400">Candidate not yet probed</div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Executive Technical Assessment Summary
        </h3>
        <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100">
          {report.summary}
        </p>
      </div>

      {/* Visual Competency Breakdown Meters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Competency Demonstration Breakdown
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            {competencyList.length} Skills
          </span>
        </div>

        <div className="space-y-3">
          {competencyList.map((comp) => {
            const isDemonstrated = comp.current_status === 'demonstrated';
            const isPartial = comp.current_status === 'partially_demonstrated';
            const isInsufficient = comp.current_status === 'insufficient_evidence';

            return (
              <div
                key={comp.id}
                className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900">{comp.name}</span>
                    <span className="text-slate-400 ml-2">
                      ({comp.category} • Weight: {comp.weight})
                    </span>
                  </div>
                  <StatusBadge status={comp.current_status} size="sm" />
                </div>

                {/* Meter */}
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
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
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    Inquiries: {comp.times_assessed || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO-COLUMN EVIDENCE COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* COLUMN 1: Verified Technical Evidence Cards */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              Verified Technical Evidence ({verifiedList.length})
            </h3>
          </div>

          {verifiedList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No evidence satisfied criteria recorded.
            </p>
          ) : (
            <div className="space-y-2.5">
              {verifiedList.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-emerald-100 bg-emerald-50/20 p-3 text-xs space-y-1.5"
                >
                  <div className="font-bold text-emerald-950">{item.criterionName}</div>
                  <div className="flex items-start gap-1.5 bg-white p-2 rounded border border-emerald-100 text-[11px] text-slate-700">
                    <Quote className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="italic">"{item.excerpt}"</span>
                  </div>
                  {item.question && (
                    <div className="text-[10px] text-slate-400 leading-snug break-words">
                      Question: {item.question}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMN 2: Unverified Claims & Knowledge Gaps Cards */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
              Unverified Claims & Gaps ({unverifiedList.length})
            </h3>
          </div>

          {unverifiedList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              All evaluated criteria satisfied with concrete evidence.
            </p>
          ) : (
            <div className="space-y-2.5">
              {unverifiedList.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-100 bg-amber-50/20 p-3 text-xs space-y-1"
                >
                  <div className="font-bold text-amber-950">{item.criterionName}</div>
                  <p className="text-[11px] text-slate-600">{item.missingReason}</p>
                  {item.question && (
                    <div className="text-[10px] text-slate-400 leading-snug break-words pt-1">
                      Question: {item.question}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Untested Areas (if any) */}
      {untestedList.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>Untested Competency Domains ({untestedList.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {untestedList.map((u) => (
              <div
                key={u.id}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs"
              >
                <div className="font-semibold text-slate-900">{u.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{u.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next Steps for Human Interviewers */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
            Recommended Follow-up Inquiries for Human Interviewers
          </h3>
        </div>

        <ul className="space-y-2 text-xs">
          {nextSteps.map((step, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 rounded-lg bg-white p-3 border border-indigo-100 text-slate-800"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {idx + 1}
              </span>
              <span className="font-medium leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ethical Limitations & Guardrails Callout */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
          <span>Ethical Guardrails & Assessment Limitations</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {report.limitations_disclosure ||
            'ProofPath evaluates strictly observed technical evidence against predetermined rubrics. It does not evaluate personality, cultural fit, or emotional traits, and does not make hiring or rejection recommendations.'}
        </p>
      </div>
    </div>
  );
}
