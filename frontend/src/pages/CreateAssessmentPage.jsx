import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  User,
  Sparkles,
  ArrowRight,
  Check,
  FileText,
  Layers,
  Upload,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CreateAssessmentPage({ navigate, setAssessmentId }) {
  const { isAuthenticated, openAuthModal } = useAuth();
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

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFilename, setResumeFilename] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState(null);

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

  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      alert('Please sign in or create an account to upload resumes and start assessments.');
      e.target.value = '';
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.txt'].includes(ext)) {
      setResumeError('Unsupported file type. Please upload a PDF (.pdf) or Plain Text (.txt) file.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File is too large. Maximum resume file size is 5MB.');
      e.target.value = '';
      return;
    }

    setResumeError(null);
    setUploadingResume(true);
    setResumeFile(file);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const parsed = await api.parseResume(formData);
      setResumeFilename(parsed.filename || file.name);
      setResumeText(parsed.text || '');
    } catch (err) {
      setResumeError(err.message || 'Unable to process resume document. Please try again.');
      setResumeFile(null);
      setResumeFilename('');
      setResumeText('');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeFilename('');
    setResumeText('');
    setResumeError(null);
  };

  const handleAppendResumeToProfile = () => {
    if (!resumeText) return;
    const cleanSummary = resumeText.slice(0, 400).replace(/\s+/g, ' ').trim();
    setCandidateProfile((prev) =>
      prev ? `${prev}\n\nResume Excerpt: ${cleanSummary}...` : `Resume Excerpt: ${cleanSummary}...`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      alert('Please sign in or create an account before creating an assessment.');
      return;
    }

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
        maxQuestions: parseInt(maxQuestions, 10),
        resumeFilename: resumeFilename || undefined,
        resumeText: resumeText || undefined
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

        {/* Optional Resume Upload */}
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Optional Candidate Resume (PDF / TXT)
              </label>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Upload a candidate resume (up to 5MB) to extract relevant background experience into the assessment.
              </p>
            </div>
            {resumeFilename && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Parsed</span>
              </span>
            )}
          </div>

          {resumeError && (
            <div className="flex items-start gap-1.5 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600 mt-0.5 shrink-0" />
              <span>{resumeError}</span>
            </div>
          )}

          {!resumeFilename ? (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer transition-colors">
                <Upload className="h-3.5 w-3.5 text-indigo-600" />
                <span>{uploadingResume ? 'Parsing Document...' : 'Upload Resume File'}</span>
                <input
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  disabled={uploadingResume}
                  onChange={handleResumeFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">
                Supported: PDF (.pdf), Plain Text (.txt) • Max 5MB
              </span>
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <span className="text-xs font-semibold text-slate-800 truncate block">
                      {resumeFilename}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {resumeText ? `${resumeText.length.toLocaleString()} characters extracted` : 'Attached'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAppendResumeToProfile}
                    className="rounded bg-indigo-50 border border-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    title="Append excerpt to Candidate Profile"
                  >
                    Append to Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove attached resume"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
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
