import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-anon-key';
const defaultBucket = process.env.SUPABASE_BUCKET || 'job-search-documents';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Uploads a document buffer to Supabase Private Storage under user's isolated path.
 */
export async function uploadPrivateDocument(params: {
  userId: string;
  fileBuffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<{ objectKey: string; error?: string }> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('Supabase URL not configured; using local fallback objectKey.');
      return { objectKey: `${params.userId}/${Date.now()}_${params.fileName}` };
    }

    const timestamp = Date.now();
    const cleanFileName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `${params.userId}/${timestamp}_${cleanFileName}`;

    const { error } = await supabaseAdmin.storage
      .from(defaultBucket)
      .upload(objectKey, params.fileBuffer, {
        contentType: params.contentType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { objectKey: '', error: error.message };
    }

    return { objectKey };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown storage upload error';
    return { objectKey: '', error: msg };
  }
}

/**
 * Generates a short-lived signed URL (valid for 15 minutes) for private file download/preview.
 */
export async function getDocumentSignedUrl(objectKey: string, expiresInSeconds = 900): Promise<string | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return null;
    }

    const { data, error } = await supabaseAdmin.storage
      .from(defaultBucket)
      .createSignedUrl(objectKey, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Deletes a file from private storage.
 */
export async function deletePrivateDocument(objectKey: string): Promise<boolean> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true;
    const { error } = await supabaseAdmin.storage.from(defaultBucket).remove([objectKey]);
    return !error;
  } catch {
    return false;
  }
}
