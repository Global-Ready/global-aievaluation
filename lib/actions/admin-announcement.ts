"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSiteAnnouncement(formData: FormData): Promise<{ error?: string }> {
  const message = String(formData.get("message") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const linkLabel = String(formData.get("linkLabel") ?? "").trim();
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_announcement")
    .update({
      message,
      link_url: linkUrl || null,
      link_label: linkLabel || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/announcement");
  revalidatePath("/");
  return {};
}
