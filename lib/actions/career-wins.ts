"use server";

import { createClient } from "@/lib/supabase/server";

export async function reportCareerWin(input: {
  kind: "interview" | "project";
  company?: string;
  note?: string;
}): Promise<{ error?: string }> {
  if (input.kind !== "interview" && input.kind !== "project") {
    return { error: "Choose interview or project." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("career_wins").insert({
    user_id: user.id,
    kind: input.kind,
    company: input.company?.trim().slice(0, 120) || null,
    note: input.note?.trim().slice(0, 500) || null,
  });
  if (error) return { error: error.message };
  return {};
}
