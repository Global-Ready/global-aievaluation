import type { PracticeDomainId } from "./lib/practice-domains";

export enum Rank {
  TRAINEE = "Trainee Evaluator",
  JUNIOR = "Junior Evaluator",
  EVALUATOR = "Evaluator",
  SENIOR = "Senior Evaluator",
  EXPERT = "Expert Reviewer",
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  reqMetric: string; // e.g., "lessons:5", "simulations:1", "score:85"
  unlocked: boolean;
}

export interface UserStats {
  completedLessons: string[]; // lessonIds
  completedSimulations: string[]; // moduleIds
  passedExams: string[]; // moduleIds
  streakCount: number;
  lastActiveDate: string; // YYYY-MM-DD
  xp: number;
  activeRank: string;
  skills: {
    promptEvaluation: number;
    responseRanking: number;
    factChecking: number;
    safetyReview: number;
    annotation: number;
    reasoning: number;
    reasoningEvaluation: number;
    instructionFollowing: number;
  };
  practiceSubmissions: Record<string, any>;
  quizScores?: Record<string, number>;
  practiceTaskSubmissions?: Record<string, PracticeTaskSubmission>;
  totalInterviewsStarted?: number;
  currentModuleId?: string;
  currentLessonId?: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  role?: string;
  location?: string;
  timezone?: string;
  membershipTier?: "free" | "starter" | "professional" | "career_accelerator";
  settings?: {
    notificationsEnabled?: boolean;
    audioFeedback?: boolean;
    pacingMode?: "standard" | "speedrun";
  };
}

export interface CaseStudyMediaItem {
  type: "image" | "video" | "audio";
  path: string;
  url: string;
  durationSeconds?: number;
}

export interface ContentBlock {
  id: string;
  text: string;
  media?: CaseStudyMediaItem[]; // at most 1 attachment per block
}

export interface MiniCaseStudy {
  id: string;
  scenario: string;
  prompt: string;
  response: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  reviewerNotes?: string;
  media?: CaseStudyMediaItem[]; // max 2 videos + 2 audio clips, each <=10s
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  duration: string;
  objectives: string[];
  content: ContentBlock[]; // multi-step paragraphs, each with an optional image/video/audio
  miniCaseStudies: MiniCaseStudy[]; // 5 items
  reflectionQuestions?: string[];
  keyTakeaways: string[];
  skillBoosts?: Partial<UserStats["skills"]>;
}

export interface PracticeTaskContentBlock {
  text: string;
  media: CaseStudyMediaItem[];
}

export interface PracticeTaskOption {
  text: string;
  isCorrect: boolean;
}

// A judge-the-response practice exercise — replaces the former separate
// SimulationTask/ExamQuestion/AnnotationTask shapes with one schema. Every
// content block carries its own optional media rather than media being a
// bolted-on extra, since on annotation-style tasks the media IS the content.
export interface PracticeTask {
  id: string;
  moduleId: string;
  taskType: string;
  category?: string;
  difficulty: "beginner" | "intermediate" | "expert";
  domain: PracticeDomainId;
  guideline: PracticeTaskContentBlock;
  item: PracticeTaskContentBlock;
  responseA: PracticeTaskContentBlock;
  responseB?: PracticeTaskContentBlock;
  question: string;
  responseMode: "choice" | "written" | "choice_plus_written";
  options: PracticeTaskOption[];
  modelAnswer?: string;
  explanation?: string;
  reviewerNotes?: string;
  timed: boolean;
  timeLimitSeconds?: number;
  failureModeTags: string[];
}

export interface PracticeTaskSubmission {
  selectedOptionIndex?: number;
  writtenAnswer?: string;
  submittedAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  simulationIntro?: {
    scenario: string;
    objective: string;
  };
  practiceTasks?: PracticeTask[];
  simSkillBoosts?: Partial<UserStats["skills"]>;
  locked?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  avatarUrl?: string;
  proofImageUrl?: string;
  rating?: number;
}

export interface SiteAnnouncement {
  message: string;
  linkUrl?: string;
  linkLabel?: string;
}
