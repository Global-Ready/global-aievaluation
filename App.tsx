"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  Trophy,
  TrendingUp,
  User,
  Zap,
  Play,
  ArrowRight,
  ShieldAlert,
  ListChecks,
  Flame,
  CornerDownRight,
  AlertTriangle,
  Menu,
  X,
  Moon,
  Sun,
  Briefcase,
  Sparkles,
  BookCheck,
  ArrowLeft,
  Settings,
  LayoutGrid,
  Lock,
  MessageSquare,
  Shield,
  Wrench,
  Tags,
  ChevronDown,
  ChevronUp,
  Gift,
} from "lucide-react";

import { UserStats, Rank, Module, Lesson, PracticeTaskSubmission, Testimonial, SiteAnnouncement } from "./types";
import type { JobOpportunity } from "./data/jobs";
import { syncUserProgress } from "./lib/actions/user-progress";
import { syncMyPurchases, type LatestPurchase } from "./lib/actions/billing";
import { LESSON_SKILL_BOOSTS } from "./data/skill-boosts";
import {
  isModuleAccessible,
  isPaidTier,
  isSimulationPracticeAccessible,
  TEMP_DISABLE_ALL_PAYMENT_GATES,
} from "./lib/access";

// Subcomponents
import DashboardView from "./components/DashboardView";
import LessonView from "./components/LessonView";
import PracticeTaskRunner from "./components/PracticeTaskRunner";
import ReadinessView from "./components/ReadinessView";
import AffiliateView from "./components/AffiliateView";
import ProfileView from "./components/ProfileView";
import JobsView from "./components/JobsView";
import { renderFormattedText } from "./components/LessonContentRenderer";
import InterviewSimulator from "./components/InterviewSimulator";
import Part2IntroView from "./components/Part2IntroView";
import Part2IntroLessonView from "./components/Part2IntroLessonView";
import Part2Lesson1View from "./components/Part2Lesson1View";
import Part2Lesson2View from "./components/Part2Lesson2View";
import Part2Lesson3View from "./components/Part2Lesson3View";
import Part2Lesson4View from "./components/Part2Lesson4View";
import Part2Lesson5View from "./components/Part2Lesson5View";
import Part2Lesson6View from "./components/Part2Lesson6View";
import Part2Lesson7View from "./components/Part2Lesson7View";
import MembershipView from "./components/MembershipView";
import AcceleratorHubView from "./components/AcceleratorHubView";
import RealWorldPracticeOverview from "./components/RealWorldPracticeOverview";
import WelcomeView, { type WelcomeSyncStatus } from "./components/WelcomeView";
import PracticeLevelModal from "./components/PracticeLevelModal";
import { PRACTICE_DOMAINS, getPracticeDomainLabel, type PracticeDomainId } from "./lib/practice-domains";

function applySkillBoosts(
  skills: UserStats["skills"],
  boosts: Partial<UserStats["skills"]>,
): UserStats["skills"] {
  const updated = { ...skills };
  (Object.keys(boosts) as (keyof UserStats["skills"])[]).forEach((key) => {
    const boost = boosts[key];
    if (typeof boost === "number") {
      updated[key] = Math.min(100, updated[key] + boost);
    }
  });
  return updated;
}

// When a user launches the AI Interview Simulator directly from a job
// listing, we skip the domain-picker step and pre-select the domain that
// best matches that job's field, so the interview is tailored to the job
// they're actually going for. Ids match the AI Interview Simulator's own
// domain list (components/InterviewSimulator.tsx ROLES), which mirrors
// Real World Practice's domains (lib/practice-domains.ts).
function mapJobFieldToInterviewDomainId(field: string): string {
  switch (field) {
    case "AI Safety":
      return "cybersecurity";
    case "Coding & SWE":
      return "coding_engineering";
    case "Medical & Bio":
      return "medicine";
    case "Consulting":
      return "finance_accounting";
    default:
      return "generalist";
  }
}

const MODULE_CARD_DESCRIPTION_WORD_LIMIT = 35;

// Truncates on a word boundary so cards in the same grid row settle at a
// consistent height instead of stretching to whatever the longest module
// description happens to be.
function truncateDescription(
  text: string,
  maxWords: number = MODULE_CARD_DESCRIPTION_WORD_LIMIT,
): { truncated: string; isTruncated: boolean } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return { truncated: text, isTruncated: false };
  }
  return { truncated: words.slice(0, maxWords).join(" ") + "…", isTruncated: true };
}

interface AppProps {
  userId: string;
  moduleCurriculum: Module[];
  jobs: JobOpportunity[];
  initialStats: UserStats;
  isAdmin: boolean;
  testimonials: Testimonial[];
  announcement?: SiteAnnouncement | null;
}

