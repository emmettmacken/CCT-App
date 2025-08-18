// supabase/functions/storeNotification/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  if (req.method !== "POST") {
    return new Response("Only POST requests allowed", { status: 405 });
  }

  const { userId, title, message, receivedAt } = await req.json();

  const { error } = await supabaseClient.from("notifications").insert({
    user_id: userId,
    title,
    message,
    received_at: receivedAt ?? new Date().toISOString(),
  });

  if (error) {
    console.error("Error inserting notification:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response("Notification stored successfully", { status: 200 });
});

