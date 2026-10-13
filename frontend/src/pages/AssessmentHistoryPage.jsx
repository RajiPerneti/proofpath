import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  History,
  PlusCircle,
  ArrowRight,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Layers,
  Activity
} from 'lucide-react';

export default function AssessmentHistoryPage({ navigate, setAssessmentId }) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'in_progress', 'completed'

  const loadAssessments = async () => {
    try {
      setLoading(true);
      if (!isAuthenticated) {
        setAssessments([]);
        return;
      }
      const data = await api.getAssessments().catch((err) => {
        console.warn('Could not load assessments:', err.message);
        return { assessments: [] };
      });
      setAssessments(data.assessments || []);
    } catch (err) {
      console.error(err);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, [isAuthenticated]);

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete assessment "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deleteAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      const activeId = localStorage.getItem('proofpath_active_assessment_id');
      if (activeId === id) {
        setAssessmentId(null);
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = (id, status) => {
    setAssessmentId(id);
    if (status === 'completed') {
      navigate('report', { id });
    } else {
      navigate('interview', { id });
    }
  };

  // Metrics
  const total = assessments.length;
  const completed = assessments.filter((a) => a.status === 'completed').length;
  const inProgress = total - completed;
  const totalEvents = assessments.reduce((acc, a) => acc + (a.events_count || 0), 0);

  // Filtered
  const filtered = assessments.filter((a) => {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Assessment Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs, completed evaluation reports, and active interview sessions.
          </p>
        </div>

        <button
          onClick={() => navigate('create')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Guest Mode Callout */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Sign in to view your assessments
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Each user account has isolated, private access to their created assessments and evidence reports.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Sessions
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Stored in SQLite</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
            In Progress
          </div>
          <div className="mt-1 text-2xl font-bold text-indigo-600">{inProgress}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active interviews</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Completed
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{completed}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Reports finalized</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Evidence Inquiries
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{totalEvents}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Questions asked</div>
        </div>
      </div>

      {/* Clean Table of Assessments */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">All Assessments</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {filtered.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
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

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No assessments found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Create a new assessment to begin evaluating candidates adaptively.
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
                {filtered.map((asmt) => {
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

                  return (
                    <tr
                      key={asmt.id}
                      onClick={() => handleSelect(asmt.id, asmt.status)}
                      className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{asmt.candidate_name}</span>
                          {asmt.ai_mode === 'deterministic_demo' && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-500 border border-slate-200">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{asmt.job_title}</div>
                      </td>

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

                      <td className="py-3 px-4">
                        <span className="font-medium text-emerald-700">
                          {asmt.demonstrated_count} / {asmt.competencies_count} verified
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">{dateStr}</td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSelect(asmt.id, asmt.status)}
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
    </div>
  );
}
