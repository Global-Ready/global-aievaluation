import React from "react";
import {
  BookOpen, Play, Lock, Gauge, Megaphone
} from "lucide-react";
import { UserStats, Rank, Module, SiteAnnouncement } from "../types";
import CareerWinReporter from "./CareerWinReporter";

interface DashboardViewProps {
  stats: UserStats;
  currentRank: Rank;
  overallReadiness: number;
  activeModule: Module;
  moduleCurriculum: Module[];
  setActiveTab: (tab: string) => void;
  startLesson: (lessonId: string) => void;
  activeModuleId: string;
  setActiveModuleId: (id: string) => void;
  setActivePartId?: (partId: string | null) => void;
  announcement?: SiteAnnouncement | null;
}

export default function DashboardView({
  stats,
  currentRank,
  overallReadiness,
  activeModule,
  moduleCurriculum,
  setActiveTab,
  startLesson,
  activeModuleId,
  setActiveModuleId,
  setActivePartId,
  announcement,
}: DashboardViewProps) {

  // Calculate completed metrics for overall curriculum
  const completedCount = stats.completedLessons.length;
  const totalLessons = moduleCurriculum.flatMap(m => m.lessons).length;
  const overallProgressPercent = totalLessons > 0
    ? Math.min(100, Math.round((completedCount / totalLessons) * 100))
    : 0;

  // A brand-new profile's display_name defaults to the email's local part
  // (see handle_new_user() in supabase/migrations/0001_init.sql) — that's not
  // a real name, so don't greet the user with their raw email handle.
  const emailLocalPart = stats.email?.split("@")[0];
  const hasRealName = !!stats.displayName && stats.displayName !== emailLocalPart;
  const firstName = hasRealName ? stats.displayName!.split(" ")[0] : null;

  // Note: the old "Professional AI Evaluation Skills" (Part 2) card that
  // used to appear here was never real, admin-managed content — just
  // leftover mock data — and has been removed from this grid.
  const moduleCards = moduleCurriculum.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    lessonsCount: m.lessons.length,
    completedCount: m.lessons.filter((l) => stats.completedLessons.includes(l.id)).length,
    locked: !!m.locked,
  }));

  // Find recommended next lesson
  // We go through Level 1 lessons first
  const nextLesson = activeModule.lessons.find(l => !stats.completedLessons.includes(l.id)) || activeModule.lessons[0];

  // Helper to map actual module lessons to custom screenshot labels beautifully
  const getLessonDisplayDetails = (lessonId: string, originalTitle: string, originalDuration: string, index: number) => {
    if (lessonId === "l1") {
      return {
        title: "How AI Trainers Get Paid to Improve AI",
        duration: "15m",
        numStr: "01"
      };
    }
    if (lessonId === "l2") {
      return {
        title: "AI Learning Fundamentals",
        duration: "25m",
        numStr: "02"
      };
    }
    if (lessonId === "l3") {
      return {
        title: "Post-Submission Lifecycle",
        duration: "15m",
        numStr: "03"
      };
    }
    if (lessonId === "l4") {
      return {
        title: "Advanced Hallucination Detection",
        duration: "40m",
        numStr: "04"
      };
    }
    return {
      title: originalTitle,
      duration: originalDuration.replace(" min", "m"),
      numStr: String(index + 1).padStart(2, "0")
    };
  };

  // Determine resume lesson display title and descriptions to match screenshot perfectly
  const resumeLessonDisplayTitle = nextLesson.id === "l2" ? "Lesson 2: AI Learning" : `Lesson ${activeModule.lessons.indexOf(nextLesson) + 1}: ${nextLesson.title}`;
  const resumeLessonDescription = nextLesson.id === "l2"
    ? "Master the core mechanics of artificial intelligence training, Reinforcement Learning from Human Feedback (RLHF)."
    : nextLesson.description || "In-depth training modules designed to prep you for the qualification exams.";

  // Determine subsequent lesson for "Next: ..." preview text
  const nextIndex = activeModule.lessons.indexOf(nextLesson);
  const subsequentLesson = activeModule.lessons[nextIndex + 1];
  const subsequentText = nextLesson.id === "l2"
    ? "Next: Post-Submission (15 min)"
    : subsequentLesson 
      ? `Next: ${subsequentLesson.title} (${subsequentLesson.duration})`
      : "Next: Qualification Exam";

  return (
    <div id="dashboard-view" className="space-y-6 animate-fade-in pl-1">

      {/* Admin-controlled cohort/announcement banner — only renders when
          an admin has one turned on in /admin/announcement. */}
      {announcement && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm py-3 px-4 sm:px-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 shadow-sm font-bold text-center">
          <Megaphone className="w-4 h-4 shrink-0" />
          <span>{announcement.message}</span>
          {announcement.linkUrl && (
            <a
              href={announcement.linkUrl}
              className="underline underline-offset-2 hover:no-underline font-black shrink-0"
            >
              {announcement.linkLabel || "Learn More"} &rarr;
            </a>
          )}
        </div>
      )}

      {/* 1. Minimalist Welcoming Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Here is your training progress for today.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("readiness")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5" />
            Readiness Scores
          </button>
        </div>
      </div>

      {/* 2. Dual Metrics Grid Rows */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Metric Card 1: Overall Progress */}
        <div className="bg-white dark:bg-slate-900 border border-[#DCE4FF] dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex flex-col justify-center relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F2F5FF] dark:bg-indigo-950/30 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none mb-1">
                  Overall Progress
                </span>
                <span className="text-lg font-extrabold text-[#4F46E5] dark:text-indigo-400 block leading-none">
                  {overallProgressPercent}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-450 dark:text-slate-400 block font-medium">
                {completedCount}/{totalLessons} Lessons
              </span>
            </div>
          </div>

          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#4F46E5] dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metric Card 2: Readiness Score */}
        <button
          onClick={() => setActiveTab("readiness")}
          className="text-left bg-white dark:bg-slate-900 border border-[#DCE4FF] dark:border-slate-800 rounded-xl p-3.5 shadow-xs hover:shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-center relative cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F2F5FF] dark:bg-indigo-950/30 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none mb-1">
                  Readiness Score
                </span>
                <span className="text-lg font-extrabold text-[#4F46E5] dark:text-indigo-400 block leading-none">
                  {overallReadiness}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-450 dark:text-slate-400 block font-medium">
                Avg. across 8 skills
              </span>
            </div>
          </div>

          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#4F46E5] dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallReadiness}%` }}
              ></div>
            </div>
          </div>
        </button>

      </div>

      {/* 3. Resume Learning + Report a Win, side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <div className="bg-[#F2F5FF] dark:bg-slate-900/60 border border-[#DCE4FF] dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        
        {/* Subtle Decorative gears in the background */}
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none overflow-hidden flex items-center justify-center">
          <svg className="w-24 h-24 text-slate-900 dark:text-white fill-current animate-spin" style={{ animationDuration: "20s" }} viewBox="0 0 24 24">
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
          </svg>
        </div>

        <div className="space-y-3 relative z-10">
          <span className="inline-flex items-center bg-[#E5ECFF] text-[#3F51B5] dark:bg-indigo-950 dark:text-indigo-300 text-[10px] uppercase font-extrabold px-3 py-1 rounded-full tracking-wider leading-none">
            Resume Learning
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {resumeLessonDisplayTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            {resumeLessonDescription}
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-center self-start sm:self-center shrink-0 relative z-10 mt-2 sm:mt-0">
          <button 
            onClick={() => startLesson(nextLesson.id)}
            className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold py-3 px-6 rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Continue</span>
          </button>
          <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold mt-2.5">
            {subsequentText}
          </p>
        </div>
      </div>

      <CareerWinReporter />
      </div>

      {/* 4. Modules Overview Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Modules
          </h2>
          <button
            onClick={() => {
              setActivePartId?.(null);
              setActiveTab("modules");
            }}
            className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:underline cursor-pointer transition-colors"
          >
            Expand Curriculum
          </button>
        </div>

        <hr className="border-slate-100 dark:border-slate-850 my-4" />

        {/* Module Card Grid — matches the Learn tab's card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((card) => {
            const progressPercent = card.lessonsCount > 0
              ? Math.min(100, Math.round((card.completedCount / card.lessonsCount) * 100))
              : 0;

            return (
              <div
                key={card.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                  card.locked
                    ? "opacity-75 border-slate-200 dark:border-slate-850"
                    : "border-slate-200 dark:border-slate-850 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm"
                }`}
              >
                {card.locked && (
                  <div className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                    <Lock className="w-3 h-3" /> Locked
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight pr-16">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-405 font-mono">
                    <BookOpen className="w-3 h-3 text-indigo-500" />
                    <span>{card.lessonsCount} Lessons</span>
                  </div>
                </div>

                {!card.locked && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-450 dark:text-slate-500 font-semibold">
                        Progress
                      </span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (card.locked) {
                      setActiveTab("membership");
                      return;
                    }
                    setActivePartId?.(card.id);
                    setActiveTab("modules");
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    card.locked
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  {card.locked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Upgrade to Unlock</span>
                    </>
                  ) : (
                    <span>View Track Lessons</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
