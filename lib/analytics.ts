import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export type DeviceType = "mobile" | "tablet" | "desktop";

export function classifyDevice(userAgent: string | null | undefined): DeviceType {
  const ua = userAgent ?? "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

// Vercel's edge network sets this on every request with a two-letter
// ISO 3166-1 country code (e.g. "US") — absent in local dev, where there's
// no edge in front of the request.
export function classifyCountry(headerValue: string | null | undefined): string | null {
  const country = headerValue?.trim().toUpperCase();
  return country && /^[A-Z]{2}$/.test(country) ? country : null;
}

// Where a visit came from: an explicit utm_source wins, otherwise the
// referring hostname (without "www."), otherwise "direct".
export function classifySource(
  utmSource: string | null | undefined,
  referer: string | null | undefined,
): string {
  const utm = utmSource?.trim().toLowerCase();
  if (utm) return utm.slice(0, 64);
  if (referer) {
    try {
      return new URL(referer).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  }
  return "direct";
}

// Logs a visit to the public blog (list page when postId is null, a
// specific post otherwise) — these pages are reachable logged-out, so
// user_id is attributed only when a session happens to be present.
// Server-only (headers()/service client) — call from a blog page's own
// server component, not from client code.
export async function logBlogVisit(postId: string | null): Promise<void> {
  const requestHeaders = await headers();
  const device = classifyDevice(requestHeaders.get("user-agent"));
  const source = classifySource(null, requestHeaders.get("referer"));
  const country = classifyCountry(requestHeaders.get("x-vercel-ip-country"));

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Blog pages are public — a missing/invalid session just means anonymous.
  }

  const service = createServiceClient();
  await service.from("analytics_events").insert({
    event: "blog_visit",
    user_id: userId,
    meta: { source, device, country, postId },
  });
}
