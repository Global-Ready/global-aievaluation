"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Lock, Sparkles, ChevronRight, RefreshCw,
} from "lucide-react";
import type { PracticeTask, PracticeTaskSubmission, UserStats } from "@/types";
import { renderFormattedText } from "./LessonContentRenderer";
import type { PracticeDomainId } from "@/lib/practice-domains";

function ContentBlock({
  label,
  block,
}: {
  label: string;
  block?: { text: string; media: { type: "image" | "video" | "audio"; url: string }[] };
}) {
  if (!block || (!block.text && (!block.media || block.media.length === 0))) return null;
  const media = block.media?.[0];

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{label}</span>
      {block.text && (
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {renderFormattedText(block.text)}
        </p>
      )}
      {media && (
        <div className="rounded-xl overflow-hidden border border-slate-150 dark:border-slate-800">
          {media.type === "image" ? (
            <img src={media.url} alt="" className="w-full object-contain max-h-[70vh]" />
          ) : media.type === "video" ? (
            <video src={media.url} controls className="w-full max-h-[70vh] bg-black" />
          ) : (
            <audio src={media.url} controls className="w-full" />
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  existing,
  onSubmit,
}: {
  task: PracticeTask;
  existing?: PracticeTaskSubmission;
  onSubmit: (submission: PracticeTaskSubmission) => void;
}) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | undefined>(
    existing?.selectedOptionIndex,
  );
  const [writtenAnswer, setWrittenAnswer] = useState(existing?.writtenAnswer ?? "");
  const [submitted, setSubmitted] = useState(!!existing);
  const [secondsRemaining, setSecondsRemaining] = useState(task.timeLimitSeconds ?? 0);
  // Running out the clock resets the task to its blank state rather than
  // leaving a stale answer sitting there — training time-consciousness
  // instead of letting the timer become decorative.
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!task.timed || submitted || timedOut || !task.timeLimitSeconds) return;
    if (secondsRemaining <= 0) {
      setTimedOut(true);
      setSelectedOptionIndex(undefined);
      setWrittenAnswer("");
      return;
    }
    const t = setTimeout(() => setSecondsRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [task.timed, task.timeLimitSeconds, secondsRemaining, submitted, timedOut]);

  const handleRestartTimer = () => {
    setTimedOut(false);
    setSecondsRemaining(task.timeLimitSeconds ?? 0);
  };

  const needsChoice = task.responseMode !== "written";
  const needsWritten = task.responseMode !== "choice";
  const canSubmit =
    (!needsChoice || selectedOptionIndex !== undefined) &&
    (!needsWritten || writtenAnswer.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const submission: PracticeTaskSubmission = {
      selectedOptionIndex,
      writtenAnswer: needsWritten ? writtenAnswer : undefined,
      submittedAt: new Date().toISOString(),
    };
    setSubmitted(true);
    onSubmit(submission);
  };

  const handleRetry = () => {
    setSelectedOptionIndex(undefined);
    setWrittenAnswer("");
    setSubmitted(false);
  };

  // Auto-reset back to the unanswered state 5 minutes after a submission so
  // the task can be practiced again without waiting on a manual click.
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(handleRetry, 5 * 60 * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const isCorrect =
    selectedOptionIndex !== undefined && task.options[selectedOptionIndex]?.isCorrect;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      {task.timed && task.timeLimitSeconds && !submitted && !timedOut && (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-150">
            <Clock className="w-3.5 h-3.5" /> {formatTime(secondsRemaining)}
          </span>
        </div>
      )}

      <ContentBlock label="Guideline" block={task.guideline} />
      <ContentBlock label="Item" block={task.item} />
      <ContentBlock label={task.responseB ? "Response A" : "Response"} block={task.responseA} />
      {task.responseB && <ContentBlock label="Response B" block={task.responseB} />}

      <div>
        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Question</span>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{task.question}</p>
      </div>

      {needsChoice && (
        <div className="space-y-2">
          {task.options.map((opt, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const showResult = submitted;
            return (
              <button
                key={idx}
                type="button"
                disabled={submitted || timedOut}
                onClick={() => setSelectedOptionIndex(idx)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                  showResult && opt.isCorrect
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                    : showResult && isSelected && !opt.isCorrect
                      ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                      : isSelected
                        ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-900 dark:text-white"
                        : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-indigo-300"
                }`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      )}

      {needsWritten && (
        <div>
          <textarea
            disabled={submitted || timedOut}
            value={writtenAnswer}
            onChange={(e) => setWrittenAnswer(e.target.value)}
            rows={4}
            placeholder="Write your answer..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
          />
        </div>
      )}

      {timedOut ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 rounded-xl">
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" /> Time&apos;s up — answer cleared
          </p>
          <button
            type="button"
            onClick={handleRestartTimer}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : !submitted ? (
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            canSubmit
              ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          Submit
        </button>
      ) : (
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
          <div className="flex items-center justify-between gap-2">
            {needsChoice ? (
              <p className={`text-xs font-bold flex items-center gap-1.5 ${isCorrect ? "text-emerald-600" : "text-rose-500"}`}>
                {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {isCorrect ? "Correct" : "Not quite"}
              </p>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleRetry}
              className="ml-auto shrink-0 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
          {task.modelAnswer && (
            <div>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Model Answer</span>
              <p className="text-xs text-slate-700 dark:text-slate-300">{task.modelAnswer}</p>
            </div>
          )}
          {task.explanation && (
            <div>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Explanation</span>
              <p className="text-xs text-slate-700 dark:text-slate-300">{task.explanation}</p>
            </div>
          )}
          {task.reviewerNotes && (
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Reviewer Notes</span>
              <p className="text-xs text-slate-700 dark:text-slate-300">{task.reviewerNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PracticeTaskRunner({
  tasks,
  existingSubmissions,
  onSubmit,
  onBack,
  isPaidUser,
  onRequireUpgrade,
  domain,
  domainLabel,
  filter,
  isUnlocked,
  onAdvanceLevel,
}: {
  tasks: PracticeTask[];
  existingSubmissions: Record<string, PracticeTaskSubmission>;
  onSubmit: (taskId: string, submission: PracticeTaskSubmission) => void;
  onBack: () => void;
  isPaidUser: boolean;
  onRequireUpgrade: () => void;
  domain: PracticeDomainId;
  domainLabel: string;
  filter: "beginner" | "intermediate" | "expert";
  isUnlocked: boolean;
  // Present only when a next level exists (i.e. filter isn't "expert") —
  // advances practiceLevel and jumps straight into it.
  onAdvanceLevel?: () => void;
}) {
  const filtered = tasks.filter((t) => t.domain === domain && t.difficulty === filter);

  // One task shown at a time — the next one only unlocks (and its timer
  // only starts) once the current one is submitted, rather than every task
  // in the section rendering and counting down at once.
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    setCurrentIndex(0);
  }, [filter]);

  const currentTask = filtered[currentIndex];
  const isCurrentSubmitted = currentTask ? !!existingSubmissions[currentTask.id] : false;
  const isLastTask = currentIndex === filtered.length - 1;

  const LEVEL_COPY = {
    beginner: {
      title: "Beginner Practice",
      description: "Foundational judge-the-response tasks with guided feedback.",
    },
    intermediate: {
      title: "Intermediate Practice",
      description: "Applied evaluation and annotation tasks with less hand-holding.",
    },
    expert: {
      title: "Expert Practice",
      description: "Advanced, exam-style tasks — some are timed.",
    },
  } as const;

  const NEXT_LEVEL_LABEL: Partial<Record<"beginner" | "intermediate" | "expert", string>> = {
    beginner: "Intermediate",
    intermediate: "Expert",
  };

  if (!isPaidUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex p-4.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {LEVEL_COPY[filter].title} Locked
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Upgrade to Professional or Career Accelerator to unlock the full practice-task bank.
        </p>
        <button
          onClick={onRequireUpgrade}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> View Plans
        </button>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex p-4.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {domainLabel} / {LEVEL_COPY[filter].title} Locked
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Finish every task in the previous level of {domainLabel} first to unlock {LEVEL_COPY[filter].title}.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          Back to Real World Practice
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pl-1 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Real World Practice
      </button>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {domainLabel} / {LEVEL_COPY[filter].title}
        </h2>
        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
          {LEVEL_COPY[filter].description}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-450">
          No practice tasks available yet.
        </div>
      ) : !currentTask ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            All {filtered.length} tasks in this section are complete!
          </p>
          {onAdvanceLevel ? (
            <button
              onClick={onAdvanceLevel}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Move to {NEXT_LEVEL_LABEL[filter]} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You&apos;ve completed every level in {domainLabel}.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Progress: completed tasks are clickable to review; the current
              task is highlighted; later tasks stay locked until earned. */}
          <div className="flex items-center gap-2">
            {filtered.map((task, idx) => {
              const done = !!existingSubmissions[task.id];
              const isActive = idx === currentIndex;
              const isReachable = done || idx <= currentIndex;
              return (
                <button
                  key={task.id}
                  type="button"
                  disabled={!isReachable}
                  onClick={() => isReachable && setCurrentIndex(idx)}
                  title={`Task ${idx + 1} of ${filtered.length}`}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    isActive
                      ? "bg-indigo-600"
                      : done
                        ? "bg-emerald-400 cursor-pointer hover:bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              );
            })}
          </div>
          <p className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">
            Task {currentIndex + 1} of {filtered.length}
          </p>

          <TaskCard
            key={currentTask.id}
            task={currentTask}
            existing={existingSubmissions[currentTask.id]}
            onSubmit={(submission) => onSubmit(currentTask.id, submission)}
          />

          {isCurrentSubmitted && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isLastTask ? "Finish Level" : "Next Task"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
