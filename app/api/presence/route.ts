import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { classifyDevice } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceClient();
  await service.from("active_sessions").upsert({
    session_id: sessionId,
    user_id: user?.id ?? null,
    device: classifyDevice(request.headers.get("user-agent")),
    last_seen: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
