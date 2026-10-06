export type DeviceType = "mobile" | "tablet" | "desktop";

export function classifyDevice(userAgent: string | null | undefined): DeviceType {
  const ua = userAgent ?? "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
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
