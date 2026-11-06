'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
  Shield,
  Copy,
  Check,
  HardDrive,
  Calendar,
  Lock,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { formatBytes, formatDate } from '@/lib/utils';

interface DocumentItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  documentType: string;
  processingStatus: string;
  createdAt: string;
  extractedText: string | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [docType, setDocType] = useState('CV');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        await fetchDocuments();
      } else {
        setErrorMsg(data.error || 'Failed to upload document.');
      }
    } catch {
      setErrorMsg('Network error while uploading file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently remove this document from your private vault?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments(documents.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch {
      alert('Failed to delete document.');
    }
  };

  const handleCopyExtracted = () => {
    if (!selectedDoc?.extractedText) return;
    navigator.clipboard.writeText(selectedDoc.extractedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Precision Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
            Security Tier 1
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-xs font-mono text-zinc-400">Isolated Cloud Vault</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Private Document Vault</h1>
        <p className="text-xs text-zinc-400">
          Encrypted, isolated repository for your career sources (PDF, DOCX, TXT). Text is server-extracted to ground all Gemini evaluations.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0c101d]/70 hover:border-sky-500/40 transition-all p-8 text-center space-y-4 shadow-xl">
        <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">Upload Career Document</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Drag and drop your resume or portfolio. Accepts PDF, Word (.docx), and plain text up to 10MB.
          </p>
        </div>

        {/* Doc Type Selector Chips */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs font-mono text-zinc-400">Type:</span>
          {['CV', 'PORTFOLIO', 'CERTIFICATE'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDocType(t)}
              className={`text-xs px-3 py-1 rounded-md font-mono uppercase transition-all ${
                docType === t
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            variant="glow"
            size="sm"
            className="gap-2 h-9 text-xs px-6"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ingesting &amp; Extracting Facts...
              </>
            ) : (
              <>
                <HardDrive className="h-3.5 w-3.5" /> Select Local File
              </>
            )}
          </Button>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 flex items-center justify-center gap-1.5 font-mono">
            <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
          </p>
        )}
      </div>

      {/* Stored Documents List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-300 font-mono">
              Vault Contents
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              {documents.length} files
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <Lock className="h-3 w-3" /> End-to-End Isolated
          </span>
        </div>

        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#0c101d]/40 p-8 text-center text-zinc-500 text-xs font-mono">
            Vault is empty. Upload your master resume above to power AI fit scoring.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group rounded-xl border border-white/[0.07] bg-[#0c101d] hover:bg-[#0f1526] hover:border-sky-500/30 p-4 space-y-3 transition-all hover-lift shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="font-semibold text-xs text-zinc-100 truncate group-hover:text-sky-300 transition-colors"
                        title={doc.originalFilename}
                      >
                        {doc.originalFilename}
                      </h4>
                      <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        {formatBytes(doc.sizeBytes)} • {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={doc.documentType === 'CV' ? 'default' : 'secondary'}
                    className="text-[10px] font-mono uppercase px-2 py-0 h-4"
                  >
                    {doc.documentType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs">
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Grounded Text Active
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDoc(doc)}
                      className="h-7 text-xs px-2.5 gap-1 border-white/[0.08] bg-white/[0.02]"
                    >
                      <Eye className="h-3 w-3" /> Inspect
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="h-7 text-xs px-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete document"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extracted Text Modal / Inspection Drawer */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-white/[0.1] bg-[#0c101d] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#0f1526]">
              <div className="min-w-0 pr-3">
                <h3 className="text-sm font-semibold text-white truncate">{selectedDoc.originalFilename}</h3>
                <span className="text-[11px] font-mono text-zinc-400">
                  Extracted Raw Text (Gemini Context Grounding)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyExtracted}
                  className="h-7 text-xs px-2.5 gap-1 border-white/[0.1] bg-white/[0.02]"
                >
                  {copiedText ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedText ? 'Copied' : 'Copy'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDoc(null)}
                  className="h-7 text-xs px-2 text-zinc-400 hover:text-white"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-[#07090e]">
              <pre className="text-xs font-mono whitespace-pre-wrap text-zinc-300 leading-relaxed selection:bg-sky-500/30">
                {selectedDoc.extractedText || 'No text extracted.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
