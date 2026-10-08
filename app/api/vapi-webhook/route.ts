import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { VAPI_WEBHOOK_TOKEN } from "@/lib/liveInterview/buildLiveConfig";

// Vapi's only channel for a call's specific failure reason (endedReason) —
// the browser SDK never receives it (see lib/liveInterview/buildLiveConfig.ts).
// Not tied to a logged-in session (Vapi calls this server-to-server), so
// there's no user to attribute the row to — this is purely "what happened
// and when," cross-referenced by time against the client-side
// interview_voice_dropped events, which do have a user_id.
export async function POST(request: NextRequest) {
  if (request.headers.get("x-webhook-token") !== VAPI_WEBHOOK_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message = body?.message;

  if (message?.type === "end-of-call-report") {
    await createServiceClient().from("analytics_events").insert({
      event: "interview_voice_webhook_report",
      meta: {
        endedReason: message.endedReason ?? null,
        durationSeconds: message.durationSeconds ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
