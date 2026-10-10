import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import DecisionBanner from '../components/DecisionBanner';
import {
  Compass,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Terminal,
  ArrowRight,
  Quote,
  Clock
} from 'lucide-react';

export default function InterviewWorkspacePage({ assessmentId, navigate }) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [competencies, setCompetencies] = useState([]);
  const [events, setEvents] = useState([]);
  const [lastDecision, setLastDecision] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);

  // Load assessment state
  const loadState = async () => {
    try {
      setLoading(true);
      const data = await api.getAssessment(assessmentId);
      setAssessment(data.assessment);
      setCurrentQuestion(data.currentQuestion);
      setCompetencies(data.competencies || []);
      setLastDecision(data.lastDecision);

      if (data.assessment.status === 'completed') {
        setIsCompleted(true);
      }

      // Fetch evidence events
      const evData = await api.getEvents(assessmentId);
      setEvents(evData.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assessmentId) {
      loadState();
    }
  }, [assessmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      alert('Please enter a response before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitAnswer(assessmentId, {
        questionId: currentQuestion.id,
        responseText: responseText.trim()
      });

      setResponseText('');
      setLastDecision(res.decision);
      setCompetencies(res.competencies);

      if (res.isCompleted) {
        setIsCompleted(true);
        setCurrentQuestion(null);
      } else {
        setCurrentQuestion(res.nextQuestion);
      }

      // Refresh events ledger
      const evData = await api.getEvents(assessmentId);
      setEvents(evData.events || []);
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Demo presets
  const populateSample = (type) => {
    if (!currentQuestion) return;

    if (type === 'pathA') {
      setResponseText(
        'To implement the cache, I will combine a hash map with a doubly linked list. The hash map stores keys mapped to node pointers, and the doubly linked list maintains the eviction sequence with head and tail pointers. When an item is accessed, we update the pointers to move it to the front.'
      );
    } else if (type === 'pathB') {
      setResponseText(
        'To build an LRU cache with guaranteed O(1) time complexity for both get and put operations, I will combine a hash map with a doubly linked list. The hash map provides O(1) constant time key lookup. The doubly linked list allows O(1) node deletion and insertion at the head because each node maintains both prev and next pointers. When capacity is exceeded, the least recently used node at the tail is evicted in constant time.'
      );
    } else if (type === 'concurrency_demo') {
      setResponseText(
        'In Python asyncio, cooperative multitasking uses a single-threaded event loop where coroutines yield control via await during I/O operations. If a developer runs CPU-bound operations synchronously, it blocks the entire event loop, starving all other concurrent tasks. To mitigate this, CPU-bound work must be offloaded to a ProcessPoolExecutor or background worker processes.'
      );
    } else if (type === 'db_demo') {
      setResponseText(
        'Under the leftmost prefix rule in B-Tree composite indexing, keys are sorted hierarchically starting with the leading column. If a query filters on status and created_at without tenant_id, the database cannot perform an index range scan and falls back to a full table scan or full index scan with filesort. To remediate this, create a new composite index starting with (status, created_at).'
      );
    } else if (type === 'arch_demo') {
      setResponseText(
        'To handle 50,000 requests per second against a database limited to 4,000 writes per second, we place a distributed message queue like Kafka or AWS Kinesis to buffer incoming webhook requests asynchronously and decouple ingest from storage. Consumer workers apply backpressure and micro-batch writes into bulk inserts to optimize throughput. We enforce idempotency keys to prevent duplicate processing on retries, and route unrecoverable failures to a Dead Letter Queue (DLQ).'
      );
    } else if (type === 'reliability_demo') {
      setResponseText(
        'In a microservice system, synchronous blocking calls exhaust the calling service thread pool and connection resources during latency spikes, cascading into a cluster-wide outage. The Circuit Breaker pattern prevents this using three states: Closed (normal execution), Open (fast fail immediately without calling downstream), and Half-Open (trial requests to test recovery). During the Open state, the system executes graceful fallbacks, returning cached data or queued responses.'
      );
    } else if (type === 'insufficient') {
      setResponseText(
        'I think using a dictionary or array is fine. We can just sort it whenever we need to find the oldest item.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading Assessment Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
        <h3 className="mt-3 text-base font-bold text-slate-900">Assessment Error</h3>
        <p className="mt-1 text-xs text-slate-600">{error || 'Assessment not found.'}</p>
        <button
          onClick={() => navigate('history')}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const demonstratedCount = competencies.filter(c => c.current_status === 'demonstrated').length;
  const totalQuestions = Math.max(assessment.max_questions || 5, events.length + (isCompleted ? 0 : 1));
  const progressPercent = Math.min(100, Math.round((events.length / totalQuestions) * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-5">
      {/* Top Session Context Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                Live Assessment Session
              </span>
              <span className="font-mono text-[11px] text-slate-400">{assessment.id}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {assessment.candidate_name}{' '}
              <span className="text-slate-400 font-normal text-sm">for</span>{' '}
              <span className="text-slate-700 font-semibold text-base">{assessment.job_title}</span>
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Budget</div>
              <div className="text-xs font-bold text-slate-800">
                {events.length} / {totalQuestions} Asked
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-right">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Fully Demonstrated</div>
              <div className="text-xs font-bold text-emerald-800">
                {demonstratedCount} / {competencies.length} Skills
              </div>
            </div>
            {isCompleted && (
              <button
                onClick={() => navigate('report', { id: assessment.id })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>View Final Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-3">
          <div className="text-[11px] text-slate-500 font-medium shrink-0">
            Progress: {progressPercent}%
          </div>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 font-mono shrink-0">
            Step {Math.min(events.length + (isCompleted ? 0 : 1), totalQuestions)} of {totalQuestions}
          </span>
        </div>
      </div>

      {/* THREE-COLUMN WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: LEFT - Questions & Progress (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Question Sequence / Stepper */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Question Flow
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {events.length}/{totalQuestions}
              </span>
            </div>

            <div className="space-y-2">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const event = events[idx];
                const isCurrent = !isCompleted && idx === events.length;
                const isPast = idx < events.length;

                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-2.5 transition-all text-xs ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                        : isPast
                        ? 'border-slate-200 bg-slate-50/70'
                        : 'border-dashed border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                            isCurrent
                              ? 'bg-indigo-600 text-white'
                              : isPast
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900 leading-snug break-words">
                          {isPast
                            ? event.competency_name || `Question #${idx + 1}`
                            : isCurrent
                            ? currentQuestion?.competency_name || `Active Question`
                            : `Upcoming Inquiry`}
                        </span>
                      </div>

                      {isPast && (
                        <div className="shrink-0">
                          <StatusBadge status={event.evaluation_status} size="sm" />
                        </div>
                      )}
                      {isCurrent && (
                        <span className="shrink-0 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Challenge Shortcut */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <span>Interactive Code Sandbox</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Run algorithmic challenges in an isolated sandbox with automated test assertions.
            </p>
            <button
              onClick={() => navigate('code', { id: assessment.id })}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span>Open Code Sandbox</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Evidence Audit Shortcut */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <button
              onClick={() => navigate('timeline', { id: assessment.id })}
              className="w-full flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Full Audit Timeline</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{events.length} events</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: CENTER - Current Question & Answer Editor (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Adaptive Decision Banner */}
          {lastDecision && (
            <DecisionBanner decision={lastDecision} />
          )}

          {isCompleted ? (
            /* Concluded State */
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-950">Assessment Session Concluded</h3>
              <p className="mt-1 text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Evidence collection threshold reached. The adaptive engine has recorded all observed evidence and gaps into the persistent SQLite ledger.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => navigate('report', { id: assessment.id })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Open Evidence Assessment Report</span>
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            /* Active Question Card */
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    Question #{events.length + 1}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {currentQuestion.competency_name}
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {currentQuestion.difficulty} • {currentQuestion.type || 'conceptual'}
                </span>
              </div>

              {/* Title & Prompt */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{currentQuestion.title}</h3>
                <div className="mt-2 text-xs text-slate-800 leading-relaxed bg-slate-50/80 p-3.5 rounded-lg border border-slate-100 font-normal">
                  {currentQuestion.prompt}
                </div>
              </div>

              {/* Compact Rubric Criteria Preview */}
              {Array.isArray(currentQuestion.rubric_criteria) && currentQuestion.rubric_criteria.length > 0 && (
                <div className="rounded-lg border border-slate-200/90 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 mb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      <Compass className="h-3 w-3 text-indigo-600" />
                      <span>Rubric Evaluation Criteria</span>
                    </div>
                    <span className="rounded bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-mono text-slate-700">
                      {currentQuestion.rubric_criteria.length} criteria
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {currentQuestion.rubric_criteria.map((crit, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <div className="leading-snug">
                          <span className="font-semibold text-slate-800">{crit.name}: </span>
                          <span className="text-slate-600">{crit.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Challenge Alert */}
              {currentQuestion.type === 'code_challenge' && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-900">Python Coding Challenge</div>
                    <p className="text-[11px] text-indigo-700 mt-0.5">Includes unit tests and isolated execution.</p>
                  </div>
                  <button
                    onClick={() => navigate('code', { id: assessment.id })}
                    className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Terminal className="h-3 w-3" />
                    <span>Open Sandbox</span>
                  </button>
                </div>
              )}

              {/* Response Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Candidate Response
                    </label>

                    {/* Presets chips */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="text-slate-400 font-medium mr-0.5">Sample answers:</span>
                      <button
                        type="button"
                        onClick={() => populateSample('pathA')}
                        className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                        title="Triggers Path A (Partial, missing O(1))"
                      >
                        Path A (Partial)
                      </button>
                      <button
                        type="button"
                        onClick={() => populateSample('pathB')}
                        className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="Triggers Path B (Demonstrated, full O(1))"
                      >
                        Path B (Full)
                      </button>
                      <button
                        type="button"
                        onClick={() => populateSample('concurrency_demo')}
                        className="rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        Concurrency
                      </button>
                      <button
                        type="button"
                        onClick={() => populateSample('db_demo')}
                        className="rounded bg-sky-50 px-2 py-0.5 font-medium text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors"
                      >
                        Database
                      </button>
                      <button
                        type="button"
                        onClick={() => populateSample('arch_demo')}
                        className="rounded bg-purple-50 px-2 py-0.5 font-medium text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors"
                      >
                        Architecture
                      </button>
                      <button
                        type="button"
                        onClick={() => populateSample('reliability_demo')}
                        className="rounded bg-teal-50 px-2 py-0.5 font-medium text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
                      >
                        Reliability
                      </button>
                      <button
                        type="button"
                        onClick={() => populateSample('insufficient')}
                        className="rounded bg-rose-50 px-2 py-0.5 font-medium text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors"
                      >
                        Insufficient
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    required
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter candidate's technical response..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
                  />
                </div>

                {/* Obvious, Prominent Submit Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200/80 p-3">
                  <div className="text-[11px] text-slate-500">
                    Engine will evaluate against rubric and branch adaptively.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !responseText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submitting ? 'Evaluating Evidence...' : 'Submit Answer & Proceed'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 text-xs">
              No active question.
            </div>
          )}
        </div>

        {/* COLUMN 3: RIGHT - Competency Status & Live Evidence (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Competency Status Cards */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <Activity className="h-3.5 w-3.5 text-indigo-600" />
                <span>Competency Status</span>
              </div>
              <button
                onClick={() => navigate('competencies', { id: assessment.id })}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Map →
              </button>
            </div>

            <div className="space-y-2">
              {competencies.map((comp) => {
                const isDemonstrated = comp.current_status === 'demonstrated';
                const isPartial = comp.current_status === 'partially_demonstrated';
                const isInsufficient = comp.current_status === 'insufficient_evidence';

                return (
                  <div
                    key={comp.id}
                    className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 leading-snug break-words">
                          {comp.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Weight: {comp.weight} • Assessed: {comp.times_assessed}x
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={comp.current_status} size="sm" />
                      </div>
                    </div>

                    {/* Progress indicator bar */}
                    <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
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

          {/* Recent Evidence Citations Excerpts */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Observed Evidence Quotes
              </span>
              <span className="text-[10px] font-mono text-slate-400">{events.length}</span>
            </div>

            {events.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-slate-400 italic">
                No evidence quotes captured yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {events.slice(-3).reverse().map((ev, idx) => {
                  const excerpts = Array.isArray(ev.supporting_excerpts)
                    ? ev.supporting_excerpts
                    : JSON.parse(ev.supporting_excerpts || '[]');
                  const quote = excerpts[0] || 'Technical criteria evaluated.';

                  return (
                    <div
                      key={ev.id || idx}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1.5 text-[10px]">
                        <span className="font-semibold text-slate-700 break-words leading-tight">
                          {ev.competency_name || `Event #${ev.event_sequence}`}
                        </span>
                        <div className="shrink-0">
                          <StatusBadge status={ev.evaluation_status} size="sm" />
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-600 bg-white p-2 rounded border border-slate-100 text-[11px]">
                        <Quote className="h-3 w-3 shrink-0 text-indigo-500 mt-0.5" />
                        <span className="italic leading-relaxed break-words">"{quote}"</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
