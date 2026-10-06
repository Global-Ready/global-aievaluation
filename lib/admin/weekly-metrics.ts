import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

export interface WeeklyMetric {
  key: string;
  label: string;
  last7: number | null;
  allTime: number | null;
  note?: string;
}

export interface AffiliateSalesRow {
  userId: string;
  name: string;
  code: string;
  sales7: number;
  sales7Cents: number;
  salesAllCents: number;
  salesAll: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Admin-only: callers must already be behind the admin layout's auth check.
export async function getWeeklyMetrics(): Promise<{
  metrics: WeeklyMetric[];
  affiliateSales: AffiliateSalesRow[];
}> {
  const service = createServiceClient();
  const since = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const sinceUnix = Math.floor((Date.now() - 7 * DAY_MS) / 1000);

  const countEvents = async (event: string, gte?: string) => {
    let q = service.from("analytics_events").select("id", { count: "exact", head: true }).eq("event", event);
    if (gte) q = q.gte("created_at", gte);
    const { count } = await q;
    return count ?? 0;
  };

  const [
    landingVisits7, landingVisitsAll,
    linkClicks7, linkClicksAll,
    checkouts7, checkoutsAll,
    purchases7Res, purchasesAllRes,
    progressRes, lessonsRes,
    affiliatesRes, referralsRes, profilesRes,
  ] = await Promise.all([
    countEvents("landing_visit", since),
    countEvents("landing_visit"),
    countEvents("referral_link_click", since),
    countEvents("referral_link_click"),
    countEvents("checkout_started", since),
    countEvents("checkout_started"),
    service.from("purchases").select("id", { count: "exact", head: true })
      .eq("status", "completed").not("stripe_checkout_session_id", "like", "manual_grant_%").gte("created_at", since),
    service.from("purchases").select("id", { count: "exact", head: true })
      .eq("status", "completed").not("stripe_checkout_session_id", "like", "manual_grant_%"),
    service.from("user_progress").select("user_id, completed_lessons, practice_task_submissions"),
    service.from("lessons").select("id"),
    service.from("affiliates").select("user_id, code"),
    service.from("affiliate_referrals").select("affiliate_user_id, sale_amount_cents, created_at"),
    service.from("profiles").select("id, display_name"),
  ]);

  let refunds7: number | null = null;
  try {
    const refunds = await getStripe().refunds.list({ created: { gte: sinceUnix }, limit: 100 });
    refunds7 = refunds.data.length;
  } catch (err) {
    console.error("getWeeklyMetrics refunds", err);
  }

  const progressRows = progressRes.data ?? [];
  const totalLessons = (lessonsRes.data ?? []).length;
  const lessonIds = new Set((lessonsRes.data ?? []).map((l) => l.id));

  let practice7 = 0;
  let practiceAll = 0;
  for (const row of progressRows) {
    const subs = Object.values(row.practice_task_submissions ?? {}) as { submittedAt?: string }[];
    practiceAll += subs.length;
    practice7 += subs.filter((s) => s.submittedAt && s.submittedAt >= since).length;
  }

  const completers = progressRows.filter((row) => {
    if (totalLessons === 0) return false;
    const done = new Set((row.completed_lessons ?? []).filter((id: string) => lessonIds.has(id)));
    return done.size >= totalLessons;
  }).length;

  const metrics: WeeklyMetric[] = [
    {
      key: "landing_visitors",
      label: "Landing-page visitors",
      last7: landingVisits7,
      allTime: landingVisitsAll,
      note: "Counts logged-out homepage loads (server-side, so bots that load the page are included).",
    },
    {
      key: "live_viewers",
      label: "Live viewers",
      last7: null,
      allTime: null,
      note: "Not tracked yet — needs a live presence/heartbeat signal.",
    },
    {
      key: "link_clicks",
      label: "People who click the link",
      last7: linkClicks7,
      allTime: linkClicksAll,
      note: "Visits that arrived with a ?ref= affiliate code.",
    },
    {
      key: "checkout_starts",
      label: "Checkout starts",
      last7: checkouts7,
      allTime: checkoutsAll,
    },
    {
      key: "completed_purchases",
      label: "Completed purchases",
      last7: purchases7Res.count ?? 0,
      allTime: purchasesAllRes.count ?? 0,
      note: "Excludes comped grants (manual_grant_*).",
    },
    {
      key: "refund_requests",
      label: "Refund requests",
      last7: refunds7,
      allTime: null,
      note: "Issued Stripe refunds in the last 7 days (all-time not shown).",
    },
    {
      key: "course_completion",
      label: "Course completion",
      last7: null,
      allTime: completers,
      note: "Students who have completed every lesson (all-time). Completion dates aren't stored, so no weekly figure.",
    },
    {
      key: "assessment_attempts",
      label: "Assessment attempts",
      last7: practice7,
      allTime: practiceAll,
      note: "Practice task submissions.",
    },
    {
      key: "secured_interviews",
      label: "Students who secure interviews or projects",
      last7: null,
      allTime: null,
      note: "Not tracked yet — needs a way for students (or you) to record an interview or project win.",
    },
  ];

  const names = new Map((profilesRes.data ?? []).map((p) => [p.id, p.display_name as string | null]));
  const sales = new Map<string, { sales7: number; sales7Cents: number; salesAll: number; salesAllCents: number }>();
  for (const r of referralsRes.data ?? []) {
    const s = sales.get(r.affiliate_user_id) ?? { sales7: 0, sales7Cents: 0, salesAll: 0, salesAllCents: 0 };
    s.salesAll += 1;
    s.salesAllCents += r.sale_amount_cents;
    if (r.created_at >= since) {
      s.sales7 += 1;
      s.sales7Cents += r.sale_amount_cents;
    }
    sales.set(r.affiliate_user_id, s);
  }

  const affiliateSales: AffiliateSalesRow[] = (affiliatesRes.data ?? []).map((a) => {
    const s = sales.get(a.user_id) ?? { sales7: 0, sales7Cents: 0, salesAll: 0, salesAllCents: 0 };
    return {
      userId: a.user_id,
      name: names.get(a.user_id) ?? a.user_id,
      code: a.code,
      ...s,
    };
  });

  return { metrics, affiliateSales };
}
