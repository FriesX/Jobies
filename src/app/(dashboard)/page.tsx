import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Briefcase,
  Kanban,
  FileText,
  Award,
  ArrowRight,
  PlusCircle,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch summary stats
  const [totalJobs, totalApplications, totalDocs, jobs, applications] = await Promise.all([
    prisma.jobPosting.count({ where: { userId: session.id } }),
    prisma.application.count({ where: { userId: session.id } }),
    prisma.document.count({ where: { userId: session.id } }),
    prisma.jobPosting.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        analyses: {
          where: { analysisType: 'FIT_ANALYSIS' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        applications: {
          select: { id: true, status: true },
        },
      },
    }),
    prisma.application.findMany({
      where: { userId: session.id },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      include: { job: true },
    }),
  ]);

  const interviewsCount = await prisma.application.count({
    where: { userId: session.id, status: 'INTERVIEW' },
  });
  const offersCount = await prisma.application.count({
    where: { userId: session.id, status: 'OFFER' },
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent p-6 md:p-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Career Strategist</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {session.displayName || 'Job Seeker'} 👋
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Manage your opportunities from one secure dashboard. Ingest jobs safely, evaluate true fit scores, tailor ATS-optimized CVs, and practice interview Q&As.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/jobs/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" /> Ingest New Job
            </Button>
          </Link>
          <Link href="/documents">
            <Button variant="outline" className="gap-2">
              <UploadCloud className="h-4 w-4" /> Upload CV Vault
            </Button>
          </Link>
          <Link href="/applications">
            <Button variant="secondary" className="gap-2">
              <Kanban className="h-4 w-4" /> Open Kanban Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Ingested Jobs</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{totalJobs}</span>
            <span className="text-xs text-muted-foreground">tracked</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Applications</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Kanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{totalApplications}</span>
            <span className="text-xs text-muted-foreground">in pipeline</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Interviews</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-500">{interviewsCount}</span>
            <span className="text-xs text-muted-foreground">active stages</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Offers Received</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-500">{offersCount}</span>
            <span className="text-xs text-muted-foreground">congratulations!</span>
          </div>
        </Card>
      </div>

      {/* Two columns: Recent Jobs & Active Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent Jobs & Fit Analyses</h2>
            <Link href="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              View all jobs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No job postings ingested yet.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Paste a job description or provide a job URL to analyze candidate fit and tailor your CV.
              </p>
              <Link href="/jobs/new">
                <Button size="sm" className="mt-2">
                  Ingest First Job
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const fitAnalysis = job.analyses[0]?.outputJson as any;
                const fitScore = fitAnalysis?.score;
                const app = job.applications[0];

                return (
                  <Card key={job.id} className="p-4 hover:border-primary/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                          {job.integrityStatus === 'SAFE' ? (
                            <Badge variant="success" className="text-[10px]">Safe</Badge>
                          ) : job.integrityStatus === 'FLAGGED' ? (
                            <Badge variant="warning" className="text-[10px] flex items-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" /> Flagged
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">Rejected</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.company} {job.location ? `• ${job.location}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {fitScore !== undefined ? (
                          <div className="text-right">
                            <span className={`text-base font-bold ${fitScore >= 75 ? 'text-emerald-500' : fitScore >= 50 ? 'text-amber-500' : 'text-slate-500'}`}>
                              {fitScore}%
                            </span>
                            <span className="block text-[10px] text-muted-foreground uppercase">Fit Score</span>
                          </div>
                        ) : (
                          <Link href={`/jobs/${job.id}`}>
                            <Badge variant="outline" className="text-[11px] hover:bg-secondary cursor-pointer">
                              Not Analyzed
                            </Badge>
                          </Link>
                        )}

                        <Link href={`/jobs/${job.id}`}>
                          <Button variant="outline" size="sm" className="h-8">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Pipeline column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Active Pipeline</h2>
            <Link href="/applications" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              Tracker <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <Card className="p-6 text-center space-y-2">
              <Kanban className="h-6 w-6 text-muted-foreground mx-auto" />
              <p className="text-xs font-medium">No applications created yet.</p>
              <p className="text-[11px] text-muted-foreground">
                Select an analyzed job and create an application workspace to track progress.
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {applications.map((app) => (
                <Card key={app.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate max-w-[180px]">
                      {app.job.title}
                    </span>
                    <Badge variant={app.status === 'OFFER' ? 'success' : app.status === 'INTERVIEW' ? 'warning' : 'secondary'} className="text-[10px]">
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{app.job.company}</p>
                  <div className="pt-1 flex justify-end">
                    <Link href={`/applications/${app.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary">
                        Open Workspace →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
