// SYSTEM — Déclencheur planifié des rappels push (Document 2 §5)
// Appelé par le cron Vercel toutes les 15 min (vercel.json), protégé par CRON_SECRET.
//
// 1. Rappels d'activités : reminder_time tombe dans la fenêtre courante
// 2. Rappels d'échéances projets : deadline - reminder_days = aujourd'hui
//    (toujours actifs — Doc 1 §4)

import { getServiceSupabase } from '@/lib/supabase-server';
import { NextResponse, type NextRequest } from 'next/server';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

interface PushKeys {
  p256dh: string;
  auth: string;
}

async function sendToAll(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: { title: string; body: string; url: string; tag: string }
) {
  const { data: subs } = await supabase.from('push_subscriptions').select('*');
  const results = await Promise.allSettled(
    (subs ?? []).map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys as PushKeys },
        JSON.stringify(payload),
        { TTL: 3600 }
      ).catch(async (err: { statusCode?: number }) => {
        // Abonnement expiré : nettoyage
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id);
        }
        throw err;
      })
    )
  );
  return results.filter((r) => r.status === 'fulfilled').length;
}

export async function GET(request: NextRequest) {
  // Protection du déclencheur (Vercel envoie le header Authorization)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: 'Clés VAPID manquantes' }, { status: 500 });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:system@localhost',
    vapidPublic,
    vapidPrivate
  );

  const supabase = getServiceSupabase();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let sent = 0;

  // Fenêtre de 15 min alignée sur le cron (ex. 18:00 ≤ rappel < 18:15)
  const hh = now.getHours();
  const mm = now.getMinutes();
  const windowStart = `${String(hh).padStart(2, '0')}:${String(Math.floor(mm / 15) * 15).padStart(2, '0')}`;

  // --- 1. Rappels d'activités à l'heure choisie ---------------------------
  const { data: activities } = await supabase
    .from('activities')
    .select('id, title, reminder_time')
    .eq('archived', false)
    .not('reminder_time', 'is', null);

  for (const a of activities ?? []) {
    if (a.reminder_time && a.reminder_time.slice(0, 5) === windowStart) {
      sent += await sendToAll(supabase, {
        title: 'System — Rappel',
        body: a.title,
        url: '/',
        tag: `activity-${a.id}-${today}`,
      });
    }
  }

  // --- 2. Rappels d'échéances projets (toujours actifs) -------------------
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, deadline, reminder_days')
    .eq('status', 'active')
    .not('deadline', 'is', null);

  for (const p of projects ?? []) {
    if (!p.deadline) continue;
    const reminderDate = new Date(p.deadline + 'T00:00:00Z');
    reminderDate.setUTCDate(reminderDate.getUTCDate() - (p.reminder_days ?? 3));
    if (reminderDate.toISOString().slice(0, 10) === today && windowStart === '09:00') {
      sent += await sendToAll(supabase, {
        title: 'System — Échéance projet',
        body: `« ${p.title} » : deadline dans ${p.reminder_days ?? 3} j.`,
        url: '/progress',
        tag: `project-${p.id}-${today}`,
      });
    }
  }

  return NextResponse.json({ ok: true, sent, window: windowStart });
}
