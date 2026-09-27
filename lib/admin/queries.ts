import { createClient } from "@/lib/supabase/server";
import { normalizeContentBlocks } from "@/lib/content-blocks";
import type { PracticeDomainId } from "@/lib/practice-domains";

export interface AdminJobRow {
  id: string;
  title: string;
  pay_rate: string | null;
  pay_rate_min_cents: number | null;
  referral_reward: string | null;
  badge: string | null;
  hired_text: string | null;
  category: "project-based" | "one-time" | "talent-network" | null;
  field: string;
  avatars: string[];
  required_lesson_id: string | null;
  required_lesson_name: string | null;
  description: string | null;
  skills_needed: string[];
  application_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface AdminModuleRow {
  id: string;
  title: string;
  description: string | null;
  simulation_intro: { scenario: string; objective: string } | null;
  sim_skill_boosts: Record<string, number>;
  sort_order: number;
}

export interface AdminCaseStudyMediaItem {
  type: "image" | "video" | "audio";
  path: string;
  url: string;
  durationSeconds?: number;
}

export interface AdminMiniCaseStudy {
  id: string;
  scenario: string;
  prompt: string;
  response: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  reviewerNotes?: string;
  media?: AdminCaseStudyMediaItem[];
}

export interface AdminContentBlock {
  id: string;
  text: string;
  media?: AdminCaseStudyMediaItem[]; // at most 1 attachment per block
}

export interface AdminLessonRow {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  duration: string | null;
  objectives: string[];
  content: AdminContentBlock[];
  mini_case_studies: AdminMiniCaseStudy[];
  reflection_questions: string[];
  key_takeaways: string[];
  skill_boosts: Record<string, number>;
  sort_order: number;
}

export async function getAdminJobs(): Promise<AdminJobRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(`getAdminJobs: ${error.message}`);
  return data ?? [];
}

export async function getAdminJob(id: string): Promise<AdminJobRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getAdminJob: ${error.message}`);
  return data;
}

export async function getAdminModules(): Promise<AdminModuleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(`getAdminModules: ${error.message}`);
  return data ?? [];
}

export async function getAdminModule(
  id: string,
): Promise<AdminModuleRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getAdminModule: ${error.message}`);
  return data;
}

export async function getAdminLessons(
  moduleId: string,
): Promise<AdminLessonRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("sort_order")
    .order("created_at");

  if (error) throw new Error(`getAdminLessons: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...row,
    content: normalizeContentBlocks(row.content),
  }));
}

export async function getAdminLesson(
  id: string,
): Promise<AdminLessonRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getAdminLesson: ${error.message}`);
  if (!data) return null;
  return { ...data, content: normalizeContentBlocks(data.content) };
}

export interface AdminPracticeTaskContentBlock {
  text: string;
  media: AdminCaseStudyMediaItem[];
}

export interface AdminPracticeTaskOption {
  text: string;
  is_correct: boolean;
}

export interface AdminPracticeTaskRow {
  id: string;
  module_id: string;
  task_type: string;
  category: string | null;
  difficulty: "beginner" | "intermediate" | "expert";
  domain: PracticeDomainId;
  sort_order: number;
  guideline: AdminPracticeTaskContentBlock;
  item: AdminPracticeTaskContentBlock;
  response_a: AdminPracticeTaskContentBlock;
  response_b: AdminPracticeTaskContentBlock | null;
  question: string;
  response_mode: "choice" | "written" | "choice_plus_written";
  interaction_type: "judge" | "produce";
  options: AdminPracticeTaskOption[];
  model_answer: string | null;
  explanation: string | null;
  reviewer_notes: string | null;
  timed: boolean;
  time_limit_seconds: number | null;
  failure_mode_tags: string[];
}

export async function getAdminPracticeTasks(
  moduleId: string,
): Promise<AdminPracticeTaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_tasks")
    .select("*")
    .eq("module_id", moduleId)
    .order("sort_order");

  if (error) throw new Error(`getAdminPracticeTasks: ${error.message}`);
  return data ?? [];
}

