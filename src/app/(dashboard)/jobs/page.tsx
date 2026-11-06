'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  Briefcase,
  PlusCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  Sparkles,
  FileText,
  Mail,
  Zap,
  Loader2,
  Filter,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { TailoredCvData, FitAnalysisResult } from '@/lib/gemini';

interface ApplicationData {
  id: string;
  status: string;
  tailoredCvJson: TailoredCvData | null;
  coverLetterMarkdown: string | null;
  reviewerFeedback: any | null;
  notes: string | null;
  updatedAt: string;
}

interface JobRowItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  sourceUrl: string | null;
  rawText: string;
  integrityStatus: string;
  integrityFindings: string[] | null;
  createdAt: string;
  analyses: Array<{
    id: string;
    outputJson: FitAnalysisResult;
  }>;
  applications: ApplicationData[];
}

export default function JobsDensityTablePage() {
  const [jobs, setJobs] = useState<JobRowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterScore, setFilterScore] = useState<'ALL' | 'HIGH' | 'PENDING'>('ALL');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'CV' | 'COVER_LETTER' | 'ANALYSIS' | 'JOB_TEXT'>('CV');

  // Loading states per job action
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Run AI Fit Analysis for a specific job
  const handleRunAnalysis = async (jobId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAnalyzingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchJobs();
        setExpandedJobId(jobId);
        setActiveDrawerTab('ANALYSIS');
      } else {
        alert(data.error || 'Failed to run analysis.');
      }
    } catch {
      alert('Network error while analyzing.');
    } finally {
      setAnalyzingId(null);
    }
  };

  // Generate Tailored CV and Cover Letter for a job
  const handleGenerateDocuments = async (jobId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGeneratingId(jobId);

    try {
      // 1. Ensure application exists
      let targetJob = jobs.find((j) => j.id === jobId);
      let appId = targetJob?.applications?.[0]?.id;

      if (!appId) {
        const createRes = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        const createData = await createRes.json();
        appId = createData.application?.id;
      }

      if (!appId) throw new Error('Could not initialize application workspace.');

      // 2. Generate Tailored CV and Cover Letter
      const genRes = await fetch(`/api/applications/${appId}/generate`, { method: 'POST' });
      const genData = await genRes.json();

      if (genRes.ok) {
        await fetchJobs();
        setExpandedJobId(jobId);
        setActiveDrawerTab('CV');
      } else {
        alert(genData.error || 'Failed to tailor documents.');
      }
    } catch (err: any) {
      alert(err.message || 'Error tailoring documents.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyCoverLetter = (markdown: string, appId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(markdown);
    setCopiedAppId(appId);
    setTimeout(() => setCopiedAppId(null), 2000);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(query.toLowerCase()));

    const fitScore = job.analyses?.[0]?.outputJson?.score;

    if (filterScore === 'HIGH') return matchesQuery && fitScore !== undefined && fitScore >= 75;
    if (filterScore === 'PENDING') return matchesQuery && fitScore === undefined;
    return matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Scraped Opportunities & Match Tracker
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {jobs.length} jobs
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Compact high-density matrix: review CV match percentages, inspect original postings, and access tailored CVs &amp; cover letters instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/jobs/new">
            <Button size="sm" className="gap-1.5 shadow-sm active:scale-95 transition-all">
              <PlusCircle className="h-4 w-4" /> Scrape / Ingest Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Density Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-2.5 rounded-xl border border-border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            placeholder="Filter by title, company, or tech stack..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background/50 border-border/70"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-0.5" />
          {(['ALL', 'HIGH', 'PENDING'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterScore(filter)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                filterScore === filter
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {filter === 'ALL' && 'All Jobs'}
              {filter === 'HIGH' && '🔥 High Match (≥75%)'}
              {filter === 'PENDING' && '⏳ Unanalyzed'}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Interactive Data Rows */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-3">
          <Briefcase className="h-9 w-9 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-sm">No job postings found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {query
              ? 'No opportunities match your search filter.'
              : 'Start by pasting a job description or scraping a job URL.'}
          </p>
          <Link href="/jobs/new">
            <Button size="sm" className="mt-2 text-xs">
              Scrape New Job
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredJobs.map((job) => {
            const fitAnalysis = job.analyses?.[0]?.outputJson;
            const score = fitAnalysis?.score;
            const app = job.applications?.[0];
            const tailoredCv = app?.tailoredCvJson;
            const coverLetter = app?.coverLetterMarkdown;
            const isExpanded = expandedJobId === job.id;

            return (
              <div
                key={job.id}
                className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-primary shadow-lg ring-1 ring-primary/20 bg-card'
                    : 'border-border/80 hover:border-border hover:shadow-md hover:-translate-y-[1px] bg-card/70 backdrop-blur-sm'
                }`}
              >
                {/* Main Row Bar (Clickable) */}
                <div
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  {/* Left: Company Logo Avatar & Job Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Monogram Badge */}
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/15 via-secondary to-primary/5 border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0 group-hover:scale-105 transition-transform">
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {job.title}
                        </span>

                        {job.sourceUrl && (
                          <a
                            href={job.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                            title="Buka link postingan lowongan kerja asli"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            <span>Link Lowongan</span>
                          </a>
                        )}

                        {job.integrityStatus === 'SAFE' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <ShieldCheck className="h-2.5 w-2.5" /> Safe
                          </span>
                        ) : job.integrityStatus === 'FLAGGED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <AlertTriangle className="h-2.5 w-2.5" /> Flagged
                          </span>
                        ) : null}

                        {app && (
                          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            {app.status}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-foreground/90">{job.company}</span>
                        {job.location && <span>• {job.location}</span>}
                        <span>• Added {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Match Percentage & Quick Action Chips */}
                  <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                    {/* Fit Score Gauge */}
                    <div className="flex items-center gap-2.5">
                      {score !== undefined ? (
                        <div className="flex items-center gap-2 bg-secondary/50 px-2.5 py-1 rounded-lg border border-border">
                          <div className="text-right">
                            <span
                              className={`text-sm font-extrabold ${
                                score >= 75
                                  ? 'text-emerald-500'
                                  : score >= 50
                                  ? 'text-amber-500'
                                  : 'text-slate-500'
                              }`}
                            >
                              {score}%
                            </span>
                            <span className="text-[9px] uppercase font-bold block text-muted-foreground leading-none">
                              Match
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-12 bg-border/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                score >= 75
                                  ? 'bg-emerald-500'
                                  : score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={analyzingId === job.id}
                          onClick={(e) => handleRunAnalysis(job.id, e)}
                          className="text-[11px] font-semibold text-primary hover:text-primary-foreground hover:bg-primary border border-primary/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95"
                        >
                          {analyzingId === job.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Scoring...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" /> Score Match
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Quick Artifact Indicators */}
                    <div className="flex items-center gap-1.5">
                      {/* Original Posting Link */}
                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 rounded-lg border border-border bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                          title="Open original job posting"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {/* Tailored CV Pill */}
                      {tailoredCv ? (
                        <span
                          className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1"
                          title="Tailored CV is ready"
                        >
                          <FileText className="h-3 w-3" /> CV Ready
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={generatingId === job.id}
                          onClick={(e) => handleGenerateDocuments(job.id, e)}
                          className="text-[10px] font-medium text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded-md transition-all active:scale-95"
                          title="Generate Tailored CV and Cover Letter"
                        >
                          {generatingId === job.id ? (
                            <Loader2 className="h-3 w-3 animate-spin inline" />
                          ) : (
                            '+ Tailor CV'
                          )}
                        </button>
                      )}

                      {/* Cover Letter Pill */}
                      {coverLetter ? (
                        <span
                          className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md flex items-center gap-1"
                          title="Cover letter is ready"
                        >
                          <Mail className="h-3 w-3" /> Letter
                        </span>
                      ) : null}

                      {/* Expand/Collapse Chevron */}
                      <div className="text-muted-foreground ml-1">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Drawer (Expands smoothly on click) */}
                {isExpanded && (
                  <div className="border-t border-border/80 bg-background/50 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Drawer Tab Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('CV')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeDrawerTab === 'CV'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5" /> Tailored CV (PDF)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('COVER_LETTER')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeDrawerTab === 'COVER_LETTER'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Mail className="h-3.5 w-3.5" /> Cover Letter
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('ANALYSIS')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeDrawerTab === 'ANALYSIS'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Fit Breakdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('JOB_TEXT')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeDrawerTab === 'JOB_TEXT'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Briefcase className="h-3.5 w-3.5" /> Scraped Posting
                        </button>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2">
                        {job.sourceUrl && (
                          <a
                            href={job.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                          >
                            Open Original Link <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {app && (
                          <Link href={`/applications/${app.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              Full Workspace →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* DRAWER TAB 1: TAILORED CV */}
                    {activeDrawerTab === 'CV' && (
                      <div className="space-y-3">
                        {!tailoredCv ? (
                          <div className="p-6 text-center rounded-xl border border-dashed border-border bg-card/50 space-y-2">
                            <p className="text-xs font-medium text-foreground">
                              No tailored CV generated yet for this specific job.
                            </p>
                            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                              Gemini will align your proven experience bullet-points and skills to match the exact requirements of {job.company}.
                            </p>
                            <Button
                              size="sm"
                              disabled={generatingId === job.id}
                              onClick={() => handleGenerateDocuments(job.id)}
                              className="mt-1 gap-1 text-xs"
                            >
                              {generatingId === job.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Tailoring with Facts...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" /> Generate Tailored CV Now
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Download Action Bar */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                              <div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                                  Tailored ATS Resume Ready
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                  Exclusively tailored for {job.title} at {job.company}.
                                </span>
                              </div>
                              <a
                                href={`/api/applications/${app?.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold">
                                  <Download className="h-3.5 w-3.5" /> Download ATS PDF
                                </Button>
                              </a>
                            </div>

                            {/* Structured Preview */}
                            <div className="p-5 rounded-xl border border-border bg-card space-y-4 text-xs font-sans max-h-96 overflow-y-auto">
                              <div>
                                <h3 className="text-base font-bold text-foreground uppercase">{tailoredCv.fullName}</h3>
                                <p className="text-primary font-semibold text-xs">{tailoredCv.headline}</p>
                              </div>

                              {tailoredCv.professionalSummary && (
                                <div className="space-y-1">
                                  <span className="font-bold text-foreground uppercase text-[10px] tracking-wider block border-b border-border pb-0.5">
                                    Tailored Summary
                                  </span>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {tailoredCv.professionalSummary}
                                  </p>
                                </div>
                              )}

                              {tailoredCv.experiences?.length > 0 && (
                                <div className="space-y-2">
                                  <span className="font-bold text-foreground uppercase text-[10px] tracking-wider block border-b border-border pb-0.5">
                                    Targeted Achievements
                                  </span>
                                  {tailoredCv.experiences.map((exp, i) => (
                                    <div key={i} className="space-y-1">
                                      <div className="flex justify-between font-semibold">
                                        <span>{exp.role} — <span className="text-primary">{exp.company}</span></span>
                                        <span className="text-[10px] text-muted-foreground">{exp.startDate} - {exp.endDate}</span>
                                      </div>
                                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                                        {exp.bulletPoints.map((pt, pIdx) => (
                                          <li key={pIdx}>{pt}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRAWER TAB 2: COVER LETTER */}
                    {activeDrawerTab === 'COVER_LETTER' && (
                      <div className="space-y-3">
                        {!coverLetter ? (
                          <div className="p-6 text-center rounded-xl border border-dashed border-border bg-card/50 space-y-2">
                            <p className="text-xs font-medium text-foreground">
                              No cover letter generated yet.
                            </p>
                            <Button
                              size="sm"
                              disabled={generatingId === job.id}
                              onClick={() => handleGenerateDocuments(job.id)}
                              className="gap-1 text-xs"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Generate Cover Letter
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Full-Text Markdown
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleCopyCoverLetter(coverLetter, app!.id, e)}
                                className="h-7 text-xs gap-1"
                              >
                                {copiedAppId === app?.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-500" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" /> Copy to Clipboard
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-card max-h-80 overflow-y-auto text-xs leading-relaxed text-foreground prose dark:prose-invert">
                              <ReactMarkdown>{coverLetter}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRAWER TAB 3: FIT BREAKDOWN */}
                    {activeDrawerTab === 'ANALYSIS' && (
                      <div className="space-y-3">
                        {!fitAnalysis ? (
                          <div className="p-6 text-center rounded-xl border border-dashed border-border bg-card/50 space-y-2">
                            <p className="text-xs font-medium text-foreground">
                              Fit evaluation not run yet.
                            </p>
                            <Button
                              size="sm"
                              disabled={analyzingId === job.id}
                              onClick={() => handleRunAnalysis(job.id)}
                              className="gap-1 text-xs"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Run Match Analysis
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border">
                              <span className="font-bold text-emerald-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Supported Facts in Your CV
                              </span>
                              <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                                {fitAnalysis.dimensions?.requirements?.evidence?.map((ev, i) => (
                                  <li key={i} className="p-2 rounded bg-secondary/50">
                                    {ev}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border">
                              <span className="font-bold text-amber-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5" /> Missing Experience / Gaps
                              </span>
                              {fitAnalysis.gaps?.length > 0 ? (
                                <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                                  {fitAnalysis.gaps.map((gap, i) => (
                                    <li key={i} className="p-2 rounded bg-amber-500/5 border border-amber-500/20">
                                      {gap}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[11px] text-muted-foreground">No significant gaps detected.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRAWER TAB 4: ORIGINAL JOB TEXT */}
                    {activeDrawerTab === 'JOB_TEXT' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Scraped Raw Content Snapshot</span>
                          {job.sourceUrl && (
                            <a
                              href={job.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              Visit URL <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="p-4 rounded-xl border border-border bg-secondary/30 text-xs text-muted-foreground max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
                          {job.rawText}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
