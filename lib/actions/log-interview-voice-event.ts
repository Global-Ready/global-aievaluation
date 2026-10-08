"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Fire-and-forget diagnostic log for the live-interview voice call dropping
// — lets us query what actually happened (Vapi's endedReason code) after
// the fact instead of relying on a user screenshotting a console log.
export async function logInterviewVoiceDropped(reason?: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await createServiceClient()
    .from("analytics_events")
    .insert({ event: "interview_voice_dropped", user_id: user.id, meta: { reason: reason ?? null } });
}
