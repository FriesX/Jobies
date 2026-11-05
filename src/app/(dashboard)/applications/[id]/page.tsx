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
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Textarea, Badge } from '@/components/ui';
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-medium">Application not found.</p>
        <Link href="/applications">
          <Button size="sm">Back to Tracker</Button>
        </Link>
      </Card>
    );
  }

  const tailoredCv: TailoredCvData | null = application.tailoredCvJson || null;
  const reviewerFeedback: ReviewFeedback | null = application.reviewerFeedback || null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{application.job.title}</h1>
            <Badge variant="secondary" className="text-xs">
              Stage: {application.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="font-semibold text-foreground">{application.job.company}</span>
            {application.job.location && <span>• {application.job.location}</span>}
            <span>• Created {formatDate(application.createdAt)}</span>
          </p>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleGenerateDocuments}
            disabled={generating}
            className="gap-2 shadow-md shadow-primary/20"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Tailoring with Facts...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {tailoredCv ? 'Regenerate Documents' : 'Tailor CV & Cover Letter'}
              </>
            )}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-border gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('CV')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'CV'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" /> Tailored CV (PDF)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('COVER_LETTER')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'COVER_LETTER'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Copy className="h-4 w-4" /> Cover Letter (Markdown)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REVIEWER')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'REVIEWER'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> AI Fact-Check Reviewer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('INTERVIEW')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'INTERVIEW'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Interview Prep Hub
        </button>
      </div>

      {/* TAB 1: TAILORED CV (PDF) */}
      {activeTab === 'CV' && (
        <div className="space-y-4">
          {!tailoredCv ? (
            <Card className="p-10 text-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-semibold">No Tailored CV Generated Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Generate an ATS-compliant, tailored CV specifically crafted for this {application.job.title} role based purely on your proven experience.
              </p>
              <Button onClick={handleGenerateDocuments} disabled={generating} size="sm" className="mt-2">
                Generate Tailored CV Now
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* PDF Download bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-secondary/40">
                <div>
                  <span className="font-semibold text-xs text-foreground block">
                    ATS-Compliant Document Ready
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Grounded with proven facts. Formatted with @react-pdf/renderer.
                  </span>
                </div>
                <a href={`/api/applications/${id}/pdf`} target="_blank" rel="noreferrer">
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <Download className="h-4 w-4" /> Download ATS CV (PDF)
                  </Button>
                </a>
              </div>

              {/* Live Structured Document Preview */}
              <Card className="p-8 space-y-6 bg-card border-border shadow-sm max-w-3xl mx-auto font-sans">
                {/* Header */}
                <div className="border-b border-primary/40 pb-4 space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                    {tailoredCv.fullName}
                  </h2>
                  <p className="text-sm font-semibold text-primary">{tailoredCv.headline}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                    {tailoredCv.contact.email && <span>✉ {tailoredCv.contact.email}</span>}
                    {tailoredCv.contact.phone && <span>☎ {tailoredCv.contact.phone}</span>}
                    {tailoredCv.contact.location && <span>📍 {tailoredCv.contact.location}</span>}
                    {tailoredCv.contact.linkedin && <span>in: {tailoredCv.contact.linkedin}</span>}
                  </div>
                </div>

                {/* Professional Summary */}
                {tailoredCv.professionalSummary && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/80 pb-1">
                      Professional Summary
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-justify">
                      {tailoredCv.professionalSummary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {tailoredCv.skills && tailoredCv.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/80 pb-1">
                      Skills & Technical Proficiencies
                    </h3>
                    <div className="space-y-1 text-xs">
                      {tailoredCv.skills.map((cat, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="font-semibold text-foreground shrink-0 w-36">
                            {cat.category}:
                          </span>
                          <span className="text-muted-foreground">{cat.items.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {tailoredCv.experiences && tailoredCv.experiences.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/80 pb-1">
                      Work Experience (Tailored Achievements)
                    </h3>
                    {tailoredCv.experiences.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            {exp.role} <span className="font-normal text-muted-foreground">|</span>{' '}
                            <span className="text-primary">{exp.company}</span>
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {exp.startDate} – {exp.endDate}
                          </span>
                        </div>
                        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/80 pb-1">
                      Education
                    </h3>
                    {tailoredCv.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          <strong className="text-foreground">{edu.degree}</strong> in {edu.field},{' '}
                          {edu.institution}
                        </span>
                        <span>{edu.gradYear}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COVER LETTER (MARKDOWN) */}
      {activeTab === 'COVER_LETTER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Tailored Cover Letter (Full-text Markdown)</h3>
              <p className="text-xs text-muted-foreground">
                Edit directly in markdown or copy to clipboard for your job portal submission.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCoverLetter}
                disabled={!coverLetterText}
                className="gap-1.5"
              >
                {copiedCoverLetter ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCoverLetter ? 'Copied!' : 'Copy to Clipboard'}
              </Button>

              <Button
                size="sm"
                onClick={handleSaveNotesAndCoverLetter}
                disabled={savingNotes}
                className="gap-1.5"
              >
                {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Markdown Source Editor */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Markdown Editor
              </span>
              <Textarea
                rows={18}
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder="Generate or write your markdown cover letter here..."
                className="font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Live Markdown Preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Live Preview
              </span>
              <div className="p-5 rounded-lg border border-border bg-card min-h-[380px] max-h-[460px] overflow-y-auto text-xs leading-relaxed text-foreground prose dark:prose-invert">
                {coverLetterText ? (
                  <ReactMarkdown>{coverLetterText}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">
                    Click &quot;Tailor CV &amp; Cover Letter&quot; above to generate your tailored cover letter.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DUAL-PASS AI REVIEWER */}
      {activeTab === 'REVIEWER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Dual-Pass Fact Checker & ATS Readability</h3>
              <p className="text-xs text-muted-foreground">
                A second independent AI pass cross-checks the tailored application against your original source CV to prevent unsupported claims and hallucinations.
              </p>
            </div>

            <Button
              onClick={handleRunReviewer}
              disabled={reviewing || !tailoredCv}
              size="sm"
              className="gap-1.5"
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
            <Card className="p-8 text-center space-y-2">
              <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Fact-check review not run yet</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Run the audit to verify that no fabricated metrics, false certifications, or inaccurate job titles exist in the tailored resume.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* ATS & Claims summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Estimated ATS Match</span>
                  <div className="text-2xl font-bold text-primary">
                    {reviewerFeedback.atsScoreEstimate}%
                  </div>
                </Card>

                <Card className="p-4 space-y-1 md:col-span-2">
                  <span className="text-xs text-muted-foreground">Tone & Professional Impression</span>
                  <p className="text-xs text-foreground font-medium">{reviewerFeedback.toneFeedback}</p>
                </Card>
              </div>

              {/* Unsupported Claims Alert */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase tracking-wider font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Unsupported Claims & Hallucination Checks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {reviewerFeedback.unsupportedClaims && reviewerFeedback.unsupportedClaims.length > 0 ? (
                    reviewerFeedback.unsupportedClaims.map((claim, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs space-y-1">
                        <span className="font-semibold text-destructive block">Claim: &quot;{claim.claim}&quot;</span>
                        <p className="text-muted-foreground">Reason: {claim.reason}</p>
                        <p className="text-emerald-500 font-medium">Suggested Fix: {claim.suggestedFix}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Zero unsupported claims detected. All bullet points are faithfully grounded in your source CV!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strengths & Improvement Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <Card className="p-4 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-emerald-500 block">
                    Document Strengths
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {reviewerFeedback.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-4 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-amber-500 block">
                    Suggested Improvements
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {reviewerFeedback.improvementSuggestions?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INTERVIEW PREP */}
      {activeTab === 'INTERVIEW' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Interview Strategy & Questions Pack</h3>
              <p className="text-xs text-muted-foreground">
                Prepare for technical and behavioral rounds tailored specifically to this role.
              </p>
            </div>

            <Link href={`/interview/${id}`}>
              <Button size="sm" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> Launch Interactive Mock Interview Chat
              </Button>
            </Link>
          </div>

          <Card className="p-6 text-center space-y-3">
            <MessageSquare className="h-8 w-8 text-primary mx-auto" />
            <h4 className="text-base font-semibold">Practice with the AI Interview Coach</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Simulate real-time interview scenarios. The AI asks questions based on this job specification, evaluates your STAR responses, and gives constructive feedback.
            </p>
            <Link href={`/interview/${id}`}>
              <Button className="mt-2">Open Mock Interview Room</Button>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
