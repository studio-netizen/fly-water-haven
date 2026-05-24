import { supabase } from "@/integrations/supabase/client";

export type R2Folder = "posts" | "avatars" | "spots" | "blog" | "reports" | "reviews";

interface SignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  contentType: string;
}

/**
 * Upload a (pre-compressed) file to Cloudflare R2 via a server-signed PUT URL.
 * Returns the public URL to store in the database.
 *
 * @param file       File to upload (compress before calling this).
 * @param folder     Logical folder: posts | avatars | spots | blog | reports | reviews.
 * @param opts.path  Optional stable filename (e.g. "avatar.webp") for upsert.
 * @param opts.adminToken Optional admin JWT for admin-only folders (e.g. blog).
 */
export async function uploadToR2(
  file: File,
  folder: R2Folder,
  opts: { path?: string; adminToken?: string } = {},
): Promise<string> {
  const headers: Record<string, string> = {};
  if (opts.adminToken) headers["x-admin-token"] = opts.adminToken;

  const { data, error } = await supabase.functions.invoke<SignResponse>("r2-sign-upload", {
    body: {
      folder,
      contentType: file.type || "application/octet-stream",
      filename: opts.path ? undefined : file.name,
      path: opts.path,
    },
    headers,
  });
  if (error || !data?.uploadUrl) {
    throw new Error(error?.message || "Failed to sign R2 upload");
  }

  const putRes = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": data.contentType },
    body: file,
  });
  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "");
    throw new Error(`R2 upload failed (${putRes.status}): ${text}`);
  }

  return data.publicUrl;
}

/**
 * Delete a file from R2 by its public URL. Server validates ownership
 * (key must be under the caller's user id) or admin token.
 */
export async function deleteFromR2(
  url: string,
  opts: { adminToken?: string } = {},
): Promise<void> {
  if (!url) return;
  const headers: Record<string, string> = {};
  if (opts.adminToken) headers["x-admin-token"] = opts.adminToken;

  const { error } = await supabase.functions.invoke("r2-delete", {
    body: { url },
    headers,
  });
  if (error) {
    // Don't throw — we don't want to block DB cleanup if the object is already gone.
    // eslint-disable-next-line no-console
    console.warn("R2 delete failed (ignored):", error.message);
  }
}

/** True if a URL is hosted on our R2 public bucket. */
export function isR2Url(url: string | null | undefined): boolean {
  if (!url) return false;
  const base = (import.meta as any).env?.VITE_R2_PUBLIC_URL;
  if (base) return url.startsWith(base);
  // Heuristic fallback: r2.dev or r2.cloudflarestorage.com
  return /r2\.(dev|cloudflarestorage\.com)/.test(url);
}