export default function App({
  userId,
  moduleCurriculum,
  jobs,
  initialStats,
  isAdmin,
  testimonials,
  announcement,
}: AppProps) {
  const practiceTabs = ["practice_overview", "practice_run"];
  // Restore the last section the user was on so a refresh doesn't always
  // bounce back to the dashboard.
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === "undefined") return "dashboard";
    return localStorage.getItem("ae-academy-active-tab") ?? "dashboard";
  });
  const [practiceGroupOpen, setPracticeGroupOpen] = useState(false);
  // Restored the same way as activeTab, but only if the saved id still
  // refers to something in the curriculum the server just sent down —
  // guards against a stale id from before content changed (or a locked
  // module) leaving the page stuck on blank content after a refresh.
  const [activeLessonId, setActiveLessonId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("ae-academy-active-lesson-id");
    if (!saved) return null;
    const exists = moduleCurriculum.some((m) => m.lessons.some((l) => l.id === saved));
    return exists ? saved : null;
  });
  const [activeModuleId, setActiveModuleId] = useState<string>("m1");
  const [activePartId, setActivePartId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("ae-academy-active-part-id");
    if (!saved) return null;
    const exists = moduleCurriculum.some((m) => m.id === saved);
    return exists ? saved : null;
  });
  const [expandedModuleCardIds, setExpandedModuleCardIds] = useState<Set<string>>(new Set());
  const [interviewInitialRoleId, setInterviewInitialRoleId] = useState<string | null>(null);
  const [interviewJobTitle, setInterviewJobTitle] = useState<string | null>(null);

  // Real World Practice: which domain is highlighted/active in the sidebar
  // (used both while the level modal is open and during an active run),
  // whether the level-selection modal is open, and the domain/level of the
  // practice run currently in progress. Domain/level are restored on
  // refresh the same way activeTab is, so a mid-run reload doesn't bounce
  // the user back to the overview page.
  const [selectedPracticeDomain, setSelectedPracticeDomain] = useState<PracticeDomainId | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem("ae-academy-practice-domain") as PracticeDomainId | null) ?? null;
  });
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [practiceLevel, setPracticeLevel] = useState<"beginner" | "intermediate" | "expert" | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem("ae-academy-practice-level") as "beginner" | "intermediate" | "expert" | null) ?? null;
  });

  const activeModule = useMemo(() => {
    return (
      moduleCurriculum.find((m) => m.id === activeModuleId) ||
      moduleCurriculum[0]
    );
  }, [activeModuleId, moduleCurriculum]);

  const activeModuleDuration = useMemo(() => {
    let totalMin = 0;
    activeModule.lessons.forEach((l) => {
      const mins = parseInt(l.duration, 10);
      if (!isNaN(mins)) {
        totalMin += mins;
      }
    });
    if (totalMin >= 60) {
      const hrs = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      if (mins > 0) {
        return `${hrs} Hour${hrs > 1 ? "s" : ""} ${mins} Minutes expected`;
      }
      return `${hrs} Hour${hrs > 1 ? "s" : ""} expected`;
    }
    return `${totalMin} Minutes expected`;
  }, [activeModule]);

  // Responsive drawer toggle state for mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Sync with system preferences default or manual toggle
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("ae-academy-theme");
    return saved === "dark";
  });

  // Master local persistence state
  const [stats, setStats] = useState<UserStats>(initialStats);

  // Lock bypass option for review testing
  const [bypassLocks, setBypassLocks] = useState(false);

  // Keep the sidebar's collapsible Practice group expanded whenever one of
  // its sub-tabs is active, even if it was reached by a route other than
  // clicking the group itself.
  useEffect(() => {
    if (practiceTabs.includes(activeTab)) setPracticeGroupOpen(true);
  }, [activeTab]);

  // Persist the active tab so a browser refresh reopens the same section.
  useEffect(() => {
    localStorage.setItem("ae-academy-active-tab", activeTab);
  }, [activeTab]);

  // Same for lesson/module position, so a refresh mid-lesson or mid-module
  // lands back exactly where the user was rather than the module list.
  useEffect(() => {
    if (activeLessonId) localStorage.setItem("ae-academy-active-lesson-id", activeLessonId);
    else localStorage.removeItem("ae-academy-active-lesson-id");
  }, [activeLessonId]);

  useEffect(() => {
    if (activePartId) localStorage.setItem("ae-academy-active-part-id", activePartId);
    else localStorage.removeItem("ae-academy-active-part-id");
  }, [activePartId]);

  useEffect(() => {
    if (selectedPracticeDomain) localStorage.setItem("ae-academy-practice-domain", selectedPracticeDomain);
    else localStorage.removeItem("ae-academy-practice-domain");
  }, [selectedPracticeDomain]);

  useEffect(() => {
    if (practiceLevel) localStorage.setItem("ae-academy-practice-level", practiceLevel);
    else localStorage.removeItem("ae-academy-practice-level");
  }, [practiceLevel]);

  // Apply dark class to body
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("ae-academy-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("ae-academy-theme", "light");
    }
  }, [isDarkMode]);

  // Persist progress/profile updates to Supabase automatically
  useEffect(() => {
    syncUserProgress(stats).catch((err) => {
      console.error("Failed to sync progress", err);
    });
  }, [stats]);

  // After redirecting back from Stripe Checkout/Billing Portal, land on the
  // Membership tab and surface the result instead of the default dashboard.
  // A successful payment instead lands on a dedicated Welcome page (below).
  const [checkoutResult, setCheckoutResult] = useState<"cancelled" | null>(null);
  const [welcomeSyncStatus, setWelcomeSyncStatus] = useState<WelcomeSyncStatus>("syncing");
  const [welcomeLatestPurchase, setWelcomeLatestPurchase] = useState<LatestPurchase | null>(null);

  const runWelcomeSync = () => {
    setWelcomeSyncStatus("syncing");
    syncMyPurchases()
      .then(({ membershipTier, latestPurchase }) => {
        setStats((prev) => ({ ...prev, membershipTier }));
        setWelcomeLatestPurchase(latestPurchase);
        // A free-tier user can validly buy only a credit pack or coaching
        // session (neither changes membershipTier), so "ready" has to be
        // "we found a purchase on file", not "the tier changed".
        setWelcomeSyncStatus(latestPurchase ? "ready" : "error");
      })
      .catch((err) => {
        console.error("syncMyPurchases failed:", err);
        setWelcomeSyncStatus("error");
      });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout) {
      if (checkout === "success") {
        setActiveTab("welcome");
        runWelcomeSync();
      } else if (checkout === "cancelled") {
        setActiveTab("membership");
        setCheckoutResult("cancelled");
      } else {
        setActiveTab("membership");
      }
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically compute average readiness score index
  const overallReadinessScore = useMemo(() => {
    const values = Object.values(stats.skills) as number[];
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.round(avg);
  }, [stats.skills]);

  // Dynamically compute Rank based on completed metrics
  const activeRank = useMemo(() => {
    const completedLessonsCount = stats.completedLessons.length;
    const hasPassedExam = stats.passedExams.length > 0;
    const hasFinishedSim = stats.completedSimulations.length > 0;

    if (completedLessonsCount >= 5 && hasPassedExam && hasFinishedSim) {
      return "Senior Aligned Specialist";
    }
    if (completedLessonsCount >= 5 && hasPassedExam) {
      return "Junior Evaluator Practitioner";
    }
    if (hasPassedExam) {
      return "Certified Candidate";
    }
    if (completedLessonsCount >= 3) {
      return "Apprentice Annotator";
    }
    return "Trainee Evaluator";
  }, [stats.completedLessons, stats.passedExams, stats.completedSimulations]);

  // Is this lesson's home module locked for the user's current tier? Real
  // DB-module lessons check their module's server-computed `locked` flag;
  // the legacy "Part 2" lessons aren't in moduleCurriculum at all, so they're
  // gated as if they sat right after every real module (see the "modules"
  // tab render below for the matching card-grid logic).
  const isLessonLocked = (lessonId: string): boolean => {
    const owningModule = moduleCurriculum.find((m) =>
      m.lessons.some((l) => l.id === lessonId),
    );
    if (owningModule) return !!owningModule.locked;
    return !isModuleAccessible(stats.membershipTier, moduleCurriculum.length);
  };

  // Handle Lesson selection trigger
  const handleStartLesson = (lessonId: string) => {
    if (isLessonLocked(lessonId)) {
      setActiveTab("membership");
      setActiveLessonId(null);
      setMobileMenuOpen(false);
      return;
    }
    setActiveLessonId(lessonId);
    setMobileMenuOpen(false);
  };

  const handleLessonBack = () => {
    setActiveLessonId(null);
  };

  // Complete a Lesson: awards XP, increases skills score organically, sets completion flags
  const handleLessonComplete = (
    quizScore: number,
    practiceMeta: Record<string, any>,
    nextLessonId?: string,
  ) => {
    if (!activeLessonId) return;

    const activeLesson = moduleCurriculum
      .flatMap((m) => m.lessons)
      .find((l) => l.id === activeLessonId);
    // Part 2 lessons (p2_intro, p2_m1_l1..l7) are hardcoded standalone
    // components, not rows in the lessons table, so they never match
    // activeLesson above — fall back to the static transcription for them.
    const lessonSkillBoosts =
      activeLesson?.skillBoosts ?? LESSON_SKILL_BOOSTS[activeLessonId] ?? {};

    setStats((prev) => {
      const isAlreadyCompleted = prev.completedLessons.includes(activeLessonId);
      const newCompleted = isAlreadyCompleted
        ? prev.completedLessons
        : [...prev.completedLessons, activeLessonId];

      // Dynamic skill upgrade offsets based on quiz completion grade
      const xpEarned = isAlreadyCompleted ? 20 : 120; // smaller bonus for review repetition
      const updatedSkills = isAlreadyCompleted
        ? prev.skills
        : applySkillBoosts(prev.skills, lessonSkillBoosts);

      // Increment active streak count by 1 on completion
      const newStreak = isAlreadyCompleted
        ? prev.streakCount
        : prev.streakCount + 1;

      return {
        ...prev,
        completedLessons: newCompleted,
        xp: prev.xp + xpEarned,
        skills: updatedSkills,
        streakCount: newStreak,
        practiceSubmissions: {
          ...prev.practiceSubmissions,
          ...practiceMeta,
        },
        lastActiveDate: new Date().toISOString(),
      };
    });

    // Take user back to dashboard or modules view on complete
    if (nextLessonId) {
      setActiveLessonId(nextLessonId);
    } else {
      setActiveLessonId(null);
      setActiveTab("dashboard");
    }
    alert(
      "🎉 Master Syllabus Lesson Cleared! +120 XP Credential Points and skill metrics expanded!",
    );
  };

  // Handlers for completing higher level Simulations and Exam Qualifications
  const handleSimulationComplete = (
    score: number,
    strengths: string[],
    weaknesses: string[],
  ) => {
    setStats((prev) => {
      const simId =
        activeModuleId === "m2"
          ? "sim_m2_qual"
          : activeModuleId === "m3"
            ? "sim_m3_qual"
            : activeModuleId === "m4"
              ? "sim_m4_qual"
              : "sim_workspace_foundations";
      const isAlreadyCompleted = prev.completedSimulations.includes(simId);
      const newSim = isAlreadyCompleted
        ? prev.completedSimulations
        : [...prev.completedSimulations, simId];

      const newSkills =
        !isAlreadyCompleted && score >= 70
          ? applySkillBoosts(prev.skills, activeModule.simSkillBoosts ?? {})
          : prev.skills;

      return {
        ...prev,
        completedSimulations: newSim,
        xp: prev.xp + (isAlreadyCompleted ? 50 : 300),
        skills: newSkills,
        lastActiveDate: new Date().toISOString(),
      };
    });

    setActiveTab("dashboard");
    alert(
      `🎯 Simulated Workspace Finished with Accuracy of ${score}%! Vetted transcript loaded into readiness center.`,
    );
  };

  const handlePracticeTaskSubmit = (
    taskId: string,
    submission: PracticeTaskSubmission,
  ) => {
    setStats((prev) => {
      const isFirstTime = !prev.practiceTaskSubmissions?.[taskId];
      return {
        ...prev,
        practiceTaskSubmissions: {
          ...(prev.practiceTaskSubmissions ?? {}),
          [taskId]: submission,
        },
        xp: prev.xp + (isFirstTime ? 40 : 5),
        skills: isFirstTime
          ? { ...prev.skills, annotation: Math.min(100, prev.skills.annotation + 4) }
          : prev.skills,
        lastActiveDate: new Date().toISOString(),
      };
    });
  };

  // Real World Practice pools tasks across every module rather than gating
  // per-module progress — access is gated by paid tier plus, within that,
  // finishing every task in the previous difficulty level first, scoped
  // per domain (finishing Beginner in Cybersecurity only unlocks
  // Intermediate in Cybersecurity, not in every other domain).
  const allPracticeTasks = useMemo(
    () => moduleCurriculum.flatMap((m) => m.practiceTasks ?? []),
    [moduleCurriculum],
  );

  const isPracticeLevelComplete = (
    domain: PracticeDomainId,
    level: "beginner" | "intermediate" | "expert",
  ) => {
    const levelTasks = allPracticeTasks.filter((t) => t.domain === domain && t.difficulty === level);
    // An empty level (no tasks published yet) can't block the next one.
    if (levelTasks.length === 0) return true;
    return levelTasks.every((t) => !!stats.practiceTaskSubmissions?.[t.id]);
  };

  const isDomainLevelUnlocked = (
    domain: PracticeDomainId,
    level: "beginner" | "intermediate" | "expert",
  ) => {
    if (level === "beginner") return true;
    if (level === "intermediate") return isPracticeLevelComplete(domain, "beginner");
    return isPracticeLevelComplete(domain, "beginner") && isPracticeLevelComplete(domain, "intermediate");
  };

  const getAvatarConfig = (avatarId?: string) => {
    const PRESET_AVATARS = [
      {
        id: "avatar-1",
        label: "Quantum Purple",
        bg: "from-purple-500 to-indigo-600",
        initial: "QP",
      },
      {
        id: "avatar-2",
        label: "Neon Cyberpunk",
        bg: "from-pink-500 to-rose-600",
        initial: "NC",
      },
      {
        id: "avatar-3",
        label: "Emerald Analyst",
        bg: "from-emerald-400 to-teal-600",
        initial: "EA",
      },
      {
        id: "avatar-4",
        label: "Oceanic SFT Expert",
        bg: "from-cyan-400 to-blue-600",
        initial: "OS",
      },
      {
        id: "avatar-5",
        label: "Golden Aligner",
        bg: "from-amber-400 to-orange-600",
        initial: "GA",
      },
      {
        id: "avatar-6",
        label: "Zenith Slate",
        bg: "from-slate-700 to-slate-900",
        initial: "ZS",
      },
    ];
    return PRESET_AVATARS.find((a) => a.id === avatarId) || PRESET_AVATARS[0];
  };

  const activeAvatar = getAvatarConfig(stats.avatarUrl);

  useEffect(() => {
    if (stats.settings?.pacingMode === "speedrun") {
      setBypassLocks(true);
    } else if (stats.settings?.pacingMode === "standard") {
      setBypassLocks(false);
    }
  }, [stats.settings?.pacingMode]);

  return (
    <div
      id="app-root-container"
      className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex transition-all duration-300"
    >
      {/* ================= SIDEBAR MODULE (PERSISTENT ON DESKTOP) ================= */}
      <aside
        id="sidebar-navigation"
        className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 fixed lg:static h-dvh lg:h-screen z-50 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div
          id="sidebar-top-section"
          className="flex-1 min-h-0 p-5 space-y-6 overflow-y-auto"
        >
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/images/logos/global-logo.png"
                alt="Global Ready AIEval"
                width={22}
                height={22}
                className="shrink-0"
              />
              <span className="text-lg font-extrabold text-[#3B28CC] dark:text-indigo-400 tracking-tight flex items-center">
                Global Ready AIEval
              </span>
            </div>
            {/* Close Mobile sidebar */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation links */}
          <nav className="space-y-1">
            <button
              id="tab-btn-dashboard"
              onClick={() => {
                setActiveTab("dashboard");
                setActiveLessonId(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === "dashboard" && !activeLessonId
                  ? "bg-[#4F46E5] text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              AI Career Hub
            </button>

            <button
              id="tab-btn-modules"
              onClick={() => {
                setActiveTab("modules");
                setActivePartId(null);
                setActiveLessonId(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === "modules" || activeLessonId !== null
                  ? "bg-[#4F46E5] text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-indigo-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Learn
            </button>

            {/* Real World Practice group: collapsible parent. Free users can
                still open it and preview content — the paywall shows up
                when they try to actually start/answer, not on navigation. */}
            <button
              id="tab-btn-practice-group"
              onClick={() => {
                setPracticeGroupOpen((v) => !v);
                setActiveTab("practice_overview");
                setActiveLessonId(null);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                practiceTabs.includes(activeTab)
                  ? "text-indigo-650 dark:text-indigo-400"
                  : "text-slate-600 hover:text-indigo-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4" />
                Real World Practice
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!isSimulationPracticeAccessible(stats.membershipTier) && (
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                )}
                {practiceGroupOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {practiceGroupOpen && (
              <div className="pl-3 space-y-1 border-l-2 border-slate-100 dark:border-slate-850 ml-4">
                {PRACTICE_DOMAINS.map((domain) => (
                  <button
                    key={domain.id}
                    id={`tab-btn-practice-domain-${domain.id}`}
                    disabled={domain.comingSoon}
                    onClick={() => {
                      if (domain.comingSoon) return;
                      setSelectedPracticeDomain(domain.id);
                      setActiveTab("practice_overview");
                      setActiveLessonId(null);
                      setPracticeModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      domain.comingSoon
                        ? "text-slate-350 dark:text-slate-600 cursor-not-allowed opacity-60"
                        : selectedPracticeDomain === domain.id
                          ? "bg-[#4F46E5] text-white shadow-sm font-bold cursor-pointer"
                          : "text-slate-600 hover:text-indigo-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 cursor-pointer"
                    }`}
                  >
                    <span>{domain.label}</span>
                    {domain.comingSoon ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                        Soon
                      </span>
                    ) : (
                      !isSimulationPracticeAccessible(stats.membershipTier) && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      )
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              id="tab-btn-interview"
              onClick={() => {
                setInterviewInitialRoleId(null);
                setInterviewJobTitle(null);
                setActiveTab("interview");
                setActiveLessonId(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === "interview"
                  ? "bg-[#4F46E5] text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-indigo-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-indigo-500 dark:text-indigo-455" />
                AI Interview Simulator
              </div>
              {!isPaidTier(stats.membershipTier) && (
                <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              )}
            </button>

            <button
              id="tab-btn-jobs"
              onClick={() => {
                setActiveTab("jobs");
                setActiveLessonId(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === "jobs"
                  ? "bg-[#4F46E5] text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-indigo-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 shrink-0" />
                Explore Opportunities
              </div>
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                Jobs
              </span>
            </button>

            <button
              id="tab-btn-membership"
              onClick={() => {
                setActiveTab("membership");
                setActiveLessonId(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === "membership"
                  ? "bg-[#4F46E5] text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-indigo-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                Membership Tiers
              </div>
              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Upgrade
              </span>
            </button>

            {!isAdmin && stats.membershipTier === "career_accelerator" && (
              <button
                id="tab-btn-affiliate"
                onClick={() => {
                  setActiveTab("affiliate");
                  setActiveLessonId(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === "affiliate"
                    ? "bg-[#4F46E5] text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-indigo-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
                }`}
              >
                <Gift className={`w-4 h-4 shrink-0 ${activeTab === "affiliate" ? "text-white" : "text-indigo-500"}`} />
                Become an Affiliate
              </button>
            )}

          </nav>
        </div>

        {/* Profile details at bottom of Sidebar */}
        <div
          id="sidebar-bottom-block"
          className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0"
        >
          {isAdmin && (
            <Link
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer text-slate-650 hover:text-indigo-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
            >
              <Wrench className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}

          {/* Relocated Notification Button */}
          <button
            id="sidebar-notifications-btn"
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer text-slate-650 hover:text-indigo-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
            title="Notifications"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span>Alerts & Notifications</span>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
          </button>

          <div
            onClick={() => {
              setActiveTab("profile");
              setActiveLessonId(null);
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
              {stats.avatarUrl && /^https?:\/\//.test(stats.avatarUrl) ? (
                <img
                  src={stats.avatarUrl}
                  alt="Profile photo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-tr ${activeAvatar.bg} flex items-center justify-center text-white text-xs font-black`}
                >
                  {activeAvatar.initial}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-white truncate">
                {stats.displayName || "Alex Johnson"}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
                {activeRank}
              </p>
              {/* Membership Tier badge */}
              <div className="mt-1.5 flex">
                {stats.membershipTier === "career_accelerator" ? (
                  <span className="bg-amber-100 dark:bg-amber-950/45 text-amber-700 dark:text-amber-450 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <Award className="w-2.5 h-2.5 text-amber-500 shrink-0" />{" "}
                    Accelerator
                  </span>
                ) : stats.membershipTier === "professional" ? (
                  <span className="bg-indigo-100 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-indigo-500 shrink-0" />{" "}
                    Professional
                  </span>
                ) : stats.membershipTier === "starter" ? (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-slate-400 shrink-0" />{" "}
                    Starter
                  </span>
                ) : (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <Gift className="w-2.5 h-2.5 text-slate-400 shrink-0" />{" "}
                    Free
                  </span>
                )}
              </div>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 hover:text-slate-705 dark:hover:text-slate-300 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Screen masking overlay for responsive mobile sidebar drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        ></div>
      )}

      {/* ================= PRIMARY MASTER LAYOUT BLOCK ================= */}
      <main
        id="primary-content-scroller"
        className="flex-1 flex flex-col min-w-0 overflow-y-auto"
      >
        {/* ================= MAIN TOP STATUS CONTROLLER BAR ================= */}
        <header
          id="overall-app-header"
          className="bg-white dark:bg-slate-900 border-b border-indigo-50/50 dark:border-slate-850 h-16 shrink-0 sticky top-0 z-30 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            {/* Hamburger trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeLessonId
                  ? "Theoretical Lesson & Workspace"
                  : activeTab === "dashboard"
                    ? "AI Career Hub"
                    : activeTab === "modules"
                      ? "Learning Syllabus"
                      : activeTab === "practice_overview"
                        ? "Real World Practice"
                        : activeTab === "practice_run"
                          ? `${getPracticeDomainLabel(selectedPracticeDomain ?? "generalist")} / ${
                              practiceLevel === "beginner"
                                ? "Beginner"
                                : practiceLevel === "intermediate"
                                  ? "Intermediate"
                                  : "Expert"
                            } Practice`
                          : activeTab === "welcome"
                          ? "Welcome"
                          : activeTab === "interview"
                          ? "AI Interview Simulator"
                          : activeTab === "membership"
                            ? "Membership Tiers"
                            : activeTab === "accelerator"
                              ? "Career Accelerator Hub"
                              : activeTab === "readiness"
                                ? "Readiness Scores"
                                : activeTab === "affiliate"
                                  ? "Affiliate Program"
                                : activeTab === "jobs"
                                    ? "Explore Opportunities"
                                    : activeTab === "profile"
                                      ? "Account Settings"
                                      : "Global Ready AIEval"}
              </h1>
            </div>
          </div>

          {/* Clean right header - notifications relocated to bottom-left sidebar */}
          <div className="flex items-center gap-3.5"></div>
        </header>

        {/* ================= PRIMARY MASTER RENDERING PANEL ================= */}
        <div
          id="scrollable-content-canvas"
          className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6"
        >
          {/* Active Lesson Frame */}
          {activeLessonId !== null ? (
            (() => {
              // INTERCEPT LOCKED LESSONS FOR FREE TIER
              if (
                !TEMP_DISABLE_ALL_PAYMENT_GATES &&
                stats.membershipTier === "free" &&
                activeLessonId !== "l1" &&
                activeLessonId !== "p2_intro" &&
                activeLessonId !== "p2_m1_l1"
              ) {
                let lockedLessonTitle = "Advanced Class";
                let lockedLessonDesc =
                  "This professional lesson contains advanced curriculum content, interactive practice exercises, and scoring parameters.";

                if (activeLessonId.startsWith("p2_")) {
                  if (activeLessonId === "p2_m1_l2") {
                    lockedLessonTitle =
                      "Part 2, Lesson 2: Instruction Following Evaluation";
                    lockedLessonDesc =
                      "Master the absolute highest-priority metric: evaluating explicit and implicit constraints across 5 real-world case studies.";
                  } else if (activeLessonId === "p2_m1_l3") {
                    lockedLessonTitle =
                      "Part 2, Lesson 3: Accuracy & Factuality Evaluation";
                    lockedLessonDesc =
                      "Master how professional AI evaluators identify factual errors, hallucinations, and unsupported claims across 5 complex case studies.";
                  } else if (activeLessonId === "p2_m1_l4") {
                    lockedLessonTitle =
                      "Part 2, Lesson 4: Completeness & Helpfulness Evaluation";
                    lockedLessonDesc =
                      "Distinguish between technically correct and genuinely useful responses under real-world domain assistance.";
                  } else if (activeLessonId === "p2_m1_l5") {
                    lockedLessonTitle =
                      "Part 2, Lesson 5: Clarity, Tone & Audience Alignment";
                    lockedLessonDesc =
                      "Evaluate whether an AI response is easy to understand, matches expected formatting, and speaks perfectly to the intended reader.";
                  } else if (activeLessonId === "p2_m1_l6") {
                    lockedLessonTitle =
                      "Part 2, Lesson 6: Context Tracking & IR Evaluation";
                    lockedLessonDesc =
                      "Check if an AI correctly references and retrieves information from previous conversations and filters out noise.";
                  } else if (activeLessonId === "p2_m1_l7") {
                    lockedLessonTitle =
                      "Part 2, Lesson 7: Response Ranking & Preference Evaluation";
                    lockedLessonDesc =
                      "Compare multiple outputs objectively, resolve close-tie decisions, and draft calibration-quality justifications.";
                  }
                } else {
                  const p1Lesson = moduleCurriculum[0].lessons.find(
                    (l) => l.id === activeLessonId,
                  );
                  if (p1Lesson) {
                    lockedLessonTitle = `Part 1, Lesson ${p1Lesson.id.replace("l", "")}: ${p1Lesson.title}`;
                    lockedLessonDesc =
                      p1Lesson.description ||
                      "Master core RLHF and instruction formatting skills with interactive case studies.";
                  }
                }

                return (
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center max-w-3xl mx-auto space-y-6 relative overflow-hidden my-6">
                    <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-50/15 dark:bg-indigo-950/10 rounded-full blur-2xl"></div>
                    <div className="inline-flex p-4.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                      <Lock className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
                        Free Tier Limit Reached
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {lockedLessonTitle}
                      </h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                      {lockedLessonDesc}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-850/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 max-w-xl mx-auto text-left space-y-3.5">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />{" "}
                        Starter Plan Unlocks (€20, one-time):
                      </h4>
                      <ul className="text-xs text-slate-600 dark:text-slate-350 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-indigo-500 font-bold">✓</span>
                          <span>
                            <strong>Full access to the AI Evaluation Academy</strong>{" "}
                            — every lesson, with interactive grading
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-indigo-500 font-bold">✓</span>
                          <span>
                            <strong>AI Interview Simulator</strong> — 10 sessions
                            included
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-indigo-500 font-bold">✓</span>
                          <span>
                            Unlimited practice exercises &amp; progress tracking
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                      <button
                        onClick={() => {
                          setActiveTab("membership");
                          setActiveLessonId(null);
                        }}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                        Get Starter (€20 one-time)
                      </button>
                      <button
                        onClick={handleLessonBack}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Back to Syllabus
                      </button>
                    </div>
                  </div>
                );
              }

              if (activeLessonId === "p2_intro") {
                return (
                  <Part2IntroLessonView
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(50, {}, "p2_m1_l1")}
                  />
                );
              }

              if (activeLessonId === "p2_m1_l1") {
                return (
                  <Part2Lesson1View
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(100, {}, "p2_m1_l2")}
                  />
                );
              }

              if (activeLessonId === "p2_m1_l2") {
                return (
                  <Part2Lesson2View
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(120, {}, "p2_m1_l3")}
                  />
                );
              }

              if (activeLessonId === "p2_m1_l3") {
                return (
                  <Part2Lesson3View
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(120, {}, "p2_m1_l4")}
                  />
                );
              }

              if (activeLessonId === "p2_m1_l4") {
                return (
                  <Part2Lesson4View
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(120, {}, "p2_m1_l5")}
                  />
                );
              }

              if (activeLessonId === "p2_m1_l5") {
                return (
                  <Part2Lesson5View
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(120, {}, "p2_m1_l6")}
                  />
                );
              }

              if (activeLessonId === "p2_m1_l6") {
                return (
                  <Part2Lesson6View
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(120, {}, "p2_m1_l7")}
                  />
                );
              }

              if (activeLessonId === "p2_m1_l7") {
                return (
                  <Part2Lesson7View
                    onBack={handleLessonBack}
                    onComplete={(xp) => handleLessonComplete(120, {})}
                  />
                );
              }

              const activeLesson = moduleCurriculum.flatMap(
                (m) => m.lessons,
              ).find((l) => l.id === activeLessonId);
              if (!activeLesson) return <p>Selected Lesson is missing.</p>;

              return (
                <LessonView
                  lesson={activeLesson}
                  stats={stats}
                  onBack={handleLessonBack}
                  onComplete={handleLessonComplete}
                />
              );
            })()
          ) : (
            /* RENDERS INDIVIDUAL MASTER PANEL SYSTEM */
            <>
              {activeTab === "dashboard" && (
                <DashboardView
                  stats={stats}
                  currentRank={activeRank as any}
                  overallReadiness={overallReadinessScore}
                  activeModule={activeModule}
                  moduleCurriculum={moduleCurriculum}
                  setActiveTab={setActiveTab}
                  startLesson={handleStartLesson}
                  activeModuleId={activeModuleId}
                  setActiveModuleId={setActiveModuleId}
                  setActivePartId={setActivePartId}
                  announcement={announcement}
                />
              )}

              {activeTab === "modules" &&
                (() => {
                  // The "Professional AI Evaluation Skills" (Part 2) card is
                  // intentionally not listed here — it was never real,
                  // admin-managed content, just leftover mock data. The
                  // activePartId === "p2" branch below is unreachable now
                  // that nothing sets it, and is left in place rather than
                  // torn out.
                  const cards = moduleCurriculum.map((m) => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    lessonsCount: m.lessons.length,
                    completedCount: m.lessons.filter((l) =>
                      stats.completedLessons.includes(l.id),
                    ).length,
                    locked: !!m.locked,
                  }));

                  if (activePartId === null) {
                    return (
                      <div className="space-y-6 animate-fade-in pl-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                              Modules
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Select a module to begin mastering
                              human-in-the-loop AI training and
                              qualifications.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab("dashboard")}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-905 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer self-start md:self-center"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to AI Career Hub
                          </button>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-850" />

                        {/* Module Card Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {cards.map((card) => {
                            const progressPercent =
                              card.lessonsCount > 0
                                ? Math.min(
                                    100,
                                    Math.round(
                                      (card.completedCount /
                                        card.lessonsCount) *
                                        100,
                                    ),
                                  )
                                : 0;

                            const isDescriptionExpanded =
                              expandedModuleCardIds.has(card.id);
                            const { truncated, isTruncated } =
                              truncateDescription(card.description);

                            return (
                              <div
                                key={card.id}
                                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6 transition-all relative overflow-hidden ${
                                  card.locked
                                    ? "opacity-75"
                                    : "hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"
                                }`}
                              >
                                {card.locked && (
                                  <div className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                                    <Lock className="w-3 h-3" /> Locked
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight pr-20">
                                    {card.title}
                                  </h3>

                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {renderFormattedText(
                                      isDescriptionExpanded
                                        ? card.description
                                        : truncated,
                                    )}
                                    {isTruncated && (
                                      <button
                                        onClick={() =>
                                          setExpandedModuleCardIds((prev) => {
                                            const next = new Set(prev);
                                            if (isDescriptionExpanded) {
                                              next.delete(card.id);
                                            } else {
                                              next.add(card.id);
                                            }
                                            return next;
                                          })
                                        }
                                        className="ml-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                      >
                                        {isDescriptionExpanded
                                          ? "Read less"
                                          : "Read more"}
                                      </button>
                                    )}
                                  </p>

                                  <div className="flex items-center gap-1 pt-1 text-[11px] text-slate-405 font-mono">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>{card.lessonsCount} Lessons</span>
                                  </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                  {!card.locked && (
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-450 dark:text-slate-500 font-semibold">
                                          Progress
                                        </span>
                                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                          {progressPercent}% (
                                          {card.completedCount}/
                                          {card.lessonsCount})
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                                          style={{
                                            width: `${progressPercent}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}

                                  {card.locked ? (
                                    <button
                                      onClick={() => setActiveTab("membership")}
                                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Upgrade to Unlock</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setActivePartId(card.id)}
                                      className="w-full py-3 px-4 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                                    >
                                      <span>View Track Lessons</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (activePartId === "p2") {
                    return (
                      <Part2IntroView
                        onBack={() => setActivePartId(null)}
                        onBegin={() => handleStartLesson("p2_m1_l1")}
                        completedLessons={stats.completedLessons}
                        onStartLesson={(lessonId) =>
                          handleStartLesson(lessonId)
                        }
                        membershipTier={stats.membershipTier}
                      />
                    );
                  }

                  // activePartId is a real module id — show its lesson list
                  const viewedModule =
                    moduleCurriculum.find((m) => m.id === activePartId) ??
                    activeModule;

                  return (
                    <div className="space-y-4 animate-fade-in pl-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <button
                          onClick={() => setActivePartId(null)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-905 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Modules
                        </button>
                      </div>
                      {/* Module header card */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {viewedModule.title}
                        </h2>
                        <p className="text-xs text-slate-450 mt-1">
                          {viewedModule.description}
                        </p>

                        <div className="mt-4 flex gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-405">Lessons: </span>
                            <span className="font-bold text-slate-850 dark:text-white">
                              {
                                viewedModule.lessons.filter((l) =>
                                  stats.completedLessons.includes(l.id),
                                ).length
                              }{" "}
                              / {viewedModule.lessons.length} complete
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complete syllabus lessons listed vertically */}
                      <div className="space-y-4">
                        {viewedModule.lessons.map((lesson, idx) => {
                          const completed = stats.completedLessons.includes(
                            lesson.id,
                          );
                          const isNextUnlocked =
                            TEMP_DISABLE_ALL_PAYMENT_GATES ||
                            idx === 0 ||
                            stats.completedLessons.includes(
                              viewedModule.lessons[idx - 1].id,
                            );
                          const isLock = !completed && !isNextUnlocked;

                          return (
                            <div
                              key={lesson.id}
                              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                isLock
                                  ? "opacity-60"
                                  : "hover:border-indigo-400 hover:scale-[1.002]"
                              }`}
                            >
                              <div className="flex gap-4 items-start min-w-0">
                                {completed ? (
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400 text-xs font-bold font-mono border shrink-0">
                                    {idx + 1}
                                  </div>
                                )}

                                <div className="space-y-1 min-w-0">
                                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {lesson.title}
                                    {completed && (
                                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        Passed
                                      </span>
                                    )}
                                  </h3>
                                  <p className="text-xs text-slate-500 leading-normal">
                                    {lesson.description}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                                    <span>Duration: {lesson.duration}</span>
                                    <span>&bull;</span>
                                    <span>
                                      {lesson.miniCaseStudies.length} Expert
                                      Case studies
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                                {completed ? (
                                  <button
                                    onClick={() => handleStartLesson(lesson.id)}
                                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                                  >
                                    Review Class Notes
                                  </button>
                                ) : isNextUnlocked || bypassLocks ? (
                                  <button
                                    onClick={() => handleStartLesson(lesson.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-white" />
                                    Start Active Lesson
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-350 dark:text-slate-650 flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5" />{" "}
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              {activeTab === "practice_overview" && <RealWorldPracticeOverview />}

              {activeTab === "practice_run" && selectedPracticeDomain && practiceLevel && (
                <PracticeTaskRunner
                  tasks={allPracticeTasks}
                  existingSubmissions={stats.practiceTaskSubmissions ?? {}}
                  onSubmit={handlePracticeTaskSubmit}
                  onBack={() => setActiveTab("practice_overview")}
                  isPaidUser={isSimulationPracticeAccessible(stats.membershipTier)}
                  onRequireUpgrade={() => setActiveTab("membership")}
                  domain={selectedPracticeDomain}
                  domainLabel={getPracticeDomainLabel(selectedPracticeDomain)}
                  filter={practiceLevel}
                  isUnlocked={isDomainLevelUnlocked(selectedPracticeDomain, practiceLevel)}
                  onAdvanceLevel={
                    practiceLevel === "beginner"
                      ? () => setPracticeLevel("intermediate")
                      : practiceLevel === "intermediate"
                        ? () => setPracticeLevel("expert")
                        : undefined
                  }
                />
              )}

              {practiceModalOpen && selectedPracticeDomain && (
                <PracticeLevelModal
                  domainLabel={getPracticeDomainLabel(selectedPracticeDomain)}
                  isLevelUnlocked={(level) => isDomainLevelUnlocked(selectedPracticeDomain, level)}
                  onClose={() => setPracticeModalOpen(false)}
                  onStart={(level) => {
                    setPracticeLevel(level);
                    setActiveTab("practice_run");
                    setPracticeModalOpen(false);
                  }}
                />
              )}

              {activeTab === "interview" && (
                <div className="space-y-4 max-w-5xl mx-auto pl-1 animate-fade-in">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer font-sans"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Career Hub
                  </button>
                  {!TEMP_DISABLE_ALL_PAYMENT_GATES &&
                  stats.membershipTier === "free" ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center max-w-3xl mx-auto space-y-6 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl"></div>
                      <div className="inline-flex p-4.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        AI Interview Simulator Locked
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Practice realistic platform-specific interviews with
                        voice-AI grading for platforms like{" "}
                        <strong>
                          Mercor, Micro1, Scale AI, Outlier, Alignerr,
                          Invisible,
                        </strong>{" "}
                        and <strong>General AI Evaluator</strong>. Get{" "}
                        <strong>Starter</strong> (€20, one-time) for 10
                        interview sessions, or <strong>Professional</strong>{" "}
                        for 30 sessions/month, adaptive questioning, and your
                        complete readiness score!
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                        <button
                          onClick={() => setActiveTab("membership")}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          View Plans
                        </button>
                        <button
                          onClick={() => setActiveTab("dashboard")}
                          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Explore AI Career Hub
                        </button>
                      </div>
                    </div>
                  ) : (
                    <InterviewSimulator
                      stats={stats}
                      onComplete={handleSimulationComplete}
                      onBack={() => setActiveTab("dashboard")}
                      onNavigateToMembership={() => setActiveTab("membership")}
                      initialRoleId={interviewInitialRoleId}
                      jobTitle={interviewJobTitle}
                    />
                  )}
                </div>
              )}

              {activeTab === "welcome" && (
                <WelcomeView
                  status={welcomeSyncStatus}
                  tier={stats.membershipTier || "free"}
                  latestPurchase={welcomeLatestPurchase}
                  onRetry={runWelcomeSync}
                  onContinue={() => setActiveTab("dashboard")}
                  onGoToPractice={() => setActiveTab("practice_overview")}
                  onGoToInterview={() => setActiveTab("interview")}
                />
              )}

              {activeTab === "membership" && (
                <MembershipView
                  stats={stats}
                  checkoutResult={checkoutResult}
                  onDismissCheckoutResult={() => setCheckoutResult(null)}
                  onBack={() => setActiveTab("dashboard")}
                  onNavigateToTab={(tabId) => setActiveTab(tabId)}
                  testimonials={testimonials}
                  onSyncComplete={(tier) => setStats((prev) => ({ ...prev, membershipTier: tier }))}
                />
              )}

              {activeTab === "accelerator" && (
                <AcceleratorHubView
                  stats={stats}
                  onUpgradeClick={() => setActiveTab("membership")}
                  onBack={() => setActiveTab("dashboard")}
                />
              )}

              {activeTab === "readiness" && (
                <ReadinessView
                  stats={stats}
                  overallScore={overallReadinessScore}
                  onBack={() => setActiveTab("dashboard")}
                />
              )}

              {activeTab === "affiliate" && (
                <AffiliateView
                  onBack={() => setActiveTab("dashboard")}
                  membershipTier={stats.membershipTier}
                  isAdmin={isAdmin}
                />
              )}

              {activeTab === "jobs" && (
                <JobsView
                  stats={stats}
                  jobs={jobs}
                  onBack={() => setActiveTab("dashboard")}
                  setActiveTab={setActiveTab}
                  onStartInterviewForJob={(job) => {
                    setInterviewInitialRoleId(mapJobFieldToInterviewDomainId(job.field));
                    setInterviewJobTitle(job.title);
                  }}
                />
              )}

              {activeTab === "profile" && (
                <div className="space-y-4 max-w-4xl mx-auto pl-1">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-455 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Career Hub
                  </button>
                  <ProfileView
                    stats={stats}
                    setStats={setStats}
                    activeRank={activeRank}
                    overallReadiness={overallReadinessScore}
                    setActiveTab={setActiveTab}
                    moduleCurriculum={moduleCurriculum}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
