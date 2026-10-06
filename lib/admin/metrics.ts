import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

const DAY_MS = 24 * 60 * 60 * 1000;
const LIVE_WINDOW_MS = 3 * 60 * 1000;

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
  preset: string;
}

// Accepts ?range=24h|7d|30d|1y|custom with &from=YYYY-MM-DD&to=YYYY-MM-DD for custom.
export function resolveRange(params: { range?: string; from?: string; to?: string }): DateRange {
  const now = new Date();
  const presetDays: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "1y": 365 };

  if (params.range === "custom" && params.from && params.to) {
    const from = new Date(`${params.from}T00:00:00Z`);
    const to = new Date(`${params.to}T23:59:59.999Z`);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to) {
      return { from, to, label: `${params.from} to ${params.to}`, preset: "custom" };
    }
  }

  const preset = params.range && presetDays[params.range] ? params.range : "7d";
  const labels: Record<string, string> = {
    "24h": "Last 24 hours",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "1y": "Last year",
  };
  return {
    from: new Date(now.getTime() - presetDays[preset] * DAY_MS),
    to: now,
    label: labels[preset],
    preset,
  };
}

export interface MetricRow {
  key: string;
  label: string;
  value: number | null;
  note?: string;
}

export interface BreakdownRow {
  name: string;
  count: number;
}

export interface AffiliateSalesRow {
  userId: string;
  name: string;
  code: string;
  sales: number;
  salesCents: number;
}

