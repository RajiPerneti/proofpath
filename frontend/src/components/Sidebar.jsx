import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Compass,
  Activity,
  Terminal,
  Clock,
  FileText,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  LogOut,
  User,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  currentAssessmentId,
  currentRoute,
  navigate,
  aiConfigured,
  isOpen,
  onClose
}) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const mainNavItems = [
    { id: 'landing', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Assessments', icon: Layers },
    { id: 'create', label: 'New Assessment', icon: PlusCircle },
  ];

  const assessmentNavItems = [
    { id: 'interview', label: 'Interview Workspace', icon: Compass },
    { id: 'competencies', label: 'Competency Map', icon: Activity },
    { id: 'code', label: 'Code Sandbox', icon: Terminal },
    { id: 'timeline', label: 'Evidence Timeline', icon: Clock },
    { id: 'report', label: 'Final Report', icon: FileText },
  ];

  const handleNav = (routeId) => {
    if (onClose) onClose();
    if (['interview', 'competencies', 'code', 'timeline', 'report'].includes(routeId)) {
      navigate(routeId, { id: currentAssessmentId });
    } else {
      navigate(routeId);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
          <div
            onClick={() => handleNav('landing')}
            className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900">ProofPath</span>
                <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Adaptive Assessment</p>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overview
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Assessment Navigation */}
          {currentAssessmentId ? (
            <div>
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Session
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Assessment ID Pill */}
              <div className="mb-2 mx-1 rounded-md bg-slate-50 border border-slate-200/70 p-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Session ID</div>
                <div className="text-xs font-mono font-medium text-slate-700 truncate mt-0.5">
                  {currentAssessmentId}
                </div>
              </div>

              <nav className="space-y-1">
                {assessmentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3 text-indigo-500" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center bg-slate-50/50">
              <Compass className="mx-auto h-5 w-5 text-slate-400 mb-1" />
              <div className="text-[11px] font-semibold text-slate-700">No Active Session</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Select or create an assessment to unlock live workspace tools.
              </p>
              <button
                onClick={() => handleNav('create')}
                className="mt-2.5 inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700"
              >
                <PlusCircle className="h-3 w-3" />
                <span>Start Now</span>
              </button>
            </div>
          )}
        </div>

        {/* User Account Section */}
        <div className="border-t border-slate-200/80 px-3 py-2.5 bg-white">
          {isAuthenticated && user ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-semibold text-slate-800 truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onClose) onClose();
                openAuthModal('login');
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>

        {/* Footer / System Telemetry */}
        <div className="border-t border-slate-200/80 p-3 bg-slate-50/50 space-y-2">
          {/* AI Engine Status */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className={`h-3.5 w-3.5 shrink-0 ${aiConfigured ? 'text-indigo-600' : 'text-amber-500'}`} />
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Engine</div>
                <div className="text-[11px] font-medium text-slate-600 truncate">
                  {aiConfigured ? 'Gemini Live' : 'Deterministic Demo'}
                </div>
              </div>
            </div>
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                aiConfigured ? 'bg-indigo-500' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Backend Connection */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Backend: Port 5000
            </span>
            <span className="font-mono text-[10px] text-slate-400">node:sqlite</span>
          </div>
        </div>
      </aside>
    </>
  );
}
