'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
  Kanban,
  FileText,
  Building2,
  MapPin,
  Calendar,
  Layers,
  BarChart3,
  Check,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { FitAnalysisResult } from '@/lib/gemini';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [creatingApp, setCreatingApp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (data.job) setJob(data.job);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/jobs/${id}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchJob();
      } else {
        setErrorMsg(data.error || 'Failed to complete fit analysis.');
      }
    } catch {
      setErrorMsg('Network error while running fit analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateApplication = async () => {
    setCreatingApp(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      });
      const data = await res.json();
      if (data.application) {
        router.push(`/applications/${data.application.id}`);
      }
    } finally {
      setCreatingApp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <span className="text-xs font-mono text-zinc-400">Loading Opportunity Telemetry...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-12 text-center space-y-4 max-w-lg mx-auto mt-12">
        <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-semibold text-white">Job Not Found</h3>
        <p className="text-xs text-zinc-400">
          The requested job opportunity could not be retrieved or has been removed.
        </p>
        <Link href="/jobs" className="inline-block pt-2">
          <Button variant="glow" size="sm">Back to Pipeline</Button>
        </Link>
      </div>
    );
  }

  const latestAnalysis = job.analyses?.find((a: any) => a.analysisType === 'FIT_ANALYSIS');
  const fitData: FitAnalysisResult | null = latestAnalysis?.outputJson || null;
  const existingApp = job.applications?.[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                Opportunity Details
              </span>
              <span className="text-zinc-600">•</span>
              {job.integrityStatus === 'SAFE' ? (
                <Badge variant="success" className="gap-1 font-mono text-[10px] py-0 px-2 h-4">
                  <ShieldCheck className="h-3 w-3" /> Safety Gate: Safe
                </Badge>
              ) : job.integrityStatus === 'FLAGGED' ? (
                <Badge variant="warning" className="gap-1 font-mono text-[10px] py-0 px-2 h-4">
                  <AlertTriangle className="h-3 w-3" /> Safety Gate: Flagged
                </Badge>
              ) : (
                <Badge variant="destructive" className="font-mono text-[10px] py-0 px-2 h-4">
                  Safety Gate: Rejected
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">{job.title}</h1>

            <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
              <span className="font-medium text-zinc-200 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                {job.company}
              </span>
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  {job.location}
                </span>
              )}
              <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Ingested {formatDate(job.createdAt)}
              </span>
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1 ml-1"
                >
                  Original Posting <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {existingApp ? (
              <Link href={`/applications/${existingApp.id}`}>
                <Button variant="glow" size="sm" className="gap-2 h-9 text-xs">
                  <Kanban className="h-3.5 w-3.5" /> Open Application Studio
                </Button>
              </Link>
            ) : (
              <Button
                onClick={handleCreateApplication}
                disabled={creatingApp}
                variant="glow"
                size="sm"
                className="gap-2 h-9 text-xs"
              >
                {creatingApp ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                <span>Initialize Application Studio</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Safety Gate Findings if Flagged */}
      {job.integrityFindings && job.integrityFindings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono uppercase font-semibold">
            <AlertTriangle className="h-4 w-4" />
            <span>Deterministic Gate Findings</span>
          </div>
          <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1 font-mono">
            {job.integrityFindings.map((finding: string, i: number) => (
              <li key={i}>{finding}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Gemini Fit Analysis Section */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-mono uppercase font-bold tracking-wider text-zinc-200">
                Gemini AI Compatibility Analysis
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strictly grounded against your career fact sheet and private vault documents.
            </p>
          </div>

          <Button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            variant="outline"
            size="sm"
            className="gap-2 h-8 text-xs border-sky-500/30 text-sky-300 hover:bg-sky-500/10 shrink-0"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" /> Grounding Facts...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> {fitData ? 'Re-evaluate Fit' : 'Run Fit Analysis'}
              </>
            )}
          </Button>
        </div>

        {errorMsg && (
          <div className="p-3.5 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!fitData && !analyzing ? (
          <div className="p-12 text-center space-y-3 rounded-xl border border-dashed border-white/[0.08] bg-[#0b0f19]/40">
            <BarChart3 className="h-8 w-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Ready for Multi-Dimensional Matching</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Gemini will evaluate your profile and documents against this job's technical stack, experience thresholds, and domain criteria.
            </p>
            <div className="pt-2">
              <Button onClick={handleRunAnalysis} variant="glow" size="sm" className="h-8 text-xs">
                Run Fit Analysis
              </Button>
            </div>
          </div>
        ) : fitData ? (
          <div className="space-y-6">
            {/* Score & Dimensions Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-[#090d16] border border-white/[0.06]">
              <div className="md:col-span-1 text-center md:text-left flex md:flex-col justify-between items-center md:items-start border-b md:border-b-0 md:border-r border-white/[0.08] pb-4 md:pb-0 md:pr-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    Match Confidence
                  </span>
                  <div className="flex items-baseline justify-center md:justify-start gap-1 mt-1">
                    <span
                      className={`text-4xl font-black font-mono ${
                        fitData.score >= 75
                          ? 'text-emerald-400'
                          : fitData.score >= 50
                          ? 'text-amber-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {fitData.score}
                    </span>
                    <span className="text-sm text-zinc-500 font-mono">%</span>
                  </div>
                </div>
                <Badge
                  variant={
                    fitData.recommendation === 'apply'
                      ? 'success'
                      : fitData.recommendation === 'consider'
                      ? 'warning'
                      : 'destructive'
                  }
                  className="mt-3 uppercase font-mono text-[10px] px-2.5 py-0.5"
                >
                  Verdict: {fitData.recommendation}
                </Badge>
              </div>

              {/* 4 Dimension Scores */}
              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0c101d] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Requirements</span>
                  <span className="text-base font-bold font-mono text-white">
                    {fitData.dimensions?.requirements?.score || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#0c101d] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Skills Stack</span>
                  <span className="text-base font-bold font-mono text-white">
                    {fitData.dimensions?.skills?.score || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#0c101d] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Experience</span>
                  <span className="text-base font-bold font-mono text-white">
                    {fitData.dimensions?.experience?.score || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#0c101d] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Auth / Location</span>
                  <span className="text-base font-bold font-mono text-white">
                    {fitData.dimensions?.locationPreferences?.score || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence vs Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Evidence */}
              <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-400">
                    Grounded Evidence in Facts
                  </span>
                </div>
                <ul className="space-y-2 text-xs">
                  {fitData.dimensions?.requirements?.evidence?.map((ev, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-zinc-300 leading-relaxed"
                    >
                      {ev}
                    </li>
                  ))}
                  {fitData.dimensions?.skills?.evidence?.map((ev, i) => (
                    <li
                      key={`skill-${i}`}
                      className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-zinc-300 leading-relaxed"
                    >
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-amber-400">
                    Missing Evidence &amp; Discrepancies
                  </span>
                </div>
                {fitData.gaps && fitData.gaps.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {fitData.gaps.map((gap, i) => (
                      <li
                        key={i}
                        className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-zinc-300 leading-relaxed"
                      >
                        {gap}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-500 italic p-3">No significant qualification gaps detected.</p>
                )}
              </div>
            </div>

            {/* Clarification Questions */}
            {fitData.questions && fitData.questions.length > 0 && (
              <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-200">
                    Recommended Diligence Questions
                  </span>
                </div>
                <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1">
                  {fitData.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Raw Posting Text Snapshot */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-5 space-y-2 shadow-md">
        <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-300">
          Normalized Posting Description
        </h3>
        <div className="max-h-60 overflow-y-auto p-4 rounded-lg bg-[#07090e] border border-white/[0.04] text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap font-mono">
          {job.rawText}
        </div>
      </div>
    </div>
  );
}
