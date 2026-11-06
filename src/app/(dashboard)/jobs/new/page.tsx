'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Link2,
  ClipboardList,
  FileEdit,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  Cpu,
  Search,
  Zap,
} from 'lucide-react';
import { Button, Card, Input, Textarea, Badge } from '@/components/ui';

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

  // Quick LinkedIn Search Tool state
  const [keyword, setKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('Indonesia');

  const executeIngest = async (payload: Record<string, string>) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/jobs/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, autoAnalyze: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to ingest job posting.');
      } else {
        router.push('/jobs');
        router.refresh();
      }
    } catch {
      setErrorMsg('Network error while processing job intake.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === 'URL') {
      const cleanUrl = url.trim().toLowerCase();
      if (
        cleanUrl === 'www.linkedin.com' ||
        cleanUrl === 'linkedin.com' ||
        cleanUrl === 'https://www.linkedin.com' ||
        cleanUrl === 'https://linkedin.com' ||
        cleanUrl === 'https://www.linkedin.com/jobs' ||
        cleanUrl === 'https://www.linkedin.com/jobs/'
      ) {
        setErrorMsg(
          'URL yang Anda masukkan adalah halaman depan LinkedIn (bukan lowongan spesifik). Gunakan fitur "Cari Lowongan LinkedIn Otomatis" di atas atau masukkan link spesifik seperti linkedin.com/jobs/view/...'
        );
        return;
      }

      if (!url.trim()) {
        setErrorMsg('Silakan masukkan link URL lowongan kerja.');
        return;
      }

      await executeIngest({ url: url.trim(), title, company, location });
    } else {
      if (!rawText.trim()) {
        setErrorMsg('Silakan paste teks deskripsi pekerjaan.');
        return;
      }
      await executeIngest({ rawText: rawText.trim(), title, company, location });
    }
  };

  const handleQuickSearchLinkedIn = (kw: string, loc: string) => {
    const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(
      kw
    )}&location=${encodeURIComponent(loc || 'Indonesia')}`;
    executeIngest({ url: searchUrl });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Precision Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
            Job Intake Terminal
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-xs font-mono text-zinc-400">Deterministic Inspection Protocol</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Ingest Job Opportunity</h1>
        <p className="text-xs text-zinc-400">
          Ekstrak lowongan kerja dari LinkedIn atau portal karir lainnya. Sistem otomatis mengekstrak tiap lowongan per baris lengkap dengan link aslinya.
        </p>
      </div>

      {/* High-Precision Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] pb-1">
        <button
          type="button"
          onClick={() => setTab('URL')}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
            tab === 'URL'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          <span>Fetch from URL / LinkedIn Search</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('PASTE')}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
            tab === 'PASTE'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          <span>Paste Raw Posting</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('MANUAL')}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
            tab === 'MANUAL'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <FileEdit className="h-3.5 w-3.5" />
          <span>Structured Manual Entry</span>
        </button>
      </div>

      {/* QUICK LINKEDIN SEARCH GENERATOR */}
      {tab === 'URL' && (
        <div className="rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-[#0c101d] to-[#0e1424] p-5 space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky-400" />
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-sky-300">
                Pencarian &amp; Scraping Otomatis LinkedIn (Hingga 25 Lowongan per Baris)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              Auto Row Matrix
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Ketik posisi yang ingin dicari (misal: <em>Frontend Developer</em>). Sistem akan otomatis mencari ke LinkedIn dan mengekstrak daftar lowongan menjadi baris-baris terpisah lengkap dengan link postingannya!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="Posisi pekerjaan (contoh: Frontend Engineer)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="Lokasi (contoh: Indonesia / Remote)"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                disabled={loading || !keyword.trim()}
                onClick={() => handleQuickSearchLinkedIn(keyword, searchLocation)}
                variant="glow"
                className="w-full h-9 text-xs justify-center gap-1.5"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Cari &amp; Scrape</span>
              </Button>
            </div>
          </div>

          {/* Quick Click Suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-mono text-zinc-400">
            <span>Contoh cepat:</span>
            {[
              'Frontend Developer',
              'Full Stack Engineer',
              'Backend Developer',
              'Product Manager',
              'Data Analyst',
            ].map((kw) => (
              <button
                key={kw}
                type="button"
                disabled={loading}
                onClick={() => {
                  setKeyword(kw);
                  handleQuickSearchLinkedIn(kw, searchLocation || 'Indonesia');
                }}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-sky-500/20 hover:text-sky-300 border border-white/[0.08] transition-all cursor-pointer"
              >
                +{kw}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Container (2 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-6 space-y-4 shadow-xl">
            {tab === 'URL' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Atau Masukkan URL Lowongan / Link Pencarian Spesifik
                </label>
                <input
                  type="text"
                  placeholder="https://www.linkedin.com/jobs/view/... atau https://www.linkedin.com/jobs/search?keywords=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 font-mono"
                />
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                  Catatan: Masukkan URL lowongan spesifik (`/jobs/view/...`) atau hasil pencarian (`/jobs/search?...`), bukan halaman beranda umum `www.linkedin.com`.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Job Title {tab === 'URL' && <span className="text-zinc-500 text-[10px] lowercase">(opsional, auto-ekstrak)</span>}
                </label>
                <input
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={tab !== 'URL'}
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Company {tab === 'URL' && <span className="text-zinc-500 text-[10px] lowercase">(opsional, auto-ekstrak)</span>}
                </label>
                <input
                  placeholder="e.g. Google, Stripe, GoTo"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required={tab !== 'URL'}
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                Location &amp; Work Policy
              </label>
              <input
                placeholder="e.g. Jakarta, Indonesia (Hybrid / Remote)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            {tab !== 'URL' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Job Description &amp; Technical Requirements
                </label>
                <textarea
                  rows={9}
                  placeholder="Paste the full job posting text here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-[#07090e] p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 font-mono leading-relaxed"
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={loading} variant="glow" className="gap-2 h-9 text-xs px-5">
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ingesting &amp; Inspecting...
                  </>
                ) : (
                  <>
                    Ingest &amp; Inspect Job <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Safety Gate Information Sidebar */}
        <div className="space-y-3.5">
          <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                Deterministic Gate Checks
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Semua link postingan di-scrape dengan isolasi ketat terhadap IP lokal, script tersembunyi, dan instruksi penipuan:
            </p>

            <div className="space-y-2 pt-1 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Ekstraksi Link Lowongan Asli</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Multi-Job Card Detection (up to 25)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Zero-width Unicode removal</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>SSRF Loopback &amp; LAN blocks</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-4 text-xs font-mono text-zinc-500 space-y-1">
            <span className="text-zinc-400 block font-semibold text-[11px]">AI Model Assigned</span>
            <p className="text-sky-400">gemini-3.8-flash (with auto-fallback)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
