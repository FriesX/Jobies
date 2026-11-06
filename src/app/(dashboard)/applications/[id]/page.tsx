'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Terminal,
} from 'lucide-react';
import { Button, Card, Badge, Textarea } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { TailoredCvData, ReviewFeedback } from '@/lib/gemini';

export default function ApplicationWorkspacePage() {
  const params = useParams();
  const id = params?.id as string;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CV' | 'COVER_LETTER' | 'REVIEWER' | 'INTERVIEW'>('CV');

  // Generation states
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (data.application) {
        setApplication(data.application);
        setCoverLetterText(data.application.coverLetterMarkdown || '');
        setNotesText(data.application.notes || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplication();
  }, [id]);

  const handleGenerateDocuments = async () => {
    setGenerating(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/applications/${id}/generate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchApplication();
      } else {
        setErrorMsg(data.error || 'Failed to generate tailored documents.');
      }
    } catch {
      setErrorMsg('Network error while generating application documents.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRunReviewer = async () => {
    setReviewing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/applications/${id}/review`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchApplication();
      } else {
        setErrorMsg(data.error || 'Reviewer fact check failed.');
      }
    } catch {
      setErrorMsg('Network error while running reviewer.');
    } finally {
      setReviewing(false);
    }
  };

  const handleSaveNotesAndCoverLetter = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetterMarkdown: coverLetterText,
          notes: notesText,
        }),
      });
      await fetchApplication();
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCopyCoverLetter = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <span className="text-xs font-mono text-zinc-400">Loading Application Studio...</span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-12 text-center space-y-4 max-w-lg mx-auto mt-12">
        <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-semibold text-white">Application Not Found</h3>
        <p className="text-xs text-zinc-400">
          The requested application workspace could not be retrieved or has been removed.
        </p>
        <Link href="/applications" className="inline-block pt-2">
          <Button variant="glow" size="sm">Back to Pipeline Tracker</Button>
        </Link>
      </div>
    );
  }

  const tailoredCv: TailoredCvData | null = application.tailoredCvJson || null;
  const reviewerFeedback: ReviewFeedback | null = application.reviewerFeedback || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Studio Header Bar */}
      <div className="rounded-xl border border-white/[0.08] bg-gradient-to-r from-[#0c101d] via-[#0e1424] to-[#0a0d16] p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                Application Studio
              </span>
              <span className="text-zinc-600">•</span>
              <Badge
                variant={
                  application.status === 'OFFER'
                    ? 'success'
                    : application.status === 'INTERVIEW'
                    ? 'warning'
                    : 'secondary'
                }
                className="text-[10px] font-mono uppercase px-2 py-0 h-4"
              >
                {application.status}
              </Badge>
              {application.job.sourceUrl && (
                <a
                  href={application.job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-sky-400 transition-colors inline-flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Job Posting</span>
                </a>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white truncate">
              {application.job.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
              <span className="font-medium text-zinc-200 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                {application.job.company}
              </span>
              {application.job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  {application.job.location}
                </span>
              )}
              <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Created {formatDate(application.createdAt)}
              </span>
            </div>
          </div>

          {/* Header Action Cluster */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {tailoredCv && (
              <a href={`/api/applications/${id}/pdf`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-2 h-9 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </Button>
              </a>
            )}

            <Button
              onClick={handleGenerateDocuments}
              disabled={generating}
              variant="glow"
              size="sm"
              className="gap-2 h-9 text-xs"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Grounding Facts with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {tailoredCv ? 'Regenerate Documents' : 'Tailor CV & Cover Letter'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 font-mono">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* High-Precision Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('CV')}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'CV'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Tailored CV (ATS PDF)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COVER_LETTER')}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'COVER_LETTER'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Cover Letter (Markdown)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REVIEWER')}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'REVIEWER'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>AI Fact-Check Reviewer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INTERVIEW')}
          className={`flex items-center gap-2 py-2 px-3.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'INTERVIEW'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Interview Prep Hub</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: TAILORED CV (SPLIT-PANE STUDIO)
      ===================================================================== */}
      {activeTab === 'CV' && (
        <div>
          {!tailoredCv ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0b0f19]/40 p-12 text-center space-y-3">
              <FileText className="h-10 w-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">No Tailored CV Generated Yet</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Generate an ATS-compliant, tailored CV specifically crafted for this {application.job.title} role based purely on your proven experience.
              </p>
              <Button
                onClick={handleGenerateDocuments}
                disabled={generating}
                variant="glow"
                size="sm"
                className="mt-2"
              >
                Generate Tailored CV Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Left Control Bar: Meta & Download */}
              <div className="space-y-4 lg:col-span-1">
                <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    Document Telemetry
                  </span>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-zinc-500">Engine</span>
                      <span className="text-sky-400">gemini-3.8-flash</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-zinc-500">Format</span>
                      <span className="text-zinc-300">ATS Single-Col PDF</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-zinc-500">Experiences</span>
                      <span className="text-zinc-300">{tailoredCv.experiences?.length || 0} roles</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-zinc-500">Skills Listed</span>
                      <span className="text-zinc-300">{tailoredCv.skills?.reduce((acc, cat) => acc + cat.items.length, 0) || 0} skills</span>
                    </div>
                  </div>

                  <a href={`/api/applications/${id}/pdf`} target="_blank" rel="noreferrer" className="block pt-2">
                    <Button variant="glow" className="w-full gap-2 text-xs h-9 justify-center bg-emerald-600 hover:bg-emerald-500 text-white">
                      <Download className="h-3.5 w-3.5" /> Download ATS PDF
                    </Button>
                  </a>
                </div>

                {/* Audit quick link */}
                <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-200">Anti-Hallucination Safe</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Every tailored bullet point was cross-verified against your uploaded career documents.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('REVIEWER')}
                    className="text-xs text-sky-400 hover:text-sky-300 font-mono inline-flex items-center gap-1"
                  >
                    View Auditor Report →
                  </button>
                </div>
              </div>

              {/* Right: Crisp ATS Document Canvas */}
              <div className="lg:col-span-3">
                <div className="rounded-xl border border-white/[0.1] bg-[#0e1424]/90 p-8 md:p-10 shadow-2xl space-y-6 max-w-3xl mx-auto font-sans text-zinc-100">
                  {/* CV Header */}
                  <div className="border-b border-sky-500/30 pb-4 space-y-1.5 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
                      {tailoredCv.fullName}
                    </h2>
                    <p className="text-xs font-mono font-semibold text-sky-400">{tailoredCv.headline}</p>
                    <div className="flex flex-wrap justify-center gap-3 text-[11px] text-zinc-400 pt-1 font-mono">
                      {tailoredCv.contact.email && <span>{tailoredCv.contact.email}</span>}
                      {tailoredCv.contact.phone && <span>• {tailoredCv.contact.phone}</span>}
                      {tailoredCv.contact.location && <span>• {tailoredCv.contact.location}</span>}
                      {tailoredCv.contact.linkedin && <span>• {tailoredCv.contact.linkedin}</span>}
                    </div>
                  </div>

                  {/* Professional Summary */}
                  {tailoredCv.professionalSummary && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-sky-400 border-b border-white/[0.08] pb-1">
                        Professional Summary
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed text-justify">
                        {tailoredCv.professionalSummary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {tailoredCv.skills && tailoredCv.skills.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-sky-400 border-b border-white/[0.08] pb-1">
                        Skills &amp; Technical Proficiencies
                      </h3>
                      <div className="space-y-1.5 text-xs">
                        {tailoredCv.skills.map((cat, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="font-semibold text-zinc-200 shrink-0 w-36 font-mono text-[11px]">
                              {cat.category}:
                            </span>
                            <span className="text-zinc-300">{cat.items.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {tailoredCv.experiences && tailoredCv.experiences.length > 0 && (
                    <div className="space-y-3.5">
                      <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-sky-400 border-b border-white/[0.08] pb-1">
                        Work Experience (Targeted Achievements)
                      </h3>
                      {tailoredCv.experiences.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-baseline justify-between text-xs flex-wrap gap-1">
                            <span className="font-semibold text-white">
                              {exp.role} <span className="font-normal text-zinc-500">|</span>{' '}
                              <span className="text-sky-300">{exp.company}</span>
                            </span>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {exp.startDate} – {exp.endDate}
                            </span>
                          </div>
                          <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1 leading-relaxed">
                            {exp.bulletPoints.map((pt, pIdx) => (
                              <li key={pIdx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {tailoredCv.education && tailoredCv.education.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-sky-400 border-b border-white/[0.08] pb-1">
                        Education
                      </h3>
                      {tailoredCv.education.map((edu, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-zinc-300">
                          <span>
                            <strong className="text-white">{edu.degree}</strong> in {edu.field},{' '}
                            {edu.institution}
                          </span>
                          <span className="font-mono text-zinc-500">{edu.gradYear}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: COVER LETTER (MARKDOWN DUAL-PANE EDITOR)
      ===================================================================== */}
      {activeTab === 'COVER_LETTER' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c101d]">
            <div>
              <h3 className="text-sm font-semibold text-white">Tailored Cover Letter (Full-text Markdown)</h3>
              <p className="text-xs text-zinc-400">
                Edit directly in markdown or copy to clipboard for your job application submission.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCoverLetter}
                disabled={!coverLetterText}
                className="gap-1.5 h-8 text-xs border-white/[0.1] bg-white/[0.02]"
              >
                {copiedCoverLetter ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedCoverLetter ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
              </Button>

              <Button
                variant="glow"
                size="sm"
                onClick={handleSaveNotesAndCoverLetter}
                disabled={savingNotes}
                className="gap-1.5 h-8 text-xs"
              >
                {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Changes</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Markdown Source Editor */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                Source Markdown Editor
              </span>
              <Textarea
                rows={18}
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder="Click 'Tailor CV & Cover Letter' above to generate your tailored cover letter..."
                className="font-mono text-xs leading-relaxed border-white/[0.08] bg-[#0b0f19] text-zinc-200 focus:border-sky-500/50"
              />
            </div>

            {/* Live Markdown Preview */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                Rendered Preview
              </span>
              <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0c101d] min-h-[380px] max-h-[460px] overflow-y-auto text-xs leading-relaxed text-zinc-200 prose prose-invert prose-p:my-2 prose-headings:text-sky-400">
                {coverLetterText ? (
                  <ReactMarkdown>{coverLetterText}</ReactMarkdown>
                ) : (
                  <p className="text-zinc-500 italic">
                    Click &quot;Tailor CV &amp; Cover Letter&quot; above to generate your tailored cover letter.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: DUAL-PASS AI REVIEWER (ANTI-HALLUCINATION AUDITOR)
      ===================================================================== */}
      {activeTab === 'REVIEWER' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c101d]">
            <div>
              <h3 className="text-sm font-semibold text-white">Dual-Pass Fact Checker &amp; ATS Audit</h3>
              <p className="text-xs text-zinc-400">
                An independent second Gemini AI pass audits tailored documents against your source CV to prevent false claims.
              </p>
            </div>

            <Button
              onClick={handleRunReviewer}
              disabled={reviewing || !tailoredCv}
              variant="glow"
              size="sm"
              className="gap-2 h-8 text-xs shrink-0"
            >
              {reviewing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Auditing Claims...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> Run Fact-Check Review
                </>
              )}
            </Button>
          </div>

          {!reviewerFeedback ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0b0f19]/40 p-10 text-center space-y-2">
              <ShieldAlert className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-300">Fact-Check Review Not Run Yet</p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Trigger the reviewer to inspect every sentence for unsupported metrics, exaggerated responsibilities, or unverified tools.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ATS Score & Tone Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Estimated ATS Match
                  </span>
                  <div className="text-3xl font-bold font-mono text-sky-400">
                    {reviewerFeedback.atsScoreEstimate}%
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-1 md:col-span-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Tone &amp; Professional Impression
                  </span>
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                    {reviewerFeedback.toneFeedback}
                  </p>
                </div>
              </div>

              {/* Unsupported Claims Alert Card */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-200">
                    Unsupported Claims &amp; Grounding Verification
                  </span>
                </div>

                {reviewerFeedback.unsupportedClaims && reviewerFeedback.unsupportedClaims.length > 0 ? (
                  <div className="space-y-2">
                    {reviewerFeedback.unsupportedClaims.map((claim, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5"
                      >
                        <span className="font-semibold text-rose-400 block">
                          Claim: &quot;{claim.claim}&quot;
                        </span>
                        <p className="text-zinc-400">Reason: {claim.reason}</p>
                        <p className="text-emerald-400 font-medium">Suggested Fix: {claim.suggestedFix}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Zero unsupported claims detected! All bullet points are grounded in your source CV facts.</span>
                  </div>
                )}
              </div>

              {/* Strengths & Improvement Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-2">
                  <span className="font-mono uppercase text-[11px] tracking-wider text-emerald-400 font-semibold block">
                    Document Strengths
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                    {reviewerFeedback.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-4 space-y-2">
                  <span className="font-mono uppercase text-[11px] tracking-wider text-amber-400 font-semibold block">
                    Actionable Improvements
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                    {reviewerFeedback.improvementSuggestions?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: INTERVIEW PREP HUB
      ===================================================================== */}
      {activeTab === 'INTERVIEW' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c101d]">
            <div>
              <h3 className="text-sm font-semibold text-white">Interview Strategy &amp; Practice Room</h3>
              <p className="text-xs text-zinc-400">
                Technical, behavioral, and STAR methodology questions prepared for this role.
              </p>
            </div>

            <Link href={`/interview/${id}`}>
              <Button variant="glow" size="sm" className="gap-2 h-8 text-xs">
                <Terminal className="h-3.5 w-3.5" /> Launch Interactive Interview
              </Button>
            </Link>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0b0f19] p-8 text-center space-y-3 max-w-xl mx-auto">
            <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <Terminal className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-white">Simulate Live Technical Round</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Experience dynamic AI interrogation customized for this {application.job.title} role. Gemini will evaluate your STAR answers in real-time, test your technical depth, and grade your responses.
            </p>
            <div className="pt-2">
              <Link href={`/interview/${id}`}>
                <Button variant="glow" size="sm" className="gap-2 text-xs">
                  Enter Mock Room →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
