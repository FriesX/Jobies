'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link2,
  ClipboardList,
  FileEdit,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea, Badge } from '@/components/ui';

export default function NewJobPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'URL' | 'PASTE' | 'MANUAL'>('URL');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [rawText, setRawText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload: Record<string, string> = {
        title,
        company,
        location,
      };

      if (tab === 'URL') {
        if (!url.trim()) {
          setErrorMsg('Please enter a valid job posting URL.');
          setLoading(false);
          return;
        }
        payload.url = url.trim();
      } else {
        if (!rawText.trim()) {
          setErrorMsg('Please paste the job description text.');
          setLoading(false);
          return;
        }
        payload.rawText = rawText.trim();
      }

      const res = await fetch('/api/jobs/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to ingest job posting.');
      } else {
        router.push(`/jobs/${data.job.id}`);
      }
    } catch {
      setErrorMsg('Network error while processing job intake.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ingest Job Opportunity</h1>
        <p className="text-sm text-muted-foreground">
          Import job postings from anywhere. Every posting passes through the Deterministic Safety Gate to block prompt injection and hidden malicious instructions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setTab('URL')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${
            tab === 'URL'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link2 className="h-4 w-4" /> Fetch from URL
        </button>
        <button
          type="button"
          onClick={() => setTab('PASTE')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${
            tab === 'PASTE'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="h-4 w-4" /> Paste Description
        </button>
        <button
          type="button"
          onClick={() => setTab('MANUAL')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${
            tab === 'MANUAL'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileEdit className="h-4 w-4" /> Manual Form
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {tab === 'URL' && 'Fetch Job Posting URL'}
              {tab === 'PASTE' && 'Paste Full Job Description'}
              {tab === 'MANUAL' && 'Structured Job Details'}
            </CardTitle>
            <CardDescription>
              {tab === 'URL' && 'Enter the public link (LinkedIn, Glints, Jobstreet, company careers page). Our SSRF Shield blocks local/internal IPs.'}
              {tab === 'PASTE' && 'Copy and paste the full job description text directly from the recruiter email or job board.'}
              {tab === 'MANUAL' && 'Fill out company, title, location, and key requirements manually.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tab === 'URL' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Job Posting URL</label>
                <Input
                  type="url"
                  placeholder="https://www.linkedin.com/jobs/view/... or https://careers.company.com/job/123"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Job Title {tab === 'URL' && <span className="text-muted-foreground font-normal">(Optional, auto-extracted)</span>}
                </label>
                <Input
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={tab !== 'URL'}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Company {tab === 'URL' && <span className="text-muted-foreground font-normal">(Optional, auto-extracted)</span>}
                </label>
                <Input
                  placeholder="e.g. GoTo, Traveloka, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required={tab !== 'URL'}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Location & Arrangement</label>
              <Input
                placeholder="e.g. Jakarta, Indonesia (Hybrid / Remote)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {tab !== 'URL' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Job Description & Requirements</label>
                <Textarea
                  rows={9}
                  placeholder="Paste the full job posting text here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  required
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safety Gate Info notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-border/80 bg-secondary/40 text-xs text-muted-foreground">
          <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-foreground block">Deterministic Safety Gate Guarantee</span>
            <p>
              Per PRD Section 5.4, all untrusted external job postings are stripped of hidden HTML, analyzed for zero-width Unicode injection characters, and scanned for prompt override patterns before reaching Gemini.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="gap-2 px-6">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Ingesting & Inspecting...
              </>
            ) : (
              <>
                Ingest & Inspect Job <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
