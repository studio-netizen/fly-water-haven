import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyToken(token: string, secret: string): Promise<boolean> {
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
      ["verify"]
    );
    const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(payloadB64));
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  const token = req.headers.get("x-admin-token");
  if (!token || !adminPassword || !(await verifyToken(token, adminPassword))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "get_dashboard_stats": {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
        const monthStart = new Date(now.getTime() - 30 * 86400000).toISOString();

        const [
          { count: totalUsers },
          { count: totalPosts },
          { count: totalSpots },
          { count: totalMessages },
          { count: totalReviews },
          { count: newToday },
          { count: newWeek },
          { count: newMonth },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("spots").select("*", { count: "exact", head: true }),
          supabase.from("messages").select("*", { count: "exact", head: true }),
          supabase.from("reviews").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        ]);

        const [
          { data: activePosts },
          { data: activeComments },
          { data: activeLikes },
          { data: activeReviews },
        ] = await Promise.all([
          supabase.from("posts").select("user_id").gte("created_at", weekStart),
          supabase.from("comments").select("user_id").gte("created_at", weekStart),
          supabase.from("likes").select("user_id").gte("created_at", weekStart),
          supabase.from("reviews").select("user_id").gte("created_at", weekStart),
        ]);

        const activeUserIds = new Set([
          ...(activePosts || []).map((p: any) => p.user_id),
          ...(activeComments || []).map((c: any) => c.user_id),
          ...(activeLikes || []).map((l: any) => l.user_id),
          ...(activeReviews || []).map((r: any) => r.user_id),
        ]);

        const { data: recentProfiles } = await supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", monthStart)
          .order("created_at");

        const { data: recentPosts } = await supabase
          .from("posts")
          .select("created_at")
          .gte("created_at", monthStart)
          .order("created_at");

        const { data: allProfiles } = await supabase.from("profiles").select("fishing_types");

        const [
          { count: welcomeSent },
          { count: welcomeFailed },
        ] = await Promise.all([
          supabase.from("welcome_emails").select("*", { count: "exact", head: true }).eq("status", "sent"),
          supabase.from("welcome_emails").select("*", { count: "exact", head: true }).eq("status", "failed"),
        ]);

        return json({
          totalUsers: totalUsers || 0,
          totalPosts: totalPosts || 0,
          totalSpots: totalSpots || 0,
          totalMessages: totalMessages || 0,
          totalReviews: totalReviews || 0,
          newToday: newToday || 0,
          newWeek: newWeek || 0,
          newMonth: newMonth || 0,
          activeUsers7d: activeUserIds.size,
          retentionRate: totalUsers ? Math.round((activeUserIds.size / (totalUsers || 1)) * 100) : 0,
          registrationChart: recentProfiles || [],
          postsChart: recentPosts || [],
          fishingTypes: allProfiles || [],
          welcomeEmailsSent: welcomeSent || 0,
          welcomeEmailsFailed: welcomeFailed || 0,
        });
      }

      case "get_users": {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        const {
          data: { users: authUsers },
        } = await supabase.auth.admin.listUsers({ perPage: 1000 });

        const { data: posts } = await supabase.from("posts").select("user_id");
        const { data: reviews } = await supabase.from("reviews").select("user_id");

        const postCounts: Record<string, number> = {};
        (posts || []).forEach((p: any) => {
          postCounts[p.user_id] = (postCounts[p.user_id] || 0) + 1;
        });
        const reviewCounts: Record<string, number> = {};
        (reviews || []).forEach((r: any) => {
          reviewCounts[r.user_id] = (reviewCounts[r.user_id] || 0) + 1;
        });

        const users = (profiles || []).map((p: any) => {
          const authUser = authUsers?.find((u: any) => u.id === p.user_id);
          return {
            ...p,
            email: authUser?.email || "",
            last_sign_in_at: authUser?.last_sign_in_at || null,
            banned: authUser?.banned_until
              ? new Date(authUser.banned_until) > new Date()
              : false,
            post_count: postCounts[p.user_id] || 0,
            review_count: reviewCounts[p.user_id] || 0,
          };
        });

        return json(users);
      }

      case "get_messages": {
        const { data: messages } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        return json(messages || []);
      }

      case "delete_post": {
        const { id } = params;
        await supabase.from("likes").delete().eq("post_id", id);
        await supabase.from("comments").delete().eq("post_id", id);
        await supabase.from("notifications").delete().eq("post_id", id);
        await supabase.from("posts").delete().eq("id", id);
        return json({ success: true });
      }

      case "delete_spot": {
        const { id } = params;
        await supabase.from("reviews").delete().eq("spot_id", id);
        await supabase.from("notifications").delete().eq("spot_id", id);
        await supabase.from("posts").update({ spot_id: null }).eq("spot_id", id);
        await supabase.from("spots").delete().eq("id", id);
        return json({ success: true });
      }

      case "toggle_user_ban": {
        const { userId, ban } = params;
        if (ban) {
          await supabase.auth.admin.updateUserById(userId, { ban_duration: "87600h" });
        } else {
          await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
        }
        return json({ success: true });
      }

      case "toggle_user_guide": {
        const { userId, isGuide } = params;
        await supabase
          .from("profiles")
          .update({
            is_guide: !!isGuide,
            guide_status: isGuide ? "approved" : "none",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        return json({ success: true });
      }

      case "get_settings": {
        const { data } = await supabase.from("app_settings").select("*");
        return json(data || []);
      }

      case "update_setting": {
        const { key, value } = params;
        await supabase
          .from("app_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        return json({ success: true });
      }

      case "update_admin_password": {
        return json({ error: "Password changes must be done in platform settings" }, 400);
      }

      // ─── Blog CRUD ───
      case "get_blog_posts": {
        const { data } = await supabase
          .from("blog_posts")
          .select("*")
          .order("created_at", { ascending: false });
        return json(data || []);
      }

      case "get_blog_post": {
        const { id } = params;
        const { data } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", id)
          .single();
        return json(data);
      }

      case "save_blog_post": {
        const { id, post } = params as any;
        if (id) {
          const { data, error } = await supabase
            .from("blog_posts")
            .update(post)
            .eq("id", id)
            .select()
            .single();
          if (error) return json({ error: error.message }, 400);
          return json(data);
        } else {
          const { data, error } = await supabase
            .from("blog_posts")
            .insert(post)
            .select()
            .single();
          if (error) return json({ error: error.message }, 400);
          return json(data);
        }
      }

      case "delete_blog_post": {
        const { id } = params;
        await supabase.from("blog_posts").delete().eq("id", id);
        return json({ success: true });
      }

      case "duplicate_blog_post": {
        const { id } = params;
        const { data: original } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", id)
          .single();
        if (!original) return json({ error: "Not found" }, 404);
        const { id: _id, created_at, updated_at, ...rest } = original;
        const dup = {
          ...rest,
          title: `${original.title} (copia)`,
          slug: `${original.slug}-copia-${Date.now()}`,
          status: "draft",
          published_at: null,
        };
        const { data, error } = await supabase
          .from("blog_posts")
          .insert(dup)
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