// Admin-only: callers must already be behind the admin layout's auth check.
export async function getMetrics(range: DateRange) {
  const service = createServiceClient();
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();
  const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();


  const [
    liveRes,
    visitsRes,
    linkClicksRes,
    checkoutsRes,
    purchasesRes,
    progressRes,
    lessonsRes,
    winsRes,
    affiliatesRes,
    referralsRes,
    profilesRes,
  ] = await Promise.all([
    service.from("active_sessions").select("session_id", { count: "exact", head: true }).gte("last_seen", liveSince),
    (service.from("analytics_events").select("event, meta, user_id").in("event", ["landing_visit", "app_visit"]).gte("created_at", fromIso).lte("created_at", toIso)).limit(50000),
    (service.from("analytics_events").select("id", { count: "exact", head: true }).eq("event", "referral_link_click").gte("created_at", fromIso).lte("created_at", toIso)),
    (service.from("analytics_events").select("id", { count: "exact", head: true }).eq("event", "checkout_started").gte("created_at", fromIso).lte("created_at", toIso)),
    (service.from("purchases").select("id", { count: "exact", head: true }).eq("status", "completed").not("stripe_checkout_session_id", "like", "manual_grant_%").gte("created_at", fromIso).lte("created_at", toIso)),
    service.from("user_progress").select("user_id, completed_lessons, practice_task_submissions"),
    service.from("lessons").select("id"),
    (service.from("career_wins").select("user_id, kind").gte("created_at", fromIso).lte("created_at", toIso)),
    service.from("affiliates").select("user_id, code"),
    (service.from("affiliate_referrals").select("affiliate_user_id, sale_amount_cents").gte("created_at", fromIso).lte("created_at", toIso)),
    service.from("profiles").select("id, display_name"),
  ]);

  // Visits: landing (logged out) and app (logged in), split by source and device.
  const visits = visitsRes.data ?? [];
  const landingVisits = visits.filter((v) => v.event === "landing_visit").length;
  const sources = new Map<string, number>();
  const devices = new Map<string, number>();
  for (const v of visits) {
    const meta = (v.meta ?? {}) as { source?: string; device?: string };
    const s = meta.source ?? "unknown";
    const d = meta.device ?? "unknown";
    sources.set(s, (sources.get(s) ?? 0) + 1);
    devices.set(d, (devices.get(d) ?? 0) + 1);
  }
  const topSources: BreakdownRow[] = [...sources.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  const deviceRows: BreakdownRow[] = [...devices.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Refunds issued by Stripe within the range.
  let refunds: number | null = null;
  try {
    let count = 0;
    for await (const _ of getStripe().refunds.list({
      created: { gte: Math.floor(range.from.getTime() / 1000), lte: Math.floor(range.to.getTime() / 1000) },
      limit: 100,
    })) {
      count += 1;
      if (count >= 1000) break;
    }
    refunds = count;
  } catch (err) {
    console.error("getMetrics refunds", err);
  }

  // Practice submissions carry their own timestamp, so they filter by range.
  const progressRows = progressRes.data ?? [];
  let assessments = 0;
  for (const row of progressRows) {
    const subs = Object.values(row.practice_task_submissions ?? {}) as { submittedAt?: string }[];
    assessments += subs.filter((s) => s.submittedAt && s.submittedAt >= fromIso && s.submittedAt <= toIso).length;
  }

  // Completion has no timestamps, so it's all-time only.
  const totalLessons = (lessonsRes.data ?? []).length;
  const lessonIds = new Set((lessonsRes.data ?? []).map((l) => l.id));
  const completers = progressRows.filter((row) => {
    if (totalLessons === 0) return false;
    const done = new Set((row.completed_lessons ?? []).filter((id: string) => lessonIds.has(id)));
    return done.size >= totalLessons;
  }).length;

  const wins = winsRes.data ?? [];
  const winners = new Set(wins.map((w) => w.user_id)).size;

  const metrics: MetricRow[] = [
    { key: "live_viewers", label: "Live viewers (right now)", value: liveRes.count ?? 0, note: "Browsers active in the last 3 minutes." },
    { key: "visits", label: "Visits", value: visits.length, note: "Landing and logged-in homepage loads." },
    { key: "landing_visitors", label: "Landing-page visitors", value: landingVisits, note: "Logged-out visits only." },
    { key: "link_clicks", label: "People who click the link", value: linkClicksRes.count ?? 0, note: "Visits that arrived with an affiliate ?ref= code." },
    { key: "checkout_starts", label: "Checkout starts", value: checkoutsRes.count ?? 0 },
    { key: "completed_purchases", label: "Completed purchases", value: purchasesRes.count ?? 0, note: "Excludes comped grants." },
    { key: "refund_requests", label: "Refund requests", value: refunds, note: "Refunds issued in Stripe during the range." },
    { key: "course_completion", label: "Course completion (all time)", value: completers, note: "Students who finished every lesson. Completion dates aren't stored." },
    { key: "assessment_attempts", label: "Assessment attempts", value: assessments, note: "Practice task submissions." },
    { key: "interviews_secured", label: "Interviews secured", value: wins.filter((w) => w.kind === "interview").length, note: "Self-reported by students." },
    { key: "projects_secured", label: "Projects secured", value: wins.filter((w) => w.kind === "project").length, note: "Self-reported by students." },
    { key: "students_secured", label: "Students who secured an interview or project", value: winners, note: "Distinct students with at least one report." },
  ];

  const names = new Map((profilesRes.data ?? []).map((p) => [p.id, p.display_name as string | null]));
  const sales = new Map<string, { sales: number; salesCents: number }>();
  for (const r of referralsRes.data ?? []) {
    const s = sales.get(r.affiliate_user_id) ?? { sales: 0, salesCents: 0 };
    s.sales += 1;
    s.salesCents += r.sale_amount_cents;
    sales.set(r.affiliate_user_id, s);
  }
  const affiliateSales: AffiliateSalesRow[] = (affiliatesRes.data ?? []).map((a) => ({
    userId: a.user_id,
    name: names.get(a.user_id) ?? a.user_id,
    code: a.code,
    ...(sales.get(a.user_id) ?? { sales: 0, salesCents: 0 }),
  }));

  return { metrics, topSources, deviceRows, affiliateSales };
}
