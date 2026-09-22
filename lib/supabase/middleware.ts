import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/jobs",
  "/privacy",
  "/terms",
  "/refunds",
  "/ai-transparency",
  "/third-party-disclosure",
  "/cookies",
  "/impressum",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico" || pathname === "/icon.png") return true;
  return false;
}

// Affiliate links look like "/?ref=<code>" — stash the code in a cookie so
// it survives through signup/login and is still readable at checkout time
// (lib/actions/billing.ts), well past whatever page the link first landed
// on. Last-click-wins: only overwrite when a "ref" param is actually present.
// This cookie is not strictly necessary (it benefits the affiliate, not the
// visitor), so it's gated behind the cookie-consent choice recorded by
// components/CookieConsentBanner.tsx — no decision yet defaults to not
// setting it (fail closed), matching the banner's own accept-time fallback
// that writes this same cookie client-side if consent arrives after the
// referral click already happened on this request.
function applyReferralCookie(response: NextResponse, request: NextRequest) {
  const refCode = request.nextUrl.searchParams.get("ref");
  const hasConsent = request.cookies.get("gr_consent")?.value === "accepted";
  if (refCode && hasConsent) {
    response.cookies.set("gr_ref", refCode.slice(0, 32), {
      maxAge: 60 * 60 * 24 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Supabase isn't configured yet (no .env.local) — let requests through
  // unauthenticated rather than 500ing the whole app.
  if (!supabaseUrl || !supabasePublishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session cookie if needed. Do not remove — required for
  // Server Components to reliably see a valid session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // `nextUrl.pathname` keeps its percent-encoding (e.g. a literal "%20"
    // stays as those 3 characters, not a decoded space) — searchParams.set()
    // then encodes the value again, turning "%20" into "%2520". Decode once
    // first so the query string ends up with exactly the one level of
    // encoding `searchParams.get("redirectTo")` expects on the other end.
    loginUrl.searchParams.set("redirectTo", decodeURIComponent(request.nextUrl.pathname));
    return applyReferralCookie(NextResponse.redirect(loginUrl), request);
  }

  return applyReferralCookie(supabaseResponse, request);
}
