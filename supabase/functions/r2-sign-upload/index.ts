import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED_FOLDERS = new Set(["posts", "avatars", "spots", "blog", "reports", "reviews"]);

async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return false;
    const payload = JSON.parse(atob(payloadB64));
    if (!payload.admin || payload.exp < Date.now()) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sig,
      new TextEncoder().encode(payloadB64),
    );
  } catch {
    return false;
  }
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucket = Deno.env.get("R2_BUCKET_NAME");
    const publicBaseRaw = Deno.env.get("R2_PUBLIC_URL");

    console.log("R2 env presence:", {
      endpoint: !!endpoint,
      accessKeyId: !!accessKeyId,
      secretAccessKey: !!secretAccessKey,
      bucket: !!bucket,
      publicBase: !!publicBaseRaw,
    });

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseRaw) {
      return new Response(
        JSON.stringify({
          error: "R2 not configured",
          missing: {
            R2_ENDPOINT: !endpoint,
            R2_ACCESS_KEY_ID: !accessKeyId,
            R2_SECRET_ACCESS_KEY: !secretAccessKey,
            R2_BUCKET_NAME: !bucket,
            R2_PUBLIC_URL: !publicBaseRaw,
          },
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const publicBase = publicBaseRaw.replace(/\/$/, "");

    const body = await req.json();
    const folder = String(body.folder || "");
    const contentType = String(body.contentType || "application/octet-stream");
    const filename = body.filename ? sanitizeName(String(body.filename)) : "file";
    const upsertPath = body.path ? String(body.path) : null;

    if (!ALLOWED_FOLDERS.has(folder)) {
      return new Response(JSON.stringify({ error: "Invalid folder" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: either user JWT or admin token
    let userId: string | null = null;
    let isAdmin = false;

    const adminToken = req.headers.get("x-admin-token");
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (adminToken && adminPassword && await verifyAdminToken(adminToken, adminPassword)) {
      isAdmin = true;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabase.auth.getClaims(token);
      if (error || !data?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = data.claims.sub as string;
    }

    // Blog folder requires admin
    if (folder === "blog" && !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build key. Use userId in path for ownership verification on delete.
    let key: string;
    if (upsertPath) {
      // Caller-provided stable path (e.g. avatar). Must be within owner namespace.
      const ownerSeg = isAdmin ? "admin" : userId!;
      key = `${folder}/${ownerSeg}/${sanitizeName(upsertPath)}`;
    } else {
      const ownerSeg = isAdmin ? "admin" : userId!;
      const rand = crypto.randomUUID().slice(0, 8);
      key = `${folder}/${ownerSeg}/${Date.now()}-${rand}-${filename}`;
    }

    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    const baseUrl = `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
    const url = new URL(baseUrl);
    url.searchParams.set("X-Amz-Expires", "300");
    const signed = await aws.sign(
      new Request(url.toString(), {
        method: "PUT",
        headers: { "content-type": contentType },
      }),
      { aws: { signQuery: true } },
    );

    return new Response(
      JSON.stringify({
        uploadUrl: signed.url,
        publicUrl: `${publicBase}/${key}`,
        key,
        contentType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
