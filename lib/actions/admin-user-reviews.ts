"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UserReviewStatus = "pending" | "approved" | "rejected";

export async function setUserReviewStatus(
  id: string,
  status: UserReviewStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("user_reviews").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return {};
}
