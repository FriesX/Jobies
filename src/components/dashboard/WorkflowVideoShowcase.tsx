'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

interface Step {
  id: number;
  title: string;
  tag: string;
  badge: string;
  desc: string;
  duration: number; // in seconds
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Multi-Portal Live Scraping Engine',
    tag: 'Step 01 / 03',
    badge: 'Real-Time Ingestion',
    desc: 'Otomatis scraping lowongan kerja dari Glints, LinkedIn, JobStreet, Indeed, & portal karir ATS perusahaan (Greenhouse, Lever, Workday) menjadi baris individual.',
    duration: 5,
  },
  {
    id: 2,
    title: 'Deterministic Security & Schema.org JSON-LD',
    tag: 'Step 02 / 03',
    badge: '100% Fact Checked',
    desc: 'Memvalidasi konten lowongan dari prompt injection berbahaya, mengekstrak Schema.org JobPosting terstruktur (kualifikasi, gaji, tanggung jawab, lokasi).',
    duration: 5,
  },
  {
    id: 3,
    title: 'AI Fit Evaluation & ATS Resume Tailoring',
    tag: 'Step 03 / 03',
    badge: 'ATS Precision',
    desc: 'Gemini 3.8 Flash menghitung persentase kecocokan (0-100%) terhadap fakta CV master Anda dan menghasilkan Tailored CV format ATS serta Cover Letter.',
    duration: 6,
  },
];

