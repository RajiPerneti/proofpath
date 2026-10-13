import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import CreateAssessmentPage from './pages/CreateAssessmentPage';
import InterviewWorkspacePage from './pages/InterviewWorkspacePage';
import CompetencyExplorerPage from './pages/CompetencyExplorerPage';
import TechnicalChallengePage from './pages/TechnicalChallengePage';
import EvidenceTimelinePage from './pages/EvidenceTimelinePage';
import FinalReportPage from './pages/FinalReportPage';
import AssessmentHistoryPage from './pages/AssessmentHistoryPage';
import { api } from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import AuthPage from './pages/AuthPage';
import ErrorBoundary from './components/ErrorBoundary';

function MainApp() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [assessmentId, setAssessmentId] = useState(() => {
    return localStorage.getItem('proofpath_active_assessment_id') || null;
  });
  const [aiConfigured, setAiConfigured] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await api.checkHealth();
        setAiConfigured(res.aiEngine === 'gemini_live');
      } catch (e) {
        console.warn('Backend health check error:', e);
      }
    }
    check();
  }, []);

  const handleSetAssessmentId = (id) => {
    setAssessmentId(id);
    if (id) {
      localStorage.setItem('proofpath_active_assessment_id', id);
    } else {
      localStorage.removeItem('proofpath_active_assessment_id');
    }
  };

  const navigate = (route, params = {}) => {
    if (params.id) {
      handleSetAssessmentId(params.id);
    }
    setCurrentRoute(route);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading ProofPath...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated visitors see dedicated login/signup page before accessing the dashboard
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Compact Navigation Sidebar */}
      <Sidebar
        currentAssessmentId={assessmentId}
        currentRoute={currentRoute}
        navigate={navigate}
        aiConfigured={aiConfigured}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <Navbar
          currentAssessmentId={assessmentId}
          currentRoute={currentRoute}
          navigate={navigate}
          aiConfigured={aiConfigured}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Dynamic Route Pages */}
        <main className="flex-1 pb-12">
          <ErrorBoundary onReset={() => setCurrentRoute('landing')}>
            {currentRoute === 'landing' && (
              <LandingPage navigate={navigate} setAssessmentId={handleSetAssessmentId} />
            )}
            {currentRoute === 'create' && (
              <CreateAssessmentPage navigate={navigate} setAssessmentId={handleSetAssessmentId} />
            )}
            {currentRoute === 'interview' && (
              <InterviewWorkspacePage assessmentId={assessmentId} navigate={navigate} />
            )}
            {currentRoute === 'competencies' && (
              <CompetencyExplorerPage assessmentId={assessmentId} navigate={navigate} />
            )}
            {currentRoute === 'code' && (
              <TechnicalChallengePage assessmentId={assessmentId} navigate={navigate} />
            )}
            {currentRoute === 'timeline' && (
              <EvidenceTimelinePage assessmentId={assessmentId} navigate={navigate} />
            )}
            {currentRoute === 'report' && (
              <FinalReportPage assessmentId={assessmentId} navigate={navigate} />
            )}
            {currentRoute === 'history' && (
              <AssessmentHistoryPage navigate={navigate} setAssessmentId={handleSetAssessmentId} />
            )}
          </ErrorBoundary>
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 text-xs text-slate-500">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">ProofPath</span>
              <span>•</span>
              <span>Evidence-Driven Adaptive Assessment Intelligence</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Google Student Club Hackathon 2026 • Evidence-Backed Engine
            </div>
          </div>
        </footer>
      </div>

      {/* Global Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
