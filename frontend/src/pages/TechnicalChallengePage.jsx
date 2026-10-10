import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Terminal, Play, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function TechnicalChallengePage({ assessmentId, navigate }) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [challengeQuestion, setChallengeQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Default challenge starter code
  const defaultStarter = `class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        # TODO: Implement O(1) get
        return -1

    def put(self, key: int, value: int) -> None:
        # TODO: Implement O(1) put with LRU eviction
        pass
`;

  // Working verified solution for judges
  const fullWorkingSolution = `class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_head(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.value = value
            self._remove(node)
            self._add_to_head(node)
        else:
            if len(self.cache) >= self.capacity:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_to_head(new_node)
`;

  // Buggy solution demonstrating test failure
  const buggySolution = `class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        return self.cache.get(key, -1)

    def put(self, key: int, value: int) -> None:
        # Bug: Does not evict when capacity is exceeded!
        self.cache[key] = value
`;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getAssessment(assessmentId);
        setAssessment(data.assessment);

        // Find coding question or fallback
        const compData = await api.getCompetencies(assessmentId);
        // We can find question
        setCode(defaultStarter);
        setChallengeQuestion({
          id: 'q_code_lru_python',
          title: 'Hands-on Coding: Implement LRU Cache in Python',
          prompt: 'Implement an LRUCache class in Python with get(key) and put(key, value). It must support initial capacity, return -1 if key not found, update usage on both get and put, and evict the least recently used item when capacity is exceeded.',
          starter_code: defaultStarter
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (assessmentId) load();
  }, [assessmentId]);

  const handleRunCode = async () => {
    setRunning(true);
    setTestResult(null);
    try {
      const res = await api.runCode(assessmentId, {
        code,
        questionId: challengeQuestion.id
      });
      setTestResult(res.runResult);
    } catch (err) {
      alert(`Execution error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitCode(assessmentId, {
        code,
        questionId: challengeQuestion.id
      });
      setSubmittedSuccess(true);
      setTestResult(res.runResult);
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
              Isolated Execution Sandbox
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Python 3.10+</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Hands-on Python Challenge: LRU Cache Implementation
          </h2>
        </div>

        <button
          onClick={() => navigate('interview', { id: assessmentId })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <span>Return to Workspace</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Challenge Specs & Test Criteria (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Problem Statement</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">Design Least Recently Used (LRU) Cache</h2>
              <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.
                Implement the <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-indigo-700">LRUCache</code> class:
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                <li>• <strong className="text-slate-900">LRUCache(capacity)</strong>: Initialize with positive capacity.</li>
                <li>• <strong className="text-slate-900">get(key)</strong>: Return value of key if exists, otherwise return -1. Updates recency.</li>
                <li>• <strong className="text-slate-900">put(key, value)</strong>: Update value if key exists, otherwise insert key-value. If number of keys exceeds capacity, evict the least recently used key.</li>
              </ul>
            </div>

            {/* Test Suite Expectations */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Automated Test Assertions
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Test 1: Basic Put & Get verification</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Test 2: Correct eviction of oldest element on capacity breach</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Test 3: Get operation updates recency (prevents eviction)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Test 4: Mutating existing key preserves capacity and updates order</span>
                </li>
              </ul>
            </div>

            {/* Judging Quick Presets */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-2 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Quick Test Code Presets (For Judging Demo)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setCode(fullWorkingSolution); setTestResult(null); }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm"
                >
                  Load 100% Passing Solution
                </button>
                <button
                  type="button"
                  onClick={() => { setCode(buggySolution); setTestResult(null); }}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 shadow-sm"
                >
                  Load Buggy Eviction Solution
                </button>
                <button
                  type="button"
                  onClick={() => { setCode(defaultStarter); setTestResult(null); }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Reset Starter Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-rose-500" />
                <span className="flex h-3 w-3 rounded-full bg-amber-500" />
                <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-xs font-semibold text-slate-700">solution.py (Python 3.14 Sandbox)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={running || submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600" />
                  <span>{running ? 'Running Tests...' : 'Run Test Cases'}</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={running || submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit to Ledger'}</span>
                </button>
              </div>
            </div>

            {/* Code Textarea */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-inner">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={18}
                spellCheck="false"
                className="code-editor w-full bg-transparent font-mono text-xs leading-relaxed text-emerald-400 focus:outline-none resize-none"
              />
            </div>

            {/* Submission Banner */}
            {submittedSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Solution recorded in Evidence Ledger. Adaptive engine updated.</span>
                </div>
                <button
                  onClick={() => navigate('interview', { id: assessmentId })}
                  className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
                >
                  Return to Workspace
                </button>
              </div>
            )}

            {/* Test Results Output Console */}
            {testResult && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Sandbox Test Results</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      testResult.success
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {testResult.testsPassed} / {testResult.testsTotal} Passed
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{testResult.executionTimeMs}ms</span>
                  </div>
                </div>

                {/* Test results items */}
                {Array.isArray(testResult.testResults) && (
                  <div className="space-y-1.5">
                    {testResult.testResults.map((t, i) => (
                      <div
                        key={i}
                        className={`flex items-start justify-between p-2 rounded-lg border text-xs font-mono ${
                          t.passed
                            ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                            : 'border-rose-200 bg-rose-50/60 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {t.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          )}
                          <span className="font-semibold">{t.name}</span>
                        </div>
                        {t.error && (
                          <span className="text-[11px] text-rose-700 mt-0.5">{t.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {testResult.error && (
                  <div className="rounded-lg bg-rose-100 p-2.5 text-xs font-mono text-rose-900 border border-rose-200">
                    {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
