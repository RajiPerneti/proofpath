import React from 'react';
import { Menu, LogIn, UserPlus, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  currentRoute,
  onToggleSidebar
}) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const routeTitles = {
    landing: 'Assessment Operations Dashboard',
    history: 'Assessment Repository',
    create: 'Create New Assessment',
    interview: 'Adaptive Interview Workspace',
    competencies: 'Interactive Competency Map',
    code: 'Technical Code Sandbox',
    timeline: 'Evidence Audit Timeline',
    report: 'Evidence-Backed Assessment Report'
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              {routeTitles[currentRoute] || 'ProofPath'}
            </h1>
          </div>
          <p className="hidden text-[11px] text-slate-500 sm:block">
            Evidence-Driven Adaptive Interview Intelligence
          </p>
        </div>
      </div>

      {/* Right: Authentication Actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white uppercase">
                {user.name ? user.name[0] : 'U'}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  {user.role || 'user'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
              title="Sign Out of ProofPath"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5 text-slate-500" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
