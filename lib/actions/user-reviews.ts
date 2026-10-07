"use server";

import { createClient } from "@/lib/supabase/server";

export type ReviewContextType = "case_study" | "interview" | "practice_level";

export async function submitUserReview(input: {
  contextType: ReviewContextType;
  contextLabel?: string;
  contextRef?: string;
  rating: number;
  quote: string;
}): Promise<{ error?: string }> {
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) return { error: "Pick a rating from 1 to 5." };
  const quote = input.quote.trim();
  if (!quote) return { error: "Please write a few words about your experience." };
  if (!["case_study", "interview", "practice_level"].includes(input.contextType)) {
    return { error: "Invalid review context." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("user_reviews").insert({
    user_id: user.id,
    context_type: input.contextType,
    context_label: input.contextLabel?.trim().slice(0, 120) || null,
    context_ref: input.contextRef?.trim().slice(0, 120) || null,
    rating,
    quote: quote.slice(0, 1000),
  });
  if (error) return { error: error.message };
  return {};
}
