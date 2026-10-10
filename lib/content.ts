import { createClient } from "@/lib/supabase/server";
import type {
  Module,
  UserStats,
  Testimonial,
  SiteAnnouncement,
  LessonReview,
  BlogPost,
} from "@/types";
import type { JobOpportunity } from "@/data/jobs";
import { isModuleAccessible, isSimulationPracticeAccessible, type MembershipTier } from "@/lib/access";
import { normalizeContentBlocks } from "@/lib/content-blocks";

export async function getModuleCurriculum(
  membershipTier: MembershipTier,
): Promise<Module[]> {
  const supabase = await createClient();
  const canPractice = isSimulationPracticeAccessible(membershipTier);

  const [
    { data: modules, error: modulesError },
    { data: lessons, error: lessonsError },
    { data: practiceTasks, error: practiceError },
  ] = await Promise.all([
    supabase.from("modules").select("*").order("sort_order"),
    supabase.from("lessons").select("*").order("sort_order").order("created_at"),
    supabase.from("practice_tasks").select("*").order("sort_order"),
  ]);

  if (modulesError) throw new Error(`getModuleCurriculum/modules: ${modulesError.message}`);
  if (lessonsError) throw new Error(`getModuleCurriculum/lessons: ${lessonsError.message}`);
  if (practiceError) throw new Error(`getModuleCurriculum/practice_tasks: ${practiceError.message}`);

  return (modules ?? []).map((m, index) => {
    const locked = !isModuleAccessible(membershipTier, index);

    return {
      id: m.id,
      title: m.title,
      description: m.description ?? "",
      simSkillBoosts: m.sim_skill_boosts ?? {},
      locked,
      // Locked modules keep just enough metadata (title/duration/count) to
      // render a "here's what you're missing" preview card — the actual
      // teaching content is stripped so it's never sent to the client.
      lessons: (lessons ?? [])
        .filter((l) => l.module_id === m.id)
        .map((l) =>
          locked
            ? {
                id: l.id,
                moduleId: l.module_id,
                title: l.title,
                description: undefined,
                duration: l.duration ?? "",
                objectives: [],
                content: [],
                miniCaseStudies: [],
                reflectionQuestions: [],
                keyTakeaways: [],
                skillBoosts: {},
              }
            : {
                id: l.id,
                moduleId: l.module_id,
                title: l.title,
                description: l.description ?? undefined,
                duration: l.duration ?? "",
                objectives: l.objectives ?? [],
                content: normalizeContentBlocks(l.content),
                miniCaseStudies: l.mini_case_studies ?? [],
                reflectionQuestions: l.reflection_questions ?? [],
                keyTakeaways: l.key_takeaways ?? [],
                skillBoosts: l.skill_boosts ?? {},
              },
        ),
      // Real World Practice is a paid-only feature regardless of which
      // module it belongs to.
      practiceTasks: !canPractice
        ? []
        : (practiceTasks ?? [])
            .filter((t) => t.module_id === m.id)
            .map((t) => ({
              id: t.id,
              moduleId: t.module_id,
              taskType: t.task_type,
              category: t.category ?? undefined,
              difficulty: t.difficulty ?? "beginner",
              domain: t.domain ?? "generalist",
              guideline: t.guideline ?? { text: "", media: [] },
              item: t.item ?? { text: "", media: [] },
              responseA: t.response_a ?? { text: "", media: [] },
              responseB: t.response_b ?? undefined,
              question: t.question ?? "",
              responseMode: t.response_mode,
              options: (t.options ?? []).map((o: { text: string; is_correct: boolean }) => ({
                text: o.text,
                isCorrect: o.is_correct,
              })),
              modelAnswer: t.model_answer ?? undefined,
              explanation: t.explanation ?? undefined,
              reviewerNotes: t.reviewer_notes ?? undefined,
              timed: t.timed,
              timeLimitSeconds: t.time_limit_seconds ?? undefined,
              failureModeTags: t.failure_mode_tags ?? [],
            })),
    };
  }) as Module[];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  // Testimonials are decorative, not load-bearing — the landing page has a
  // graceful empty state, so a missing/not-yet-migrated table shouldn't 500
  // the entire public home page for every visitor.
  if (error) {
    console.error(`getTestimonials: ${error.message}`);
    return [];
  }

  const curated: Testimonial[] = (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role ?? undefined,
    quote: t.quote,
    avatarUrl: t.avatar_url ?? undefined,
    proofImageUrl: t.proof_image_url ?? undefined,
    rating: t.rating ?? undefined,
  }));

  // Freshly-approved student reviews lead the carousel (newest first,
  // see getApprovedUserReviews' own ordering) rather than being appended
  // after the curated testimonials — otherwise a just-approved review sits
  // behind the ~10 curated slides and reads as "didn't show up" to whoever
  // approved it and checks the landing page.
  return [...(await getApprovedUserReviews()), ...curated];
}

const REVIEW_CONTEXT_LABEL: Record<string, string> = {
  case_study: "Case Study",
  interview: "AI Interview",
  practice_level: "Real World Practice",
};

// Student-submitted reviews (see lib/actions/user-reviews.ts), shown here
// only once an admin approves them in /admin/reviews — appended after the
// admin-curated testimonials rather than replacing them.
async function getApprovedUserReviews(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_reviews")
    .select("id, user_id, context_type, context_label, rating, quote, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`getApprovedUserReviews: ${error.message}`);
    return [];
  }
  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name as string | null]));

  return data.map((r) => ({
    id: `review_${r.id}`,
    name: names.get(r.user_id) || "Global Ready AIEval student",
    role: r.context_label || REVIEW_CONTEXT_LABEL[r.context_type] || undefined,
    quote: r.quote,
    rating: r.rating,
  }));
}

