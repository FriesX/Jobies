'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Kanban,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
  Calendar,
  ArrowRight,
  PlusCircle,
  Building2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { formatDate } from '@/lib/utils';

const STATUS_COLUMNS = [
  { id: 'SAVED', label: 'Saved', color: 'bg-zinc-400', border: 'border-zinc-500/30' },
  { id: 'SCREENING', label: 'Screening', color: 'bg-sky-400', border: 'border-sky-500/30' },
  { id: 'APPLIED', label: 'Applied', color: 'bg-indigo-400', border: 'border-indigo-500/30' },
  { id: 'INTERVIEW', label: 'Interview', color: 'bg-amber-400', border: 'border-amber-500/30' },
  { id: 'OFFER', label: 'Offer', color: 'bg-emerald-400', border: 'border-emerald-500/30' },
  { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-400', border: 'border-rose-500/30' },
  { id: 'CLOSED', label: 'Closed', color: 'bg-zinc-600', border: 'border-zinc-700/30' },
];

export default function ApplicationsKanbanPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    // Optimistic update
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );

    // If moving to OFFER, launch confetti!
    if (newStatus === 'OFFER') {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#38bdf8', '#818cf8', '#f59e0b'],
        });
      } catch (e) {
        console.error(e);
      }
    }

    try {
      await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      fetchApplications();
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.job.title?.toLowerCase().includes(q) ||
      app.job.company?.toLowerCase().includes(q) ||
      app.job.location?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <span className="text-xs font-mono text-zinc-400">Loading Pipeline Board...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Precision Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
              Pipeline Management
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-zinc-400">{applications.length} Active Records</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Application Kanban</h1>
          <p className="text-xs text-zinc-400">
            Track hiring stages with tactile precision. Drag or update statuses and access tailored documents directly.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-48 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#0c101d] pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          <Link href="/jobs">
            <Button variant="glow" size="sm" className="gap-2 h-8 text-xs shrink-0">
              <PlusCircle className="h-3.5 w-3.5" /> Ingest From Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-3.5 overflow-x-auto pb-6 items-start min-h-[640px]">
        {STATUS_COLUMNS.map((col) => {
          const colApps = filteredApplications.filter((app) => app.status === col.id);

          return (
            <div
              key={col.id}
              className={`w-72 shrink-0 flex flex-col rounded-xl border border-white/[0.07] bg-[#090d16]/70 backdrop-blur-md max-h-[82vh] transition-all`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-white/[0.06] flex items-center justify-between bg-[#0c101d]/80 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="font-semibold text-xs tracking-tight text-zinc-200 font-mono uppercase">
                    {col.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                  {colApps.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                {colApps.length === 0 ? (
                  <div className="p-6 text-center text-[11px] font-mono text-zinc-600 border border-dashed rounded-lg border-white/[0.05]">
                    No entries
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      className="group rounded-xl border border-white/[0.07] bg-[#0c101d] hover:bg-[#0f1526] hover:border-sky-500/30 p-3.5 space-y-2.5 transition-all hover-lift shadow-sm"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-xs text-zinc-100 group-hover:text-sky-300 transition-colors line-clamp-1">
                          {app.job.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-zinc-500" />
                          <span>{app.job.company}</span>
                          {app.job.location && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-500">{app.job.location}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {app.followUpDate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>Follow-up: {formatDate(app.followUpDate)}</span>
                        </div>
                      )}

                      {/* Status Selector & Studio CTA */}
                      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-2 text-xs">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="text-[10px] font-mono bg-[#07090e] border border-white/[0.1] rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-sky-500/50 cursor-pointer"
                        >
                          {STATUS_COLUMNS.map((c) => (
                            <option key={c.id} value={c.id} className="bg-[#0b0f19] text-zinc-200">
                              → {c.label}
                            </option>
                          ))}
                        </select>

                        <Link href={`/applications/${app.id}`}>
                          <span className="text-xs font-mono text-sky-400 hover:text-sky-300 inline-flex items-center gap-1">
                            Studio <ArrowRight className="h-3 w-3" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
