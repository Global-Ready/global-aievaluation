import App from "@/App";
import LandingGate from "@/components/LandingGate";
import { createClient } from "@/lib/supabase/server";
import { getModuleCurriculum, getJobs, getUserStats, getTestimonials, getSiteAnnouncement } from "@/lib/content";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
