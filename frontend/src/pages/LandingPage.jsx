import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  Activity,
  FileText,
  Trash2,
  Search,
  Compass
} from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function LandingPage({ navigate, setAssessmentId }) {
  const [assessments, setAssessments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'in_progress', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const activeAssessmentId = localStorage.getItem('proofpath_active_assessment_id');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [asmtData, tmplData] = await Promise.all([
        api.getAssessments(),
        api.getTemplates()
      ]);
      setAssessments(asmtData.assessments || []);
      setTemplates(tmplData.templates || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete assessment "${title}"?`)) return;
    setDeletingId(id);
    try {
      await api.deleteAssessment(id);
      setAssessments(prev => prev.filter(a => a.id !== id));
      if (activeAssessmentId === id) {
        setAssessmentId(null);
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Compute statistics from actual backend data
  const totalAssessments = assessments.length;
  const completedCount = assessments.filter(a => a.status === 'completed').length;
  const inProgressCount = totalAssessments - completedCount;
  const totalDemonstratedSkills = assessments.reduce((acc, a) => acc + (a.demonstrated_count || 0), 0);

  // Shortened, concise role descriptions
  const getShortDescription = (tmpl) => {
    if (tmpl.id === 'backend-systems-engineer') {
      return 'Microservices, distributed caching, and database query optimization in Python.';
    }
    if (tmpl.id === 'fullstack-web-architect') {
      return 'Responsive frontend architecture, secure REST APIs, and state management.';
    }
    return tmpl.description ? tmpl.description.split('.')[0] + '.' : 'Role competency assessment.';
  };

  // Filtered assessments
  const filteredAssessments = assessments.filter(a => {
    if (filter === 'in_progress' && a.status === 'completed') return false;
    if (filter === 'completed' && a.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.candidate_name?.toLowerCase().includes(q) ||
        a.job_title?.toLowerCase().includes(q) ||
        a.id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeAssessment = assessments.find(a => a.id === activeAssessmentId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Technical Assessment Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidate evaluations, adaptive interview workflows, and evidence ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('create')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1: Total Assessments */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Assessments
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalAssessments}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {inProgressCount} active • {completedCount} completed
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              In Progress
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-600">
            {inProgressCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Active interview sessions
          </div>
        </div>

        {/* Metric 3: Completed */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Completed
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
            {completedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Audited reports generated
          </div>
        </div>

        {/* Metric 4: Skills Evaluated */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Skills Evaluated
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalDemonstratedSkills}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Verified with evidence quotes
          </div>
        </div>
      </div>

      {/* Active Session Quick Banner (If Selected) */}
      {activeAssessment && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                    Active Assessment Session
                  </span>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-mono text-indigo-800">
                    {activeAssessment.id}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {activeAssessment.candidate_name} — <span className="text-slate-600 font-normal">{activeAssessment.job_title}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('interview', { id: activeAssessment.id })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                <span>{activeAssessment.status === 'completed' ? 'View Workspace' : 'Resume Interview'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => navigate('competencies', { id: activeAssessment.id })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Map</span>
              </button>
              <button
                onClick={() => navigate('report', { id: activeAssessment.id })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-3 pt-2 border-t border-indigo-100/80 flex items-center gap-3 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-indigo-900 shrink-0">
              Progress: {activeAssessment.events_count} / {activeAssessment.max_questions} Questions Asked
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-indigo-100">
              <div
                className="h-full bg-indigo-600 transition-all rounded-full"
                style={{
                  width: `${Math.min(100, Math.round(((activeAssessment.events_count || 0) / activeAssessment.max_questions) * 100))}%`
                }}
              />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
              {activeAssessment.demonstrated_count} Skills Verified
            </span>
          </div>
        </div>
      )}

      {/* Recent Assessments Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Assessments</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {filteredAssessments.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filter === 'in_progress'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filter === 'completed'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No assessments found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery ? 'Try adjusting your search filter.' : 'Create an assessment or launch the demo.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Candidate & Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Questions Progress</th>
                  <th className="py-3 px-4">Verified Skills</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((asmt) => {
                  const isCompleted = asmt.status === 'completed';
                  const dateStr = new Date(asmt.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const progressPct = Math.min(
                    100,
                    Math.round(((asmt.events_count || 0) / asmt.max_questions) * 100)
                  );
                  const isDemo = asmt.ai_mode === 'deterministic_demo';

                  return (
                    <tr
                      key={asmt.id}
                      onClick={() => {
                        setAssessmentId(asmt.id);
                        navigate(isCompleted ? 'report' : 'interview', { id: asmt.id });
                      }}
                      className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Candidate & Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{asmt.candidate_name}</span>
                          {isDemo && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-500 border border-slate-200">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{asmt.job_title}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                            isCompleted
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-indigo-200 bg-indigo-50 text-indigo-800'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                          />
                          <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                        </span>
                      </td>

                      {/* Questions Progress */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-700">
                            {asmt.events_count}/{asmt.max_questions}
                          </span>
                        </div>
                      </td>

                      {/* Skills Demonstrated */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-emerald-700">
                          {asmt.demonstrated_count} / {asmt.competencies_count} verified
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{dateStr}</td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAssessmentId(asmt.id);
                              navigate(isCompleted ? 'report' : 'interview', { id: asmt.id });
                            }}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {isCompleted ? 'Report' : 'Resume'}
                          </button>
                          <button
                            onClick={() => {
                              setAssessmentId(asmt.id);
                              navigate('competencies', { id: asmt.id });
                            }}
                            className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Map
                          </button>
                          <button
                            onClick={(e) => handleDelete(asmt.id, asmt.candidate_name, e)}
                            disabled={deletingId === asmt.id}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete assessment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Role Profiles */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">Pre-Configured Assessment Templates</h3>
          <p className="text-xs text-slate-500">Standardized role profiles with mapped competencies and rubrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    Role Profile
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {tmpl.competenciesCount} Core Competencies
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{tmpl.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{getShortDescription(tmpl)}</p>

                {/* Competency tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {tmpl.competencies?.slice(0, 3).map((compName, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 font-medium"
                    >
                      {compName}
                    </span>
                  ))}
                  {tmpl.competencies?.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{tmpl.competencies.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Default: 5 Questions</span>
                <button
                  onClick={() => navigate('create')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <span>New Assessment</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
