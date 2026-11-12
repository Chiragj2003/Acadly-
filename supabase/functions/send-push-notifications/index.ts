import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationPayload {
  instituteId: string;
  userIds: string[];
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: PushNotificationPayload = await req.json();
    const { instituteId, userIds, title, body, type = "general", data = {} } = payload;

    if (!instituteId || !userIds || !userIds.length || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required notification fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Expo Push tokens from both push_tokens table and profiles
    const { data: pushTokenRows } = await supabaseAdmin
      .from("push_tokens")
      .select("user_id, token")
      .in("user_id", userIds);

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, expo_push_token")
      .in("id", userIds);

    if (profileError) {
      return new Response(JSON.stringify({ error: "Failed to fetch user profiles", details: profileError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter valid tokens
    const validTokens: { token: string; userId: string }[] = [];
    const notificationInserts = [];
    const seenTokens = new Set<string>();

    for (const pt of pushTokenRows || []) {
      if (pt.token && (pt.token.startsWith("ExponentPushToken[") || pt.token.startsWith("ExpoPushToken["))) {
        validTokens.push({ token: pt.token, userId: pt.user_id });
        seenTokens.add(pt.token);
      }
    }

    for (const p of profiles || []) {
      notificationInserts.push({
        institute_id: instituteId,
        user_id: p.id,
        recipient_id: p.id,
        title,
        body,
        message: body,
        type,
        data,
      });

      if (p.expo_push_token && !seenTokens.has(p.expo_push_token) && (p.expo_push_token.startsWith("ExponentPushToken[") || p.expo_push_token.startsWith("ExpoPushToken["))) {
        validTokens.push({ token: p.expo_push_token, userId: p.id });
        seenTokens.add(p.expo_push_token);
      }
    }

    // Insert in-app notifications
    if (notificationInserts.length > 0) {
      await supabaseAdmin.from("notifications").insert(notificationInserts);
    }

    let sentCount = 0;
    // Chunk tokens into batches of 100 for Expo API
    if (validTokens.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < validTokens.length; i += chunkSize) {
        const chunk = validTokens.slice(i, i + chunkSize);
        const messages = chunk.map((item) => ({
          to: item.token,
          sound: "default",
          title,
          body,
          data: { ...data, type },
          priority: "high",
          channelId: "default",
        }));

        const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        });

        if (expoResponse.ok) {
          sentCount += chunk.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipientsTotal: userIds.length,
        pushSent: sentCount,
        inAppRecorded: notificationInserts.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to dispatch notifications" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