export async function getAllAdminPracticeTasks(): Promise<AdminPracticeTaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_tasks")
    .select("*")
    .order("module_id")
    .order("sort_order");

  if (error) throw new Error(`getAllAdminPracticeTasks: ${error.message}`);
  return data ?? [];
}

export async function getAdminPracticeTask(
  id: string,
): Promise<AdminPracticeTaskRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getAdminPracticeTask: ${error.message}`);
  return data;
}

export interface AdminTestimonialRow {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  avatar_url: string | null;
  proof_image_url: string | null;
  rating: number | null;
  is_active: boolean;
  sort_order: number;
}

export async function getAdminTestimonials(): Promise<AdminTestimonialRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(`getAdminTestimonials: ${error.message}`);
  return data ?? [];
}

export interface AdminAffiliateRow {
  user_id: string;
  display_name: string | null;
  code: string;
  commission_rate: number;
  status: "pending" | "active" | "disabled";
  created_at: string;
  referral_count: number;
  pending_commission_cents: number;
  paid_commission_cents: number;
}

export async function getAllAdminAffiliates(): Promise<AdminAffiliateRow[]> {
  const supabase = await createClient();
  const { data: affiliates, error: affiliatesError } = await supabase
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });
  if (affiliatesError) throw new Error(`getAllAdminAffiliates/affiliates: ${affiliatesError.message}`);
  if (!affiliates || affiliates.length === 0) return [];

  const userIds = affiliates.map((a) => a.user_id);
  const [{ data: profiles, error: profilesError }, { data: referrals, error: referralsError }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name").in("id", userIds),
      supabase
        .from("affiliate_referrals")
        .select("affiliate_user_id, commission_cents, status")
        .in("affiliate_user_id", userIds),
    ]);
  if (profilesError) throw new Error(`getAllAdminAffiliates/profiles: ${profilesError.message}`);
  if (referralsError) throw new Error(`getAllAdminAffiliates/referrals: ${referralsError.message}`);

  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.display_name as string | null]));

  return affiliates.map((a) => {
    const own = (referrals ?? []).filter((r) => r.affiliate_user_id === a.user_id);
    return {
      user_id: a.user_id,
      display_name: nameByUserId.get(a.user_id) ?? null,
      code: a.code,
      commission_rate: a.commission_rate,
      status: a.status,
      created_at: a.created_at,
      referral_count: own.length,
      pending_commission_cents: own
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + r.commission_cents, 0),
      paid_commission_cents: own
        .filter((r) => r.status === "paid")
        .reduce((sum, r) => sum + r.commission_cents, 0),
    };
  });
}

export interface AdminAffiliateDetail {
  user_id: string;
  display_name: string | null;
  code: string;
  commission_rate: number;
  status: "pending" | "active" | "disabled";
}

export async function getAdminAffiliate(userId: string): Promise<AdminAffiliateDetail | null> {
  const supabase = await createClient();
  const [{ data: affiliate, error }, { data: profile }] = await Promise.all([
    supabase.from("affiliates").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
  ]);
  if (error) throw new Error(`getAdminAffiliate: ${error.message}`);
  if (!affiliate) return null;

  return {
    user_id: affiliate.user_id,
    display_name: profile?.display_name ?? null,
    code: affiliate.code,
    commission_rate: affiliate.commission_rate,
    status: affiliate.status,
  };
}

export interface AdminAffiliateReferralRow {
  id: string;
  product_type: string | null;
  sale_amount_cents: number;
  commission_cents: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "reversed" | "cancelled";
  created_at: string;
}

export async function getAdminAffiliateReferrals(userId: string): Promise<AdminAffiliateReferralRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("affiliate_referrals")
    .select("id, product_type, sale_amount_cents, commission_cents, currency, status, created_at")
    .eq("affiliate_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAdminAffiliateReferrals: ${error.message}`);
  return data ?? [];
}

export async function getAdminTestimonial(
  id: string,
): Promise<AdminTestimonialRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getAdminTestimonial: ${error.message}`);
  return data;
}
