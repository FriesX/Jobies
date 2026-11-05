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
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
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
    if (!confirm('Are you sure you want to permanently delete this document?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments(documents.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch {
      alert('Failed to delete document.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Private Document Vault</h1>
        <p className="text-sm text-muted-foreground">
          Secure, isolated storage for your original resumes, portfolios, and certifications. Files are never shared publicly.
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="border-dashed border-2 border-border/80 hover:border-primary/50 transition-colors">
        <CardContent className="p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold">Upload Resume or Career Document</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Drag and drop your file here, or click to browse. We support PDF, Word (.docx), and plain text up to 10MB.
            </p>
          </div>

          {/* Doc Type Selector */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-xs font-medium text-muted-foreground">Document Type:</span>
            {['CV', 'PORTFOLIO', 'CERTIFICATE'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDocType(t)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                  docType === t
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
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
              className="gap-2"
            >
              {uploading ? 'Processing & Extracting...' : 'Select File'}
            </Button>
          </div>

          {errorMsg && (
            <p className="text-xs text-destructive flex items-center justify-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stored Documents List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Your Vault Documents ({documents.length})</h2>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-xs">
            No documents in your vault yet. Upload your primary CV above to get started.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 space-y-3 hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs truncate max-w-[200px]" title={doc.originalFilename}>
                        {doc.originalFilename}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {formatBytes(doc.sizeBytes)} • {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Badge variant={doc.documentType === 'CV' ? 'default' : 'secondary'} className="text-[10px]">
                    {doc.documentType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Text Extracted
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDoc(doc)}
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect Text
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Extracted Text Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl bg-card border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div>
                <CardTitle className="text-base truncate">{selectedDoc.originalFilename}</CardTitle>
                <CardDescription className="text-xs">
                  Server-side extracted text used for Gemini Grounding
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1">
              <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {selectedDoc.extractedText || 'No text extracted.'}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
