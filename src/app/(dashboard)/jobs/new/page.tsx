'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Link2,
  ClipboardList,
  FileEdit,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Search,
  Zap,
  Globe,
  Building2,
  ExternalLink,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Button, Card, Input, Textarea, Badge } from '@/components/ui';

type PortalOption = 'LINKEDIN' | 'GLINTS' | 'JOBSTREET' | 'INDEED';

export default function NewJobPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'QUICK_SEARCH' | 'URL' | 'PASTE' | 'MANUAL'>('QUICK_SEARCH');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Quick Portal Search states (Baseline)
  const [selectedPortal, setSelectedPortal] = useState<PortalOption>('LINKEDIN');
  const [keyword, setKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('Indonesia');

  // Direct URL / Company Site states
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [rawText, setRawText] = useState('');

  // Generate URL helper for each portal
  const constructPortalUrl = (portal: PortalOption, kw: string, loc: string): string => {
    const cleanKw = kw.trim();
    const cleanLoc = (loc || 'Indonesia').trim();

    switch (portal) {
      case 'GLINTS':
        return `https://glints.com/id/opportunities/jobs/explore?keyword=${encodeURIComponent(
          cleanKw
        )}&country=ID`;
      case 'JOBSTREET':
        return `https://id.jobstreet.com/id/jobs?keywords=${encodeURIComponent(
          cleanKw
        )}${cleanLoc ? '&where=' + encodeURIComponent(cleanLoc) : ''}`;
      case 'INDEED':
        return `https://id.indeed.com/jobs?q=${encodeURIComponent(
          cleanKw
        )}&l=${encodeURIComponent(cleanLoc)}`;
      case 'LINKEDIN':
      default:
        return `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(
          cleanKw
        )}&location=${encodeURIComponent(cleanLoc)}`;
    }
  };

  const executeIngest = async (payload: Record<string, string>) => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Memulai inspeksi web dan ekstraksi lowongan...');

    try {
      const res = await fetch('/api/jobs/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, autoAnalyze: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mengekstrak atau menyimpan lowongan kerja.');
      } else {
        setStatusMsg(`Berhasil mengekstrak ${data.count || 1} lowongan! Mengalihkan ke tabel tracker...`);
        setTimeout(() => {
          router.push('/jobs');
          router.refresh();
        }, 800);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat memproses intake lowongan.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPortalSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) {
      setErrorMsg('Silakan masukkan posisi atau kata kunci pekerjaan yang dicari.');
      return;
    }

    const searchUrl = constructPortalUrl(selectedPortal, keyword, searchLocation);
    executeIngest({ url: searchUrl });
  };

  const handleDirectUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim().toLowerCase();

    // Check pure homepages without search query
    const forbiddenHomepages = [
      'www.linkedin.com',
      'linkedin.com',
      'https://www.linkedin.com',
      'https://linkedin.com',
      'https://www.linkedin.com/jobs',
      'https://www.linkedin.com/jobs/',
      'glints.com',
      'www.glints.com',
      'https://glints.com',
      'jobstreet.co.id',
      'id.jobstreet.com',
      'https://id.jobstreet.com',
      'indeed.com',
      'id.indeed.com',
    ];

    if (forbiddenHomepages.includes(cleanUrl)) {
      setErrorMsg(
        'URL yang Anda masukkan adalah beranda portal umum. Gunakan tab "Pencarian Cepat Multi-Portal" di sebelah kiri, atau masukkan link lowongan spesifik / halaman karir perusahaan.'
      );
      return;
    }

    if (!url.trim()) {
      setErrorMsg('Silakan masukkan link URL lowongan kerja atau portal karir.');
      return;
    }

    await executeIngest({ url: url.trim(), title, company, location });
  };

  const handleManualOrPasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setErrorMsg('Silakan isi teks deskripsi atau persyaratan pekerjaan.');
      return;
    }
    await executeIngest({ rawText: rawText.trim(), title, company, location });
  };

  const PORTAL_CONFIG = [
    {
      id: 'LINKEDIN' as PortalOption,
      name: 'LinkedIn Jobs',
      domain: 'linkedin.com',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      activeColor: 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 shadow-md',
      desc: 'Paling optimal untuk tech, profesional, dan lowongan remote/internasional.',
    },
    {
      id: 'GLINTS' as PortalOption,
      name: 'Glints Indonesia',
      domain: 'glints.com',
      color: 'border-red-500/40 text-red-400 bg-red-500/10',
      activeColor: 'bg-red-600 text-white border-red-500 shadow-red-500/20 shadow-md',
      desc: 'Sangat cocok untuk loker startup, tech industry, & fresh graduate Asia Tenggara.',
    },
    {
      id: 'JOBSTREET' as PortalOption,
      name: 'JobStreet',
      domain: 'id.jobstreet.com',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      activeColor: 'bg-amber-600 text-white border-amber-500 shadow-amber-500/20 shadow-md',
      desc: 'Portal loker terbesar di Indonesia untuk perusahaan enterprise, BUMN & swasta.',
    },
    {
      id: 'INDEED' as PortalOption,
      name: 'Indeed',
      domain: 'id.indeed.com',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
      activeColor: 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 shadow-md',
      desc: 'Agregator loker global mencakup lowongan multi-industri di seluruh kota.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Precision Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Job Intake Terminal
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-xs font-mono text-zinc-400">Multi-Portal Deep Scraper Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Ingest Job Opportunity</h1>
        <p className="text-xs text-zinc-400">
          Cari dan scraping lowongan kerja dari LinkedIn, Glints, JobStreet, Indeed, atau website karir resmi perusahaan. Sistem mengekstrak tiap lowongan menjadi baris individual lengkap dengan link postingan aslinya.
        </p>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setTab('QUICK_SEARCH');
            setErrorMsg('');
          }}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            tab === 'QUICK_SEARCH'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-sky-400" />
          <span>⚡ Pencarian Cepat Multi-Portal (Baseline)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('URL');
            setErrorMsg('');
          }}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            tab === 'URL'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Web Karir Perusahaan &amp; Direct URL</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('PASTE');
            setErrorMsg('');
          }}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            tab === 'PASTE'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          <span>Paste Raw Text</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('MANUAL');
            setErrorMsg('');
          }}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            tab === 'MANUAL'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <FileEdit className="h-3.5 w-3.5" />
          <span>Manual Form</span>
        </button>
      </div>

      {/* ERROR & STATUS ALERTS */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Pemberitahuan Sistem:</span>
            {errorMsg}
          </div>
        </div>
      )}

      {statusMsg && !errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* TAB 1: QUICK MULTI-PORTAL SEARCH (BASELINE) */}
      {tab === 'QUICK_SEARCH' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#0c1426] via-[#090d19] to-[#07090e] p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-mono uppercase font-bold tracking-wider text-sky-300">
                    Pencarian Cepat Multi-Portal (Hingga 30 Lowongan per Baris)
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Pilih portal kerja target, ketik posisi yang diinginkan, dan sistem akan langsung melakukan live scraping mengekstrak daftar lowongan lengkap dengan link postingan asli!
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.08] shrink-0 self-start sm:self-auto">
                Auto Row Matrix Engine
              </span>
            </div>

            {/* Portal Selection Chips */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                Pilih Portal Pekerjaan Target:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PORTAL_CONFIG.map((p) => {
                  const isSelected = selectedPortal === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPortal(p.id);
                        setErrorMsg('');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? p.activeColor
                          : 'bg-white/[0.02] border-white/[0.08] text-zinc-300 hover:border-white/[0.2] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{p.name}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" />}
                      </div>
                      <span className={`text-[10px] font-mono block ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                        {p.domain}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-400 font-mono italic">
                ℹ️ {PORTAL_CONFIG.find((p) => p.id === selectedPortal)?.desc}
              </p>
            </div>

            {/* Search Input Controls */}
            <form onSubmit={handleQuickPortalSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Posisi Pekerjaan / Kata Kunci
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Frontend Developer, Full Stack, Data Analyst..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/[0.1] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Lokasi / Preferensi
                  </label>
                  <input
                    type="text"
                    placeholder="Indonesia / Jakarta / Remote"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/[0.1] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="submit"
                    disabled={loading || !keyword.trim()}
                    variant="glow"
                    className="w-full h-10 text-xs font-semibold justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Scraping...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 text-white" />
                        <span>Cari &amp; Scrape</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-zinc-400 pt-1">
                <span>Rekomendasi Cepat:</span>
                {[
                  'Frontend Developer',
                  'Full Stack Engineer',
                  'Backend Developer',
                  'DevOps Engineer',
                  'Product Manager',
                  'Data Analyst',
                  'UI/UX Designer',
                  'QA Engineer',
                ].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setKeyword(kw);
                      const generatedUrl = constructPortalUrl(selectedPortal, kw, searchLocation);
                      executeIngest({ url: generatedUrl });
                    }}
                    className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-sky-500/20 hover:text-sky-300 border border-white/[0.08] transition-all cursor-pointer text-[11px]"
                  >
                    +{kw}
                  </button>
                ))}
              </div>

              {/* Target Query Live Preview */}
              {keyword.trim() && (
                <div className="rounded-lg bg-black/40 border border-white/[0.06] p-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="text-sky-400 shrink-0 font-semibold">Live Target URL:</span>
                    <span className="truncate text-zinc-300">
                      {constructPortalUrl(selectedPortal, keyword, searchLocation)}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase shrink-0 ml-2">
                    {PORTAL_CONFIG.find((p) => p.id === selectedPortal)?.name}
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Value Props Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-semibold">
                <Layers className="h-4 w-4" />
                <span>Multi-Row Matrix</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Hingga 25-30 lowongan kerja diekstrak menjadi baris-baris terpisah lengkap dengan link postingan asli untuk memudahkan pelacakan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Deterministic Gate</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Mengecek keamanan teks lowongan dari prompt injection berbahaya atau jebakan data sebelum diproses oleh model AI.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-semibold">
                <Sparkles className="h-4 w-4" />
                <span>AI Fit Evaluation</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Menghitung skor kecocokan persentase (0-100%) terhadap resume CV master Anda dan menghasilkan draft CV yang disesuaikan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY CAREER PORTALS & DIRECT URLS */}
      {tab === 'URL' && (
        <form onSubmit={handleDirectUrlSubmit} className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c101d] p-6 space-y-5 shadow-xl">
            <div className="border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-300">
                  Scraping Menyeluruh &amp; Detail: Portal Karir Perusahaan / ATS
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Masukkan URL halaman karir perusahaan atau link postingan pekerjaan spesifik. Sistem akan mengekstrak detail mendalam (kualifikasi, tanggung jawab, gaji, lokasi, dan link lamaran).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                URL Lowongan Kerja / Halaman Karir Perusahaan *
              </label>
              <input
                type="text"
                placeholder="https://glints.com/id/opportunities/jobs/... atau https://boards.greenhouse.io/... atau careers.shopee.co.id/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-zinc-400 font-mono">
                <span className="text-zinc-500">Mendukung:</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Glints</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">JobStreet</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">LinkedIn</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Greenhouse</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Lever</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Workday</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Ashby</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Judul Posisi <span className="text-zinc-500 text-[10px] lowercase">(opsional, auto-ekstrak)</span>
                </label>
                <input
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Nama Perusahaan <span className="text-zinc-500 text-[10px] lowercase">(opsional, auto-ekstrak)</span>
                </label>
                <input
                  placeholder="e.g. GoTo, Shopee, Traveloka, Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                Lokasi &amp; Kebijakan Kerja <span className="text-zinc-500 text-[10px] lowercase">(opsional, auto-ekstrak)</span>
              </label>
              <input
                placeholder="e.g. Jakarta Selatan / Hybrid / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full h-11 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengekstrak Menyeluruh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Scrape Menyeluruh &amp; Ingest Job</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: PASTE RAW TEXT */}
      {tab === 'PASTE' && (
        <form onSubmit={handleManualOrPasteSubmit} className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c101d] p-6 space-y-4 shadow-xl">
            <div className="border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-sky-300">
                Paste Teks Lowongan Kerja
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Salin dan tempelkan teks kualifikasi atau job description dari email, dokumen, atau portal lowongan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Judul Posisi *
                </label>
                <input
                  placeholder="e.g. Lead Frontend Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Nama Perusahaan *
                </label>
                <input
                  placeholder="e.g. Tokopedia / Gojek"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                Deskripsi Lengkap / Persyaratan *
              </label>
              <textarea
                rows={8}
                placeholder="Paste deskripsi pekerjaan lengkap, requirements, skills, dan tanggung jawab di sini..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#07090e] p-3.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 font-mono leading-relaxed"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !rawText.trim()}
              variant="glow"
              className="w-full h-11 text-xs font-semibold gap-2 shadow-lg cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Simpan &amp; Analisis Kesesuaian</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: MANUAL STRUCTURED FORM */}
      {tab === 'MANUAL' && (
        <form onSubmit={handleManualOrPasteSubmit} className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c101d] p-6 space-y-4 shadow-xl">
            <div className="border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-sky-300">
                Form Entri Manual Terstruktur
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Masukkan rincian posisi pekerjaan secara manual jika tidak memiliki link atau teks lengkap.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Judul Pekerjaan *
                </label>
                <input
                  placeholder="e.g. Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Perusahaan *
                </label>
                <input
                  placeholder="e.g. PT Maju Jaya"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Lokasi
                </label>
                <input
                  placeholder="e.g. Jakarta / Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                Catatan Persyaratan &amp; Kualifikasi *
              </label>
              <textarea
                rows={6}
                placeholder="Rincian persyaratan, pengalaman yang dibutuhkan, dan teknologi yang digunakan..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#07090e] p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 font-mono leading-relaxed"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !title.trim() || !company.trim()}
              variant="glow"
              className="w-full h-11 text-xs font-semibold gap-2 shadow-lg cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Simpan Lowongan Pekerjaan</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