export function WorkflowVideoShowcase() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Auto-advancing playback timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = 50; // update every 50ms
    const stepDurationMs = STEPS[currentStep].duration * 1000;
    const increment = (interval / stepDurationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((curr) => (curr + 1) % STEPS.length);
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep]);

  const handleStepSelect = (index: number) => {
    setCurrentStep(index);
    setProgress(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-[#0c1428] via-[#090e1b] to-[#060810] p-5 lg:p-6 shadow-2xl relative overflow-hidden space-y-5">
      {/* Ambient glowing backlight */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold">
              Interactive Video Showcase &amp; Workflow Tour
            </span>
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white mt-1">
            Cara Kerja Autonomous Career Pipeline
          </h2>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause video tour' : 'Play video tour'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-mono font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" /> <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> <span>Play Demo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            aria-label="Restart video tour from step 1"
            className="h-8 w-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
            title="Restart tour"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Showcase Theater Frame (Simulated Video Display) */}
      <div className="relative z-10 rounded-xl border border-white/[0.1] bg-[#05070c] overflow-hidden shadow-2xl">
        {/* Top Video Player Bar */}
        <div className="h-8 bg-white/[0.03] border-b border-white/[0.06] px-4 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60 inline-block" />
            <span className="text-zinc-500 ml-2">Jobies Career Engine v2.5 — Interactive Demo Mode</span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {STEPS[currentStep].tag}
            </span>
            <span className="text-zinc-500">Auto-Looping</span>
          </div>
        </div>

        {/* Video Stage Container with dynamic scenes based on currentStep */}
        <div className="p-6 md:p-8 min-h-[290px] flex flex-col justify-center relative">
          {/* SCENE 1: MULTI-PORTAL SCRAPING */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Live Multi-Portal Ingestion &amp; Scraping</h3>
                    <p className="text-xs text-zinc-400">Targeting: Glints, LinkedIn, JobStreet, Indeed, &amp; Company Portals</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  ● 30 Jobs Extracted Per Query
                </span>
              </div>

              {/* Animated Query Pill */}
              <div className="p-3 rounded-lg bg-black/50 border border-white/[0.08] flex items-center gap-3 font-mono text-xs">
                <span className="text-sky-400 font-semibold">$ query:</span>
                <span className="text-zinc-200">"Frontend Developer"</span>
                <span className="text-zinc-500">• location:</span>
                <span className="text-zinc-300">"Indonesia"</span>
                <span className="ml-auto text-emerald-400 text-[11px] animate-pulse">Scraping in progress...</span>
              </div>

              {/* Simulated Extracted Job Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-blue-500/30 hover:border-blue-500/50 transition-all space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                      LinkedIn
                    </span>
                    <span className="text-zinc-500">Direct Link ↗</span>
                  </div>
                  <h4 className="font-semibold text-xs text-zinc-100 truncate">Senior Frontend Engineer</h4>
                  <p className="text-[11px] text-zinc-400">Tata Consultancy • Jakarta</p>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-red-500/30 hover:border-red-500/50 transition-all space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                      Glints
                    </span>
                    <span className="text-zinc-500">Rp 6-8 jt ↗</span>
                  </div>
                  <h4 className="font-semibold text-xs text-zinc-100 truncate">Frontend React Developer</h4>
                  <p className="text-[11px] text-zinc-400">Sigma Global Tech • Jakarta</p>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      JobStreet
                    </span>
                    <span className="text-zinc-500">Full Time ↗</span>
                  </div>
                  <h4 className="font-semibold text-xs text-zinc-100 truncate">UI/UX Web Engineer</h4>
                  <p className="text-[11px] text-zinc-400">PT Cycent Inovasi • Jakarta</p>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 2: SECURITY GATE & SCHEMA EXTRACTION */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Deterministic Inspection &amp; Schema Validation</h3>
                    <p className="text-xs text-zinc-400">Mencegah prompt injection &amp; mengekstrak Schema.org JobPosting</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  Status: SAFE • Integrity Verified
                </span>
              </div>

              {/* Security Scanner Terminal Visual */}
              <div className="p-3.5 rounded-lg bg-black/60 border border-emerald-500/30 font-mono text-xs space-y-2 relative overflow-hidden">
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>[Gate 1] Anti-Injection Inspection:</span>
                  <span className="text-emerald-400 font-bold">PASS (No Exfiltration Sigs)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>[Gate 2] Schema.org JobPosting:</span>
                  <span className="text-sky-400 font-bold">EXTRACTED (Title, Duties, Req, Salary)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>[Gate 3] Content Hash Deduplication:</span>
                  <span className="text-indigo-400 font-mono">SHA-256 Verified</span>
                </div>
              </div>

              {/* Structured Attributes Pill Row */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-zinc-300">
                <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08]">
                  💼 Role: Frontend Developer
                </span>
                <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08]">
                  🏢 Type: Full-Time / Remote
                </span>
                <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08]">
                  💰 Base Salary: IDR 6M - 8M / bln
                </span>
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✓ Ready for Fit Scoring
                </span>
              </div>
            </div>
          )}

          {/* SCENE 3: AI FIT EVALUATION & ATS RESUME */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Gemini AI Grounded Fit Match &amp; ATS Tailoring</h3>
                    <p className="text-xs text-zinc-400">Menghitung skor match 0-100% berdasarkan fakta CV &amp; meng-generate ATS Resume</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                  Gemini 3.8 Flash Engine
                </span>
              </div>

              {/* Match Score & Tailored Deliverables Display */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 p-4 rounded-lg bg-black/50 border border-white/[0.08] flex flex-col justify-center items-center text-center">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">88%</span>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 mt-1">High Match Score</span>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[88%]" />
                  </div>
                </div>

                <div className="sm:col-span-8 p-3.5 rounded-lg bg-black/50 border border-white/[0.08] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-sky-400" /> Tailored ATS Resume Ready
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">100% Grounded Facts</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Pengalaman kerja &amp; tech stack diselaraskan secara presisi dengan kebutuhan lowongan, tanpa melebih-lebihkan fakta atau halusinasi data.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      ✓ ATS PDF Ready
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                      ✓ Cover Letter Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Progress Timeline Bar */}
        <div className="w-full bg-black/70 border-t border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
            <span>{STEPS[currentStep].title}</span>
            <span className="text-sky-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Selector Scrubbing Pills (Accessible Keyboard Navigable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === idx;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepSelect(idx)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 ${
                isActive
                  ? 'border-sky-500/50 bg-sky-500/10 shadow-md ring-1 ring-sky-500/20'
                  : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.2] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono font-bold uppercase ${isActive ? 'text-sky-400' : 'text-zinc-500'}`}>
                  {step.tag}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-white/[0.04] text-zinc-500'
                  }`}
                >
                  {step.badge}
                </span>
              </div>
              <h4 className={`font-semibold text-xs truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                {step.title}
              </h4>
            </button>
          );
        })}
      </div>
    </div>
  );
}
