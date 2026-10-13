import React, { useState, useEffect } from 'react';
import { CheckCircle2, Search, Cpu, Sparkles, Activity } from 'lucide-react';

/**
 * LiveAssessmentVisual - Abstract Brain-like AI Neural Network
 * 
 * Features:
 * - Central brain-like neural network formed from interconnected nodes and synaptic pathways
 * - Multiple flowing data points and pulses travelling along neural paths
 * - Sequential branching illumination representing adaptive question routing
 * - Competency nodes: Technical Depth, Problem Solving, System Architecture, Communication
 * - Dynamic Evidence Node cycling between "Analyzing Evidence..." and "Evidence Verified" (Demo Animation)
 * - Faint orbital luminous contours and gentle floating micro-particles
 * - Single elegant "DEMO PREVIEW" status pill (no cluttered overlapping cards)
 * - Motion accessibility (prefers-reduced-motion)
 */
export default function LiveAssessmentVisual() {
  // Evidence node demo transition: cycles between Analyzing and Verified
  const [evidenceState, setEvidenceState] = useState('verified'); // 'analyzing' | 'verified'

  useEffect(() => {
    const interval = setInterval(() => {
      setEvidenceState((prev) => (prev === 'analyzing' ? 'verified' : 'analyzing'));
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[300px] sm:h-[360px] lg:h-[420px] xl:h-[450px] flex items-center justify-center select-none overflow-hidden">
      {/* Scoped CSS Keyframes for Brain Synapses & Neural Pulses */}
      <style>{`
        @keyframes syn-pulse-glow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        @keyframes syn-travel-fast {
          from { stroke-dashoffset: 120; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes syn-travel-slow {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes branch-step-1 {
          0%, 100% { opacity: 0.25; stroke-width: 1.25; }
          20%, 45% { opacity: 1; stroke-width: 2.5; stroke: #38BDF8; }
        }
        @keyframes branch-step-2 {
          0%, 100% { opacity: 0.25; stroke-width: 1.25; }
          50%, 75% { opacity: 1; stroke-width: 2.5; stroke: #818CF8; }
        }
        @keyframes branch-step-3 {
          0%, 100% { opacity: 0.25; stroke-width: 1.25; }
          75%, 98% { opacity: 1; stroke-width: 2.5; stroke: #34D399; }
        }
        @keyframes particle-drift {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { transform: translateY(-10px) translateX(6px); opacity: 0.75; }
        }
        @keyframes orbit-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .syn-flow-1 {
          stroke-dasharray: 6 12;
          animation: syn-travel-fast 3.2s linear infinite;
        }
        .syn-flow-2 {
          stroke-dasharray: 8 16;
          animation: syn-travel-slow 4.6s linear infinite;
        }
        .syn-branch-1 {
          animation: branch-step-1 6s ease-in-out infinite;
        }
        .syn-branch-2 {
          animation: branch-step-2 6s ease-in-out infinite;
        }
        .syn-branch-3 {
          animation: branch-step-3 6s ease-in-out infinite;
        }
        .syn-core-pulse {
          animation: syn-pulse-glow 3.5s ease-in-out infinite;
          transform-origin: 250px 235px;
        }
        .syn-orbit {
          animation: orbit-slow 48s linear infinite;
          transform-origin: 250px 235px;
        }

        @media (prefers-reduced-motion: reduce) {
          .syn-flow-1, .syn-flow-2, .syn-branch-1, .syn-branch-2, .syn-branch-3,
          .syn-core-pulse, .syn-orbit {
            animation: none !important;
          }
        }
      `}</style>

      {/* Atmospheric Radial Light Gradients */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[320px] h-[320px] rounded-full bg-blue-500/18 blur-3xl" />
        <div className="w-[220px] h-[220px] rounded-full bg-cyan-400/15 blur-2xl" />
        <div className="w-[180px] h-[180px] rounded-full bg-purple-600/15 blur-2xl" />
      </div>

      {/* Floating Ambient Micro-particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[16%] left-[14%] w-1.5 h-1.5 rounded-full bg-cyan-300/60 shadow-[0_0_8px_#38BDF8]" style={{ animation: 'particle-drift 5.5s ease-in-out infinite' }} />
        <div className="absolute top-[28%] right-[12%] w-2 h-2 rounded-full bg-blue-300/40 shadow-[0_0_10px_#60A5FA]" style={{ animation: 'particle-drift 7s ease-in-out infinite 1s' }} />
        <div className="absolute bottom-[24%] left-[10%] w-1.5 h-1.5 rounded-full bg-purple-400/50 shadow-[0_0_8px_#C084FC]" style={{ animation: 'particle-drift 6.2s ease-in-out infinite 2s' }} />
        <div className="absolute bottom-[18%] right-[16%] w-2 h-2 rounded-full bg-cyan-200/50 shadow-[0_0_8px_#67E8F9]" style={{ animation: 'particle-drift 4.8s ease-in-out infinite 0.5s' }} />
        <div className="absolute top-[48%] left-[6%] w-1 h-1 rounded-full bg-blue-400/50" style={{ animation: 'particle-drift 8s ease-in-out infinite 1.5s' }} />
        <div className="absolute top-[65%] right-[8%] w-1 h-1 rounded-full bg-indigo-300/50" style={{ animation: 'particle-drift 6.8s ease-in-out infinite 2.5s' }} />
      </div>

      {/* Main SVG: Brain-Like AI Neural Network */}
      <svg
        className="w-full h-full max-w-[560px] max-h-[440px] drop-shadow-md"
        viewBox="0 0 500 470"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Cyan to Royal Blue Synapse Gradient */}
          <linearGradient id="syn-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.7" />
          </linearGradient>

          {/* Core Decision Pulse Gradient */}
          <linearGradient id="syn-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>

          {/* Luminous Glow Filter */}
          <filter id="syn-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Faint Outer Orbital Ring Contours (Subtle brain halo) */}
        <g className="syn-orbit">
          <ellipse
            cx="250"
            cy="235"
            rx="195"
            ry="155"
            stroke="rgba(96, 165, 250, 0.12)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
          <ellipse
            cx="250"
            cy="235"
            rx="160"
            ry="125"
            stroke="rgba(124, 58, 237, 0.12)"
            strokeWidth="1"
            strokeDasharray="6 12"
          />
          <circle cx="250" cy="80" r="2" fill="#38BDF8" opacity="0.6" />
          <circle cx="250" cy="390" r="2" fill="#A855F7" opacity="0.6" />
        </g>

        {/* ============================================================== */}
        {/* STRUCTURAL SYNAPSE NETWORK (Lines connecting Brain Nodes)       */}
        {/* ============================================================== */}
        <g stroke="rgba(147, 197, 253, 0.22)" strokeWidth="1.2">
          {/* Left Hemisphere Outer Arch (Frontal -> Temporal -> Occipital) */}
          <line x1="250" y1="115" x2="195" y2="110" />
          <line x1="195" y1="110" x2="145" y2="135" />
          <line x1="145" y1="135" x2="105" y2="175" />
          <line x1="105" y1="175" x2="85" y2="230" />
          <line x1="85" y1="230" x2="95" y2="285" />
          <line x1="95" y1="285" x2="130" y2="335" />
          <line x1="130" y1="335" x2="185" y2="365" />
          <line x1="185" y1="365" x2="250" y2="375" />

          {/* Right Hemisphere Outer Arch (Frontal -> Temporal -> Occipital) */}
          <line x1="250" y1="115" x2="305" y2="110" />
          <line x1="305" y1="110" x2="355" y2="135" />
          <line x1="355" y1="135" x2="395" y2="175" />
          <line x1="395" y1="175" x2="415" y2="230" />
          <line x1="415" y1="230" x2="405" y2="285" />
          <line x1="405" y1="285" x2="370" y2="335" />
          <line x1="370" y1="335" x2="315" y2="365" />
          <line x1="315" y1="365" x2="250" y2="375" />

          {/* Left Hemisphere Deep Gyri & Synapses */}
          <line x1="195" y1="110" x2="175" y2="165" />
          <line x1="145" y1="135" x2="175" y2="165" />
          <line x1="105" y1="175" x2="145" y2="210" />
          <line x1="175" y1="165" x2="145" y2="210" />
          <line x1="85" y1="230" x2="140" y2="265" />
          <line x1="145" y1="210" x2="140" y2="265" />
          <line x1="95" y1="285" x2="140" y2="265" />
          <line x1="130" y1="335" x2="185" y2="315" />
          <line x1="140" y1="265" x2="185" y2="315" />
          <line x1="185" y1="365" x2="185" y2="315" />

          {/* Right Hemisphere Deep Gyri & Synapses */}
          <line x1="305" y1="110" x2="325" y2="165" />
          <line x1="355" y1="135" x2="325" y2="165" />
          <line x1="395" y1="175" x2="355" y2="210" />
          <line x1="325" y1="165" x2="355" y2="210" />
          <line x1="415" y1="230" x2="360" y2="265" />
          <line x1="355" y1="210" x2="360" y2="265" />
          <line x1="405" y1="285" x2="360" y2="265" />
          <line x1="370" y1="335" x2="315" y2="315" />
          <line x1="360" y1="265" x2="315" y2="315" />
          <line x1="315" y1="365" x2="315" y2="315" />

          {/* Central Corpus Callosum Synaptic Bridges */}
          <line x1="175" y1="165" x2="250" y2="175" />
          <line x1="325" y1="165" x2="250" y2="175" />
          <line x1="145" y1="210" x2="200" y2="235" />
          <line x1="200" y1="235" x2="250" y2="235" />
          <line x1="250" y1="235" x2="300" y2="235" />
          <line x1="300" y1="235" x2="355" y2="210" />
          <line x1="140" y1="265" x2="195" y2="285" />
          <line x1="195" y1="285" x2="250" y2="295" />
          <line x1="250" y1="295" x2="305" y2="285" />
          <line x1="305" y1="285" x2="360" y2="265" />
          <line x1="185" y1="315" x2="250" y2="335" />
          <line x1="315" y1="315" x2="250" y2="335" />

          {/* Brain Central Vertical Trunk */}
          <line x1="250" y1="115" x2="250" y2="175" strokeWidth="1.5" />
          <line x1="250" y1="175" x2="250" y2="235" strokeWidth="2" stroke="rgba(56, 189, 248, 0.4)" />
          <line x1="250" y1="235" x2="250" y2="295" strokeWidth="2" stroke="rgba(129, 140, 248, 0.4)" />
          <line x1="250" y1="295" x2="250" y2="335" strokeWidth="1.5" />
          <line x1="250" y1="335" x2="250" y2="375" strokeWidth="1.5" />
        </g>

        {/* ============================================================== */}
        {/* ANIMATED FLOWING DATA PULSES (Travelling along Neural Paths)   */}
        {/* ============================================================== */}
        {/* Pulse Flow 1: Left Frontal to Decision Core */}
        <path
          d="M 105 175 C 145 165, 175 195, 250 235"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="syn-flow-1"
        />

        {/* Pulse Flow 2: Right Frontal to Decision Core */}
        <path
          d="M 395 175 C 355 165, 325 195, 250 235"
          fill="none"
          stroke="#818CF8"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="syn-flow-2"
        />

        {/* Pulse Flow 3: Decision Core down to Evidence Node */}
        <path
          d="M 250 235 L 250 295"
          fill="none"
          stroke="#34D399"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="syn-flow-1"
        />

        {/* Pulse Flow 4: Deep Lateral Assessment Loops */}
        <path
          d="M 140 265 C 185 300, 215 320, 250 335 C 285 320, 315 300, 360 265"
          fill="none"
          stroke="rgba(147, 197, 253, 0.7)"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="syn-flow-2"
        />

        {/* ============================================================== */}
        {/* SEQUENTIAL ADAPTIVE BRANCHING ROUTES (Branch illumination)     */}
        {/* ============================================================== */}
        {/* Branch Route A: Drill-Down Algorithmic Path (Cyan) */}
        <path
          d="M 250 235 L 200 235 L 145 210 L 105 175"
          fill="none"
          stroke="#38BDF8"
          strokeLinecap="round"
          className="syn-branch-1"
        />

        {/* Branch Route B: Broaden Concurrency & Architecture Path (Indigo) */}
        <path
          d="M 250 235 L 300 235 L 355 210 L 395 175"
          fill="none"
          stroke="#818CF8"
          strokeLinecap="round"
          className="syn-branch-2"
        />

        {/* Branch Route C: Verified Citation & Rubric Path (Emerald) */}
        <path
          d="M 250 235 L 250 295 L 305 285 L 370 335"
          fill="none"
          stroke="#34D399"
          strokeLinecap="round"
          className="syn-branch-3"
        />

        {/* ============================================================== */}
        {/* ALL INTERCONNECTED BRAIN NODES (Dots with depth & glows)       */}
        {/* ============================================================== */}
        {/* Standard Outer & Intermediate Synaptic Nodes */}
        {[
          [250, 115], [195, 110], [145, 135], [85, 230], [95, 285],
          [185, 365], [305, 110], [355, 135], [415, 230], [405, 285],
          [315, 365], [250, 375], [175, 165], [250, 175], [325, 165],
          [200, 235], [300, 235], [140, 265], [195, 285], [305, 285],
          [360, 265], [185, 315], [250, 335], [315, 315]
        ].map(([nx, ny], idx) => (
          <circle
            key={`node-${idx}`}
            cx={nx}
            cy={ny}
            r="3"
            fill="#93C5FD"
            opacity="0.75"
          />
        ))}

        {/* ============================================================== */}
        {/* 4 HIGHLIGHTED COMPETENCY NODES (Labeled Pillars)               */}
        {/* ============================================================== */}
        
        {/* 1. Technical Depth (Left Frontal) */}
        <g transform="translate(105, 175)">
          <circle cx="0" cy="0" r="7" fill="#0284C7" filter="url(#syn-glow)" opacity="0.6" />
          <circle cx="0" cy="0" r="4.5" fill="#38BDF8" />
          <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
        </g>

        {/* 2. Problem Solving (Right Frontal) */}
        <g transform="translate(395, 175)">
          <circle cx="0" cy="0" r="7" fill="#4F46E5" filter="url(#syn-glow)" opacity="0.6" />
          <circle cx="0" cy="0" r="4.5" fill="#818CF8" />
          <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
        </g>

        {/* 3. System Architecture (Left Temporal) */}
        <g transform="translate(130, 335)">
          <circle cx="0" cy="0" r="7" fill="#7C3AED" filter="url(#syn-glow)" opacity="0.6" />
          <circle cx="0" cy="0" r="4.5" fill="#C084FC" />
          <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
        </g>

        {/* 4. Communication & Reasoning (Right Temporal) */}
        <g transform="translate(370, 335)">
          <circle cx="0" cy="0" r="7" fill="#059669" filter="url(#syn-glow)" opacity="0.6" />
          <circle cx="0" cy="0" r="4.5" fill="#34D399" />
          <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
        </g>

        {/* ============================================================== */}
        {/* CENTRAL DECISION CORE (Adaptive AI Engine at center)           */}
        {/* ============================================================== */}
        <g transform="translate(250, 235)" className="syn-core-pulse">
          <circle cx="0" cy="0" r="19" fill="#0B1F44" stroke="#38BDF8" strokeWidth="2" filter="url(#syn-glow)" />
          <circle cx="0" cy="0" r="14" fill="url(#syn-core-grad)" opacity="0.4" />
          <circle cx="0" cy="0" r="8" fill="#38BDF8" />
          <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
        </g>

        {/* ============================================================== */}
        {/* EVIDENCE VERIFICATION NODE at (250, 295)                       */}
        {/* ============================================================== */}
        <g transform="translate(250, 295)">
          <circle
            cx="0"
            cy="0"
            r="12"
            fill={evidenceState === 'verified' ? '#065F46' : '#1E293B'}
            stroke={evidenceState === 'verified' ? '#10B981' : '#F59E0B'}
            strokeWidth="1.5"
            filter="url(#syn-glow)"
            style={{ transition: 'all 0.6s ease' }}
          />
          <circle
            cx="0"
            cy="0"
            r="5"
            fill={evidenceState === 'verified' ? '#34D399' : '#FBBF24'}
          />
        </g>
      </svg>

      {/* ============================================================== */}
      {/* HIGH-TECH LABELS FOR THE 4 COMPETENCY NODES                   */}
      {/* ============================================================== */}
      {/* Top Left: Technical Depth */}
      <div className="absolute top-[28%] left-[2%] sm:left-[5%] z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-[10px] text-cyan-200 font-semibold shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Technical Depth</span>
        </div>
      </div>

      {/* Top Right: Problem Solving */}
      <div className="absolute top-[28%] right-[2%] sm:right-[5%] z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 text-[10px] text-indigo-200 font-semibold shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>Problem Solving</span>
        </div>
      </div>

      {/* Bottom Left: System Architecture */}
      <div className="absolute bottom-[22%] left-[4%] sm:left-[8%] z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-purple-500/30 text-[10px] text-purple-200 font-semibold shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>System Architecture</span>
        </div>
      </div>

      {/* Bottom Right: Communication & Proof */}
      <div className="absolute bottom-[22%] right-[4%] sm:right-[8%] z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 text-[10px] text-emerald-200 font-semibold shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Communication</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* EVIDENCE NODE LIVE STATUS PILL (Directly linked to node)       */}
      {/* ============================================================== */}
      <div className="absolute top-[68%] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border text-[11px] font-semibold transition-all duration-500 shadow-lg ${
            evidenceState === 'verified'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
          }`}
        >
          {evidenceState === 'verified' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Evidence Verified: O(1) Design Validated</span>
            </>
          ) : (
            <>
              <Activity className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" />
              <span>Analyzing Verbatim Evidence...</span>
            </>
          )}
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
            Demo Animation
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BOTTOM SINGLE ELEGANT ASSESSMENT SUMMARY CHIP                 */}
      {/* ============================================================== */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-max max-w-[92%]">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-[10px] sm:text-[11px] shadow-xl">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>DEMO PREVIEW</span>
          </div>
          <span className="text-white/40">•</span>
          <span className="text-slate-200">
            Cognitive Interview Assessment Topology
          </span>
          <span className="hidden sm:inline text-white/40">•</span>
          <span className="hidden sm:inline text-emerald-300 font-semibold">
            Adaptive Branching Live
          </span>
        </div>
      </div>
    </div>
  );
}
