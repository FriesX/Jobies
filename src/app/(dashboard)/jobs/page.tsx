'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  PlusCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  sourceUrl: string | null;
  integrityStatus: string;
  createdAt: string;
  analyses: Array<{
    outputJson: {
      score?: number;
      recommendation?: string;
    };
  }>;
  applications: Array<{ id: string; status: string }>;
}

export default function JobsListPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(query.toLowerCase()) ||
      j.company.toLowerCase().includes(query.toLowerCase()) ||
      (j.location && j.location.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Opportunities & Ingested Postings</h1>
          <p className="text-sm text-muted-foreground">
            Explore your ingested jobs, inspect posting safety reports, and trigger Gemini fit evaluations.
          </p>
        </div>

        <Link href="/jobs/new">
          <Button className="gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" /> Ingest New Job
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
        <Input
          placeholder="Search by role title, company, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No jobs found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {query ? 'No opportunities match your search query.' : 'You haven’t ingested any job postings yet.'}
          </p>
          {!query && (
            <Link href="/jobs/new">
              <Button size="sm" className="mt-2">
                Ingest Your First Job
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const fitAnalysis = job.analyses[0]?.outputJson;
            const score = fitAnalysis?.score;
            const recommendation = fitAnalysis?.recommendation;
            const app = job.applications[0];

            return (
              <Card key={job.id} className="p-5 hover:border-primary/50 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-base text-foreground truncate">{job.title}</h2>
                      {job.integrityStatus === 'SAFE' ? (
                        <Badge variant="success" className="text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" /> Safe
                        </Badge>
                      ) : job.integrityStatus === 'FLAGGED' ? (
                        <Badge variant="warning" className="text-[10px] gap-1">
                          <AlertTriangle className="h-3 w-3" /> Flagged
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">Rejected</Badge>
                      )}

                      {app && (
                        <Badge variant="secondary" className="text-[10px]">
                          Pipeline: {app.status}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground">{job.company}</span>
                      {job.location && <span>• {job.location}</span>}
                      <span>• Added {formatDate(job.createdAt)}</span>
                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-0.5"
                        >
                          Source <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Score pill */}
                    {score !== undefined ? (
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className={`text-xl font-bold ${score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-slate-500'}`}>
                            {score}%
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          {recommendation || 'Fit Score'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Not evaluated</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          Evaluation <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      {app ? (
                        <Link href={`/applications/${app.id}`}>
                          <Button size="sm">Workspace</Button>
                        </Link>
                      ) : (
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm">Evaluate</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
