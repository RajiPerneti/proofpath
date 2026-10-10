import React from 'react';
import { Menu } from 'lucide-react';

export default function Navbar({
  currentRoute,
  onToggleSidebar
}) {
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
    </header>
  );
}