// Approved reviews written about a specific lesson's case studies, shown
// under that lesson (not just merged into the landing page testimonials)
// so other students browsing it can see what past students said. Keyed by
// lesson id (context_ref) — see components/LessonView.tsx.
export async function getApprovedLessonReviews(): Promise<Record<string, LessonReview[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_reviews")
    .select("user_id, context_ref, rating, quote, created_at")
    .eq("status", "approved")
    .eq("context_type", "case_study")
    .not("context_ref", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`getApprovedLessonReviews: ${error.message}`);
    return {};
  }
  if (!data || data.length === 0) return {};

  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name as string | null]));

  const byLesson: Record<string, LessonReview[]> = {};
  for (const r of data) {
    if (!r.context_ref) continue;
    (byLesson[r.context_ref] ??= []).push({
      name: names.get(r.user_id) || "Global Ready AIEval student",
      rating: r.rating,
      quote: r.quote,
      createdAt: r.created_at,
    });
  }
  return byLesson;
}

// Singleton banner (e.g. "Next cohort starts Oct 1") shown at the top of
// the landing page and the dashboard. Returns null when there's nothing to
// show — no active announcement, empty message, or the table/migration
// isn't there yet — same "never 500 the page over decorative content"
// posture as getTestimonials.
export async function getSiteAnnouncement(): Promise<SiteAnnouncement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_announcement")
    .select("message, link_url, link_label, is_active")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error(`getSiteAnnouncement: ${error.message}`);
    return null;
  }
  if (!data || !data.is_active || !data.message.trim()) return null;

  return {
    message: data.message,
    linkUrl: data.link_url ?? undefined,
    linkLabel: data.link_label ?? undefined,
  };
}

export async function getJobs(): Promise<JobOpportunity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`getJobs: ${error.message}`);

  return (data ?? []).map((j) => ({
    id: j.id,
    title: j.title,
    payRate: j.pay_rate ?? "",
    applicationUrl: j.application_url ?? undefined,
    referralReward: j.referral_reward ?? "",
    badge: j.badge ?? undefined,
    hiredText: j.hired_text ?? undefined,
    category: j.category,
    field: j.field,
    avatars: j.avatars ?? undefined,
    requiredLessonId: j.required_lesson_id ?? undefined,
    requiredLessonName: j.required_lesson_name ?? undefined,
    description: j.description ?? "",
    skillsNeeded: j.skills_needed ?? [],
  }));
}

const DEFAULT_SKILLS = {
  promptEvaluation: 0,
  responseRanking: 0,
  factChecking: 0,
  safetyReview: 0,
  annotation: 0,
  reasoning: 0,
  reasoningEvaluation: 0,
  instructionFollowing: 0,
};

export async function getUserStats(
  userId: string,
  email: string,
): Promise<UserStats> {
  const supabase = await createClient();

  const [{ data: profile, error: profileError }, { data: progress, error: progressError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_progress").select("*").eq("user_id", userId).single(),
    ]);

  if (profileError) throw new Error(`getUserStats/profile: ${profileError.message}`);
  if (progressError) throw new Error(`getUserStats/progress: ${progressError.message}`);

  return {
    completedLessons: progress.completed_lessons ?? [],
    completedSimulations: progress.completed_simulations ?? [],
    passedExams: progress.passed_exams ?? [],
    streakCount: progress.streak_count ?? 0,
    lastActiveDate: progress.last_active_date ?? new Date().toISOString(),
    xp: progress.xp ?? 0,
    activeRank: progress.active_rank ?? "Trainee Evaluator",
    skills: progress.skills ?? DEFAULT_SKILLS,
    practiceSubmissions: progress.practice_submissions ?? {},
    quizScores: progress.quiz_scores ?? {},
    practiceTaskSubmissions: progress.practice_task_submissions ?? {},
    totalInterviewsStarted: progress.total_interviews_started ?? 0,
    currentModuleId: progress.current_module_id ?? undefined,
    currentLessonId: progress.current_lesson_id ?? undefined,
    displayName: profile.display_name ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    email,
    role: profile.job_role ?? undefined,
    location: profile.location ?? undefined,
    timezone: profile.timezone ?? undefined,
    membershipTier: profile.membership_tier ?? "free",
    settings: profile.settings ?? {
      notificationsEnabled: true,
      audioFeedback: true,
      pacingMode: "standard",
    },
  };
}

function toBlogPost(p: Record<string, any>): BlogPost {
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt ?? undefined,
    content: p.content ?? "",
    coverImageUrl: p.cover_image_url ?? undefined,
    category: p.category ?? undefined,
    readMinutes: p.read_minutes ?? undefined,
    authorName: p.author_name ?? undefined,
    authorRole: p.author_role ?? undefined,
    authorAvatarUrl: p.author_avatar_url ?? undefined,
    publishedAt: p.published_at ?? undefined,
  };
}

// Blog is genuinely empty until an admin publishes something — no seed/mock
// posts. Public (readable by logged-out visitors), so a missing table
// shouldn't 500 the page, same posture as getTestimonials.
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .order("published_at", { ascending: false });

  if (error) {
    console.error(`getPublishedBlogPosts: ${error.message}`);
    return [];
  }
  return (data ?? []).map(toBlogPost);
}

export async function getPublishedBlogPost(id: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error(`getPublishedBlogPost: ${error.message}`);
    return null;
  }
  return data ? toBlogPost(data) : null;
}
