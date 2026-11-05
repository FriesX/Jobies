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
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

const STATUS_COLUMNS = [
  { id: 'SAVED', label: 'Saved', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  { id: 'SCREENING', label: 'Screening', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'APPLIED', label: 'Applied', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  { id: 'INTERVIEW', label: 'Interview', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'OFFER', label: 'Offer', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { id: 'CLOSED', label: 'Closed', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
];

export default function ApplicationsKanbanPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          spread: 70,
          origin: { y: 0.6 },
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Application Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Visualize your career pipeline. Move applications through hiring stages and keep tailored resumes organized.
          </p>
        </div>
        <Link href="/jobs">
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" /> Browse Jobs & Apply
          </Button>
        </Link>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 items-start min-h-[600px]">
        {STATUS_COLUMNS.map((col) => {
          const colApps = applications.filter((app) => app.status === col.id);

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 flex flex-col rounded-xl border border-border bg-card/60 backdrop-blur-sm max-h-[80vh]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border flex items-center justify-between bg-secondary/30 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.id === 'OFFER' ? 'bg-emerald-500' : col.id === 'INTERVIEW' ? 'bg-amber-500' : 'bg-primary'}`} />
                  <span className="font-semibold text-xs tracking-tight text-foreground">
                    {col.label}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold">
                  {colApps.length}
                </Badge>
              </div>

              {/* Column Cards */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                {colApps.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-muted-foreground border border-dashed rounded-lg border-border/60">
                    No applications
                  </div>
                ) : (
                  colApps.map((app) => (
                    <Card
                      key={app.id}
                      className="p-3.5 space-y-2.5 hover:shadow-md hover:border-primary/50 transition-all bg-card"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-xs text-foreground line-clamp-1">
                          {app.job.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                          {app.job.company}
                        </p>
                      </div>

                      {app.followUpDate && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                          <Calendar className="h-3 w-3" />
                          <span>Follow-up: {formatDate(app.followUpDate)}</span>
                        </div>
                      )}

                      {/* Status Selector Dropdown & Workspace CTA */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="text-[10px] bg-secondary border border-border rounded px-1.5 py-1 text-foreground focus:outline-none"
                        >
                          {STATUS_COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              → {c.label}
                            </option>
                          ))}
                        </select>

                        <Link href={`/applications/${app.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary font-medium gap-1">
                            Studio <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
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
