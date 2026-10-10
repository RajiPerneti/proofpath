import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Briefcase, User, Sparkles, ArrowRight, Check, FileText, Layers } from 'lucide-react';

export default function CreateAssessmentPage({ navigate, setAssessmentId }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('backend-systems-engineer');
  const [jobTitle, setJobTitle] = useState('Senior Backend Systems Engineer');
  const [jobDescription, setJobDescription] = useState(
    'Design and build high-throughput backend services, distributed systems, resilient caching, and optimized database queries in Python.'
  );
  const [candidateName, setCandidateName] = useState('Alex Chen');
  const [candidateProfile, setCandidateProfile] = useState(
    '3.5 years experience in Python microservices, caching layers, and relational databases.'
  );
  const [maxQuestions, setMaxQuestions] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTemplates();
        setTemplates(data.templates || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const handleTemplateSelect = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setJobTitle(tmpl.title);
    setJobDescription(tmpl.description);
    if (tmpl.candidateProfile) {
      setCandidateProfile(tmpl.candidateProfile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !candidateName.trim()) {
      alert('Job Title and Candidate Name are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createAssessment({
        jobTitle,
        jobDescription,
        candidateName,
        candidateProfile,
        templateId: selectedTemplateId,
        maxQuestions: parseInt(maxQuestions, 10)
      });

      setAssessmentId(res.assessmentId);
      navigate('interview', { id: res.assessmentId });
    } catch (err) {
      alert(`Error creating assessment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
            Assessment Initialization
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
          Configure Technical Assessment Plan
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Select a role template or enter custom requirements. ProofPath seeds competencies and explicit rubrics.
        </p>
      </div>

      {/* Role Preset Selector */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Pre-Configured Role Curriculum:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleTemplateSelect(tmpl)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all text-xs ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{tmpl.title}</span>
                  {isSelected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {tmpl.competencies.map((c, i) => (
                    <span
                      key={i}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Senior Backend Systems Engineer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Candidate Name *
            </label>
            <input
              type="text"
              required
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Alex Chen"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            Job Description & Technical Scope
          </label>
          <textarea
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            placeholder="Detailed description of technical responsibilities..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            Candidate Profile & Background
          </label>
          <textarea
            rows={2}
            value={candidateProfile}
            onChange={(e) => setCandidateProfile(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            placeholder="Prior systems worked on, years of experience..."
          />
        </div>

        {/* Question Budget Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Adaptive Question Budget
            </label>
            <select
              value={maxQuestions}
              onChange={(e) => setMaxQuestions(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5 Questions (5-Competency Baseline Coverage)</option>
              <option value={6}>6 Questions (Coverage + 1 Follow-Up Inquiry)</option>
              <option value={7}>7 Questions (Comprehensive In-Depth Audit - Recommended)</option>
              <option value={8}>8 Questions (Thorough Multi-Branch Investigation)</option>
            </select>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800 block mb-0.5">Adaptive Logic:</span>
            Question sequence dynamically branches. Missing criteria triggers Path A (drill-down); thorough answers trigger Path B (broadening).
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <span>{submitting ? 'Initializing...' : 'Initialize & Begin'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
