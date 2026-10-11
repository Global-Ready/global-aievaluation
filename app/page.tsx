import App from "@/App";
import LandingGate from "@/components/LandingGate";
import { createClient } from "@/lib/supabase/server";
import { getModuleCurriculum, getJobs, getUserStats, getTestimonials, getSiteAnnouncement, getApprovedLessonReviews } from "@/lib/content";
import { createServiceClient } from "@/lib/supabase/service";
import { headers } from "next/headers";
import { classifyDevice, classifySource, classifyCountry } from "@/lib/analytics";

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
  const country = classifyCountry(requestHeaders.get("x-vercel-ip-country"));
  const service = createServiceClient();
  await service.from("analytics_events").insert([
    {
      event: user ? "app_visit" : "landing_visit",
      user_id: user?.id ?? null,
      meta: { source, device, country },
    },
    ...(ref ? [{ event: "referral_link_click", meta: { code: ref, source, device, country } }] : []),
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
    .select("is_admin, membership_tier, country")
    .eq("id", user.id)
    .maybeSingle();

  // Keep the stored country current — cheap to skip when it hasn't changed
  // (e.g. the same user on every subsequent page load this session).
  if (country && profile?.country !== country) {
    await supabase.from("profiles").update({ country }).eq("id", user.id);
  }

  const [moduleCurriculum, jobs, initialStats, testimonials, announcement, lessonReviews] =
    await Promise.all([
      getModuleCurriculum(profile?.membership_tier ?? "free"),
      getJobs(),
      getUserStats(user.id, user.email!),
      getTestimonials(),
      getSiteAnnouncement(),
      getApprovedLessonReviews(),
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
      lessonReviews={lessonReviews}
    />
  );
}
