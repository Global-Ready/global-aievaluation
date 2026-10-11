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
