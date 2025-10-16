import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Mode = 'appointments-morning' | 'appointments-evening' | 'fasting-evening' | 'meds-noon';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_PUSH_URL = Deno.env.get('EXPO_PUSH_URL') ?? 'https://exp.host/--/api/v2/push/send';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function sendExpoPushMessages(messages: any[]) {
  if (!messages.length) return { success: true, sent: 0 };

  const chunkSize = 100;
  let sent = 0;

  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      console.error('Expo push failed:', res.status, await res.text());
    } else {
      sent += chunk.length;
    }
  }

  return { success: true, sent };
}

async function handleMode(mode: Mode) {
  const now = new Date();

  // Compute dates in YYYY-MM-DD
  const tzOffsetMinutes = -new Date().getTimezoneOffset();
  const tzToday = new Date(Date.now() + tzOffsetMinutes * 60 * 1000);
  const yyyy = tzToday.getFullYear();
  const mm = String(tzToday.getMonth() + 1).padStart(2, '0');
  const dd = String(tzToday.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tzTomorrow = new Date(tzToday);
  tzTomorrow.setDate(tzTomorrow.getDate() + 1);
  const ty = tzTomorrow.getFullYear();
  const tm = String(tzTomorrow.getMonth() + 1).padStart(2, '0');
  const td = String(tzTomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${td}-${tm}-${ty}`;

  const messages: any[] = [];

  if (['appointments-morning', 'appointments-evening', 'fasting-evening'].includes(mode)) {
    const { data: appts, error: apptsErr } = await supabase
      .from('appointments')
      .select('user_id, fasting_required')
      .eq('date', tomorrowStr);

    if (apptsErr) return { error: 'appointments_fetch_failed' };
    if (!appts?.length) return { success: true, reason: 'no_appointments' };

    const map = new Map<string, { hasFasting: boolean }>();
    for (const r of appts) {
      const uid = r.user_id;
      if (!uid) continue;
      const entry = map.get(uid) ?? { hasFasting: false };
      if (r.fasting_required) entry.hasFasting = true;
      map.set(uid, entry);
    }

    const userIds = Array.from(map.keys());
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, expo_push_token')
      .in('id', userIds);

    if (profilesErr) return { error: 'profiles_fetch_failed' };

    for (const p of profiles || []) {
      const token = p.expo_push_token;
      if (!token) continue;
      const userHasFasting = map.get(p.id)?.hasFasting ?? false;

      if (mode === 'appointments-morning') {
        messages.push({ to: token, title: 'Your next appointment is tomorrow', body: `You have appointments scheduled for ${tomorrowStr}.`, data: { type: 'appointment', when: 'tomorrow' } });
      } else if (mode === 'appointments-evening') {
        messages.push({ to: token, title: 'Your next appointment is tomorrow', body: `You have appointments tomorrow. Review your requirements for this appointment.`, data: { type: 'appointment', when: 'tomorrow' } });
      } else if (mode === 'fasting-evening' && userHasFasting) {
        messages.push({ to: token, title: 'Fasting Reminder', body: 'Reminder: you must fast for your appointment tomorrow.', data: { type: 'fasting', when: 'tomorrow' } });
      }
    }
  } else if (mode === 'meds-noon') {
    const { data: meds, error: medsErr } = await supabase
      .from('trial_medications')
      .select('user_id')
      .eq('scheduled_date', todayStr);

    if (medsErr) return { error: 'meds_fetch_failed' };
    if (!meds?.length) return { success: true, reason: 'no_meds' };

    const userIds = Array.from(new Set(meds.map((m) => m.user_id).filter(Boolean)));
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, expo_push_token')
      .in('id', userIds);

    if (profilesErr) return { error: 'profiles_fetch_failed' };

    for (const p of profiles || []) {
      const token = p.expo_push_token;
      if (!token) continue;
      messages.push({ to: token, title: 'Medication Reminder', body: 'Have you taken your trial medications today?', data: { type: 'medication', when: 'today' } });
    }
  }

  // Deduplicate
  const uniqueKey = (m: any) => `${m.to}|${m.title}|${m.body}`;
  const deduped = Array.from(new Map(messages.map((m) => [uniqueKey(m), m])).values());

  const result = await sendExpoPushMessages(deduped);
  return { success: true, sent: result.sent ?? 0, attempted: deduped.length };
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const modeParam = url.searchParams.get('mode') as Mode | null;
    if (!modeParam) return new Response(JSON.stringify({ error: 'missing_mode_param' }), { status: 400 });

    const result = await handleMode(modeParam);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
