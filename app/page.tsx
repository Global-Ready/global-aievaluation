import App from "@/App";
import LandingGate from "@/components/LandingGate";
import { createClient } from "@/lib/supabase/server";
import { getModuleCurriculum, getJobs, getUserStats, getTestimonials, getSiteAnnouncement } from "@/lib/content";
import { createServiceClient } from "@/lib/supabase/service";
import { headers } from "next/headers";
import { classifyDevice, classifySource } from "@/lib/analytics";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; utm_source?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { ref, utm_source } = await searchParams;
  const requestHeaders = await headers();
  const device = classifyDevice(requestHeaders.get("user-agent"));
  const source = classifySource(utm_source, requestHeaders.get("referer"));
  const service = createServiceClient();
  await service.from("analytics_events").insert([
    {
      event: user ? "app_visit" : "landing_visit",
      user_id: user?.id ?? null,
      meta: { source, device },
    },
    ...(ref ? [{ event: "referral_link_click", meta: { code: ref, source, device } }] : []),
  ]);

  if (!user) {
    const [testimonials, announcement] = await Promise.all([
      getTestimonials(),
      getSiteAnnouncement(),
    ]);
    return <LandingGate testimonials={testimonials} announcement={announcement} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, membership_tier")
    .eq("id", user.id)
    .maybeSingle();

  const [moduleCurriculum, jobs, initialStats, testimonials, announcement] =
    await Promise.all([
      getModuleCurriculum(profile?.membership_tier ?? "free"),
      getJobs(),
      getUserStats(user.id, user.email!),
      getTestimonials(),
      getSiteAnnouncement(),
    ]);

  return (
    <App
      userId={user.id}
      moduleCurriculum={moduleCurriculum}
      jobs={jobs}
      initialStats={initialStats}
      isAdmin={profile?.is_admin ?? false}
      testimonials={testimonials}
      announcement={announcement}
    />
  );
}
