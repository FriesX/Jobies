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
  ExternalLink,
  Flame,
  Clock,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { WorkflowVideoShowcase } from '@/components/dashboard/WorkflowVideoShowcase';

function getDashboardPortalBadge(sourceHost: string | null, sourceUrl: string | null) {
  const host = (sourceHost || '').toLowerCase();
  const url = (sourceUrl || '').toLowerCase();
  if (host.includes('linkedin') || url.includes('linkedin.com')) {
    return { label: 'LinkedIn', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' };
  }
  if (host.includes('glints') || url.includes('glints.com')) {
    return { label: 'Glints', color: 'bg-red-500/10 text-red-400 border-red-500/25' };
  }
  if (host.includes('jobstreet') || url.includes('jobstreet.co')) {
    return { label: 'JobStreet', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25' };
  }
  if (host.includes('indeed') || url.includes('indeed.com')) {
    return { label: 'Indeed', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' };
  }
  if (url.startsWith('http')) {
    return { label: 'Company Web', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' };
  }
  return { label: 'Manual Entry', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25' };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch summary stats & latest entries
  const [totalJobs, totalApplications, totalDocs, jobs, applications] = await Promise.all([
    prisma.jobPosting.count({ where: { userId: session.id } }),
    prisma.application.count({ where: { userId: session.id } }),
    prisma.document.count({ where: { userId: session.id } }),
    prisma.jobPosting.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
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
      take: 5,
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Precision Hero / Command Strip */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0e1424] via-[#0b0f19] to-[#07090e] p-6 lg:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
              <Zap className="h-3.5 w-3.5" />
              <span>Jobies Autonomous Career Engine v2.5</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {session.displayName || 'Candidate'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              Console karir otonom Anda telah tersinkronisasi. Cari lowongan otomatis dari Glints, LinkedIn, JobStreet, atau website karir perusahaan, ukur kecocokan CV berbasis fakta, dan generate resume ATS kustom secara instan.
            </p>
          </div>

          {/* Quick Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/jobs/new">
              <Button variant="glow" className="gap-2 h-10 px-4 text-xs font-semibold shadow-lg">
                <PlusCircle className="h-4 w-4" /> Cari &amp; Scrape Lowongan
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="gap-2 h-10 px-4 text-xs border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08]">
                <Briefcase className="h-4 w-4 text-sky-400" /> Matrix Tracker
              </Button>
            </Link>
            <Link href="/documents">
              <Button variant="outline" className="gap-2 h-10 px-4 text-xs border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08]">
                <UploadCloud className="h-4 w-4 text-zinc-300" /> CV Vault
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* INTERACTIVE VIDEO SHOWCASE & WORKFLOW TOUR */}
      <WorkflowVideoShowcase />

      {/* Metrics Row: 4 Precision KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-white/[0.07] bg-[#0c101d]/60 p-4 hover-lift backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">Tracked Jobs</span>
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">{totalJobs}</span>
            <span className="text-[11px] text-zinc-500 font-mono">ingested</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-sky-400/90 font-mono">
            <TrendingUp className="h-3 w-3" />
            <span>Multi-portal sync</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0c101d]/60 p-4 hover-lift backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">Applications</span>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Kanban className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">{totalApplications}</span>
            <span className="text-[11px] text-zinc-500 font-mono">active</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-400/90 font-mono">
            <Clock className="h-3 w-3" />
            <span>8 Kanban stages</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0c101d]/60 p-4 hover-lift backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">Interviews</span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-400">{interviewsCount}</span>
            <span className="text-[11px] text-zinc-500 font-mono">scheduled</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400/90 font-mono">
            <Flame className="h-3 w-3" />
            <span>Ready for mock simulator</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0c101d]/60 p-4 hover-lift backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">Offers</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">{offersCount}</span>
            <span className="text-[11px] text-zinc-500 font-mono">received</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-mono">
            <Sparkles className="h-3 w-3" />
            <span>Goal achieved</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Matrix & Active Kanbans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Jobs with Fit Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold tracking-wide uppercase text-zinc-300 font-mono">
                Recent Scraped Opportunities
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                {jobs.length} shown
              </span>
            </div>
            <Link
              href="/jobs"
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors font-semibold"
            >
              Full Ingestion Console <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0b0f19]/40 p-8 text-center space-y-3">
              <Briefcase className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-300">Belum ada lowongan pekerjaan tersimpan.</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Gunakan tab Pencarian Cepat untuk mengekstrak lowongan dari Glints, LinkedIn, JobStreet, atau website karir perusahaan.
              </p>
              <Link href="/jobs/new" className="inline-block pt-1">
                <Button variant="glow" size="sm" className="h-8 text-xs font-semibold">
                  Mulai Pencarian Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                let fitScore: number | undefined;
                if (job.analyses[0]?.outputJson) {
                  const raw = job.analyses[0].outputJson as any;
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  fitScore = parsed?.score;
                }
                const app = job.applications[0];
                const portal = getDashboardPortalBadge(job.sourceHost, job.sourceUrl);

                return (
                  <div
                    key={job.id}
                    className="group rounded-xl border border-white/[0.06] bg-[#0b0f19]/70 hover:bg-[#0e1424]/90 hover:border-sky-500/30 p-4 transition-all hover-lift flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-sky-300 transition-colors truncate">
                          {job.title}
                        </h3>

                        {/* Portal Badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${portal.color}`}>
                          {portal.label}
                        </span>

                        {job.integrityStatus === 'SAFE' ? (
                          <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4 font-mono">
                            Safe
                          </Badge>
                        ) : job.integrityStatus === 'FLAGGED' ? (
                          <Badge variant="warning" className="text-[10px] py-0 px-1.5 h-4 font-mono flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> Flagged
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4 font-mono">
                            Rejected
                          </Badge>
                        )}

                        {job.sourceUrl && (
                          <a
                            href={job.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-sky-400 transition-colors inline-flex items-center gap-1 text-[10px] font-mono"
                            title="Buka postingan lowongan kerja asli di tab baru"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="font-medium text-zinc-300">{job.company}</span>
                        {job.location && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">{job.location}</span>
                          </>
                        )}
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500 font-mono text-[11px]">
                          {new Date(job.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Score Bar & Action */}
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-white/[0.05] pt-2.5 sm:pt-0">
                      {fitScore !== undefined ? (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-baseline justify-end gap-0.5">
                              <span
                                className={`text-base font-bold font-mono ${
                                  fitScore >= 75
                                    ? 'text-emerald-400'
                                    : fitScore >= 50
                                    ? 'text-amber-400'
                                    : 'text-zinc-400'
                                }`}
                              >
                                {fitScore}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">%</span>
                            </div>
                            <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block">
                              Fit Match
                            </span>
                          </div>
                          {/* Mini progress bar */}
                          <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                fitScore >= 75
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : fitScore >= 50
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                  : 'bg-zinc-600'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, fitScore))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-500 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.05]">
                          Not Analyzed
                        </span>
                      )}

                      {app ? (
                        <Link href={`/applications/${app.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-mono border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.08]">
                            Workspace →
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/jobs`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-mono border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.08]">
                            Review
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Applications Pipeline */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold tracking-wide uppercase text-zinc-300 font-mono">
                Active Applications
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                {applications.length}
              </span>
            </div>
            <Link
              href="/applications"
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors font-semibold"
            >
              Board <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0b0f19]/40 p-6 text-center space-y-2">
              <Kanban className="h-6 w-6 text-zinc-600 mx-auto" />
              <p className="text-xs font-medium text-zinc-300">Belum ada lamaran aktif</p>
              <p className="text-[11px] text-zinc-500">
                Pilih lowongan di halaman tracker dan klik Tailor CV untuk memulai pelacakan tahapan lamaran.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-white/[0.06] bg-[#0b0f19]/70 hover:bg-[#0e1424]/90 hover:border-indigo-500/30 p-3.5 space-y-2.5 transition-all hover-lift"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-zinc-100 truncate">
                        {app.job.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {app.job.company}
                      </p>
                    </div>
                    <Badge
                      variant={
                        app.status === 'OFFER'
                          ? 'success'
                          : app.status === 'INTERVIEW'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px] font-mono uppercase px-2 py-0 h-4"
                    >
                      {app.status}
                    </Badge>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-white/[0.04]">
                    <span className="text-[10px] font-mono text-zinc-500">
                      Updated {new Date(app.updatedAt).toLocaleDateString()}
                    </span>
                    <Link href={`/applications/${app.id}`}>
                      <span className="text-xs font-mono text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-semibold">
                        Open Studio →
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
