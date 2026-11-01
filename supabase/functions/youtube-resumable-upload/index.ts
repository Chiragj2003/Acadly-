import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YouTubeUploadRequest {
  instituteId: string;
  batchId: string;
  title: string;
  description: string;
  mimeType: string;
  fileSizeBytes: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: YouTubeUploadRequest = await req.json();
    const { instituteId, title, description, mimeType, fileSizeBytes } = body;

    if (!instituteId || !title || !fileSizeBytes) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is teacher or admin in this institute
    const { data: membership, error: memError } = await supabaseClient
      .from("institute_members")
      .select("role")
      .eq("institute_id", instituteId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (memError || !membership || !["admin", "teacher", "super_admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Forbidden: Only staff can initiate video uploads" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh Google OAuth token
    const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
    const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");
    const refreshToken = Deno.env.get("YOUTUBE_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
      return new Response(JSON.stringify({ error: "Server missing YouTube OAuth credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return new Response(JSON.stringify({ error: "Failed to exchange refresh token", details: tokenData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenData.access_token;

    // Initiate YouTube Resumable Upload
    const metadata = {
      snippet: {
        title,
        description: `${description}\n\nUploaded via Acadly LMS`,
        categoryId: "27", // Education
      },
      status: {
        privacyStatus: "unlisted",
        selfDeclaredMadeForKids: false,
        embeddable: true,
      },
    };

    const youtubeResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": mimeType || "video/mp4",
          "X-Upload-Content-Length": fileSizeBytes.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (youtubeResponse.status !== 200) {
      const errText = await youtubeResponse.text();
      return new Response(JSON.stringify({ error: "Failed to initiate YouTube resumable session", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uploadUrl = youtubeResponse.headers.get("location");
    if (!uploadUrl) {
      return new Response(JSON.stringify({ error: "Missing upload location header from YouTube" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl,
        privacy: "unlisted",
        expiresInSeconds: 3600,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
