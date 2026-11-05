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
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-medium">Job opportunity not found.</p>
        <Link href="/jobs">
          <Button size="sm">Back to Jobs</Button>
        </Link>
      </Card>
    );
  }

  const latestAnalysis = job.analyses?.find((a: any) => a.analysisType === 'FIT_ANALYSIS');
  const fitData: FitAnalysisResult | null = latestAnalysis?.outputJson || null;
  const existingApp = job.applications?.[0];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{job.title}</h1>
            {job.integrityStatus === 'SAFE' ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Safety Gate: Safe
              </Badge>
            ) : job.integrityStatus === 'FLAGGED' ? (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Safety Gate: Flagged
              </Badge>
            ) : (
              <Badge variant="destructive">Safety Gate: Rejected</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{job.company}</span>
            {job.location && <span>• {job.location}</span>}
            <span>• Added {formatDate(job.createdAt)}</span>
            {job.sourceUrl && (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium ml-1"
              >
                Original Posting <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {existingApp ? (
            <Link href={`/applications/${existingApp.id}`}>
              <Button className="gap-2">
                <Kanban className="h-4 w-4" /> Open Application Workspace
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleCreateApplication}
              disabled={creatingApp}
              className="gap-2"
            >
              {creatingApp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Create Application Workspace
            </Button>
          )}
        </div>
      </div>

      {/* Safety Gate Findings if Flagged */}
      {job.integrityFindings && job.integrityFindings.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> Security Findings from Deterministic Gate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              {job.integrityFindings.map((finding: string, i: number) => (
                <li key={i}>{finding}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Gemini Fit Analysis Section */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Gemini AI Fit Analysis
            </CardTitle>
            <CardDescription>
              Objective compatibility evaluation strictly grounded against your career facts.
            </CardDescription>
          </div>

          <Button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            variant={fitData ? 'outline' : 'default'}
            className="gap-2 shrink-0"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing Facts...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {fitData ? 'Re-run Analysis' : 'Run Fit Analysis'}
              </>
            )}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {errorMsg}
            </div>
          )}

          {!fitData && !analyzing ? (
            <div className="p-8 text-center space-y-2 border border-dashed rounded-xl border-border">
              <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Ready to evaluate your match score</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Gemini will compare this job posting requirements with your profile and uploaded CV, scoring experience, skills, and hard criteria.
              </p>
              <Button onClick={handleRunAnalysis} size="sm" className="mt-2">
                Start Fit Analysis
              </Button>
            </div>
          ) : fitData ? (
            <div className="space-y-6">
              {/* Score Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-secondary/40 border border-border">
                <div className="md:col-span-1 text-center md:text-left flex md:flex-col justify-between items-center md:items-start border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Overall Match
                    </span>
                    <span className={`text-4xl font-extrabold ${fitData.score >= 75 ? 'text-emerald-500' : fitData.score >= 50 ? 'text-amber-500' : 'text-slate-500'}`}>
                      {fitData.score}%
                    </span>
                  </div>
                  <Badge
                    variant={fitData.recommendation === 'apply' ? 'success' : fitData.recommendation === 'consider' ? 'warning' : 'destructive'}
                    className="mt-2 uppercase font-bold text-xs"
                  >
                    Recommendation: {fitData.recommendation}
                  </Badge>
                </div>

                {/* Dimension Scores */}
                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Requirements</span>
                    <span className="text-base font-bold">{fitData.dimensions?.requirements?.score || 0}%</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Skills</span>
                    <span className="text-base font-bold">{fitData.dimensions?.skills?.score || 0}%</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Experience</span>
                    <span className="text-base font-bold">{fitData.dimensions?.experience?.score || 0}%</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Location / Work Auth</span>
                    <span className="text-base font-bold">{fitData.dimensions?.locationPreferences?.score || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Evidence vs Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Evidence */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Grounded Evidence in Profile
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {fitData.dimensions?.requirements?.evidence?.map((ev, i) => (
                      <li key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-muted-foreground">
                        {ev}
                      </li>
                    ))}
                    {fitData.dimensions?.skills?.evidence?.map((ev, i) => (
                      <li key={`skill-${i}`} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-muted-foreground">
                        {ev}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Requirements Gaps / Missing Evidence
                  </h4>
                  {fitData.gaps && fitData.gaps.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {fitData.gaps.map((gap, i) => (
                        <li key={i} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-muted-foreground">
                          {gap}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No significant gaps detected.</p>
                  )}
                </div>
              </div>

              {/* Clarification Questions */}
              {fitData.questions && fitData.questions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-primary" /> Clarification Questions to Consider
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                    {fitData.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Raw Posting Text collapsible */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Job Description Snapshot</CardTitle>
          <CardDescription className="text-xs">
            Cleaned and normalized text stored for factual grounding and diff comparison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto p-4 rounded-lg bg-secondary/50 border border-border text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">
            {job.rawText}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
