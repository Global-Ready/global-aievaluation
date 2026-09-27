"use client";

import { useRouter } from "next/navigation";
import LandingView from "@/components/LandingView";
import type { Testimonial, SiteAnnouncement } from "@/types";

export default function LandingGate({
  testimonials,
  announcement,
}: {
  testimonials: Testimonial[];
  announcement: SiteAnnouncement | null;
}) {
  const router = useRouter();

  return (
    <LandingView
      testimonials={testimonials}
      announcement={announcement}
      onEnterPlatform={() => router.push("/signup")}
      onLogin={() => router.push("/login")}
    />
  );
}
