import mammoth from 'mammoth';

/**
 * Extracts plain text from an uploaded document buffer (PDF, DOCX, TXT)
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop() || '';

  // 1. Plain text / Markdown
  if (mimeType.includes('text/plain') || ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8');
  }

  // 2. Word Document (DOCX)
  if (
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('application/msword') ||
    ext === 'docx'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    } catch (err: unknown) {
      console.error('Failed to parse DOCX:', err);
      throw new Error('Failed to parse Word document (.docx). File may be corrupted or password-protected.');
    }
  }

  // 3. PDF Document
  if (mimeType.includes('pdf') || ext === 'pdf') {
    try {
      // Dynamic import to avoid SSR bundling issues
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text.trim();
    } catch (err: unknown) {
      console.error('Failed to parse PDF:', err);
      throw new Error('Failed to parse PDF document. File may be encrypted, scanned image without OCR, or corrupted.');
    }
  }

  throw new Error(`Unsupported document type (${mimeType}). Please upload PDF, DOCX, or TXT.`);
}
