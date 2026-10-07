import React, { useEffect, useRef, useState } from "react";
import { 
  ArrowLeft, ArrowRight, Check, CheckCircle2, XCircle, 
  HelpCircle, RefreshCw, Send, Terminal, Key, ShieldAlert, BadgeCheck, AlertCircle
} from "lucide-react";
import { Lesson, UserStats, MiniCaseStudy } from "../types";
import { renderLessonParagraph, renderFormattedText } from "./LessonContentRenderer";
import InlineReviewBox from "./InlineReviewBox";

// Collapses single line breaks (e.g. pasted from a chat UI that puts each
// sentence on its own line) into spaces so the text wraps naturally to the
// card's full width, while still respecting intentional blank-line
// paragraph breaks (two or more consecutive newlines).
function normalizeResponseText(text: string): string {
  const PARAGRAPH_MARK = "@@P@@";
  return text
    .replace(/\n{2,}/g, PARAGRAPH_MARK)
    .replace(/\n/g, " ")
    .split(PARAGRAPH_MARK)
    .join("\n\n");
}

interface LessonViewProps {
  lesson: Lesson;
  stats: UserStats;
  onBack: () => void;
  onComplete: (quizScore: number, practicePerformance: Record<string, any>) => void;
}

export default function LessonView({ lesson, stats, onBack, onComplete }: LessonViewProps) {
  const [currentSection, setCurrentSection] = useState<"lecture" | "cases">("lecture");

  // Section 2 / 3: Lecture page scrolling
  const [readIndex, setReadIndex] = useState(0);

  // Section 4: Mini Case Studies State
  const [caseIndex, setCaseIndex] = useState(0);
  const [selectedCaseAnswers, setSelectedCaseAnswers] = useState<Record<string, number>>({}); // caseId -> chosenIndex
  const [caseSubmitted, setCaseSubmitted] = useState<Record<string, boolean>>({}); // caseId -> true
  const [caseRationales, setCaseRationales] = useState<Record<string, string>>({}); // caseId -> rationale text
  const [showWrapUp, setShowWrapUp] = useState(false);

  // Pending auto-reset timers, keyed by case study id — cleared on manual
  // retake so a fresh submission always gets its own full 5-minute window.
  const caseResetTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // General Case Studies score count
  const completedCaseCount = Object.keys(caseSubmitted).filter(k => k.startsWith(lesson.id)).length;

  // Handler for Mini Case Study choices
  const handleCaseSelect = (caseStudy: MiniCaseStudy, optionIdx: number) => {
    if (caseSubmitted[caseStudy.id]) return;
    setSelectedCaseAnswers(prev => ({ ...prev, [caseStudy.id]: optionIdx }));
  };

  const submitCaseAnswer = (caseStudy: MiniCaseStudy) => {
    if (selectedCaseAnswers[caseStudy.id] === undefined) return;
    if (!caseRationales[caseStudy.id]?.trim()) return;
    setCaseSubmitted(prev => ({ ...prev, [caseStudy.id]: true }));
  };

  const retakeCaseAnswer = (caseStudy: MiniCaseStudy) => {
    const pendingTimer = caseResetTimersRef.current[caseStudy.id];
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      delete caseResetTimersRef.current[caseStudy.id];
    }
    setCaseSubmitted(prev => {
      const next = { ...prev };
      delete next[caseStudy.id];
      return next;
    });
    setSelectedCaseAnswers(prev => {
      const next = { ...prev };
      delete next[caseStudy.id];
      return next;
    });
    setCaseRationales(prev => {
      const next = { ...prev };
      delete next[caseStudy.id];
      return next;
    });
  };

  // Auto-reset each submitted case study back to unanswered 5 minutes after
  // it was submitted, so it can be practiced again without a manual click.
  useEffect(() => {
    Object.keys(caseSubmitted).forEach((caseId) => {
      if (!caseSubmitted[caseId] || caseResetTimersRef.current[caseId]) return;
      caseResetTimersRef.current[caseId] = setTimeout(() => {
        delete caseResetTimersRef.current[caseId];
        const caseStudy = lesson.miniCaseStudies.find((cs) => cs.id === caseId);
        if (caseStudy) retakeCaseAnswer(caseStudy);
      }, 5 * 60 * 1000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseSubmitted, lesson.miniCaseStudies]);

  // Clear any outstanding timers if the lesson view unmounts.
  useEffect(() => {
    const timers = caseResetTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const isCasesDone = lesson.miniCaseStudies.every(cs => caseSubmitted[cs.id]);
  const hasCaseStudies = lesson.miniCaseStudies.length > 0;
  // Lessons with no case studies have nothing to step through — jump
  // straight to the takeaways/finish panel instead of indexing into an
  // empty array (lesson.miniCaseStudies[caseIndex] would be undefined).
  const showCaseStudySteps = hasCaseStudies && !showWrapUp;
  const showWrapUpPanel = showWrapUp || !hasCaseStudies;

  const handleFinishLesson = () => {
    onComplete(100, { [`case_rationales_${lesson.id}`]: caseRationales });
  };

  return (
    <div id="lesson-interactive-workspace" className="space-y-6 max-w-5xl mx-auto pl-1 pb-12 animate-fade-in">
      {/* Header back button & Status Tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-[#DCE4FF] dark:border-slate-800 p-3 rounded-2xl shadow-xs">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 hover:text-[#4F46E5] dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Syllabus
        </button>
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold mr-1.5 uppercase tracking-wider shrink-0">Progress:</span>
          <button 
            onClick={() => setCurrentSection("lecture")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all shrink-0 ${
              currentSection === "lecture" 
                ? "bg-[#4F46E5] text-white shadow-xs" 
                : "bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            1. Lectures
          </button>
          <button 
            onClick={() => setCurrentSection("cases")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all shrink-0 relative ${
              currentSection === "cases" 
                ? "bg-[#4F46E5] text-white shadow-xs" 
                : "bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            2. Case Studies
            <span className="ml-1 text-[9px] opacity-75">({completedCaseCount}/{lesson.miniCaseStudies.length})</span>
            {isCasesDone && <span className="absolute -top-1 -right-1 text-emerald-500 font-bold text-[9px] bg-white rounded-full">✓</span>}
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE STEPS */}
       {/* STEP 1: LECTURES */}
      {currentSection === "lecture" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Primary reading deck */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {lesson.title}
              </h2>
            </div>

            {/* Lecture paragraph scroller */}
            <div className="prose prose-slate dark:prose-invert text-sm leading-relaxed text-slate-700 dark:text-slate-350 space-y-4">
              {lesson.content.map((block, i) => renderLessonParagraph(block.text, i, block.media?.[0]))}
            </div>

            {/* Progress buttons */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex justify-end">
              <button 
                onClick={() => setCurrentSection("cases")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                Proceed to Mini Case Studies
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MINI CASE STUDIES */}
      {currentSection === "cases" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {showCaseStudySteps && (
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-855">
            <div>
              <p className="text-xs text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-widest">
                Part 2: Real Examples & Practice
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Practice with real scenarios ({completedCaseCount} of {lesson.miniCaseStudies.length} done)
              </h3>
            </div>
            {/* Case selector stepper dot indicator */}
            <div className="flex gap-1.5">
              {lesson.miniCaseStudies.map((cs, idx) => (
                <button
                  key={cs.id}
                  onClick={() => setCaseIndex(idx)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                    caseIndex === idx 
                      ? "bg-indigo-600 text-white" 
                      : caseSubmitted[cs.id]
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-350"
                        : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Render Active Case details */}
          {showCaseStudySteps && (() => {
            const activeCase = lesson.miniCaseStudies[caseIndex];
            const hasChosen = selectedCaseAnswers[activeCase.id] !== undefined;
            const isSub = caseSubmitted[activeCase.id] === true;
            const isCorrect = selectedCaseAnswers[activeCase.id] === activeCase.correctOptionIndex;

            return (
              <div className="space-y-6 animate-fade-in">
                {/* Scenario details split cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2">
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-750 text-slate-650 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      Special Rules to Follow
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">{renderFormattedText(activeCase.scenario)}</p>
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 uppercase font-bold">User's Question:</p>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{renderFormattedText(activeCase.prompt)}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2">
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      AI's Answer
                    </span>
                    <pre className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap break-words p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg max-h-48 overflow-y-auto mt-1">
                      {normalizeResponseText(activeCase.response)}
                    </pre>
                  </div>
                </div>

                {activeCase.media && activeCase.media.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeCase.media.map((m) => (
                      <div key={m.path} className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                        {m.type === "image" ? (
                          <img src={m.url} alt="" className="w-full rounded-lg max-h-56 object-contain" />
                        ) : m.type === "video" ? (
                          <video src={m.url} controls className="w-full rounded-lg bg-black max-h-56" />
                        ) : (
                          <audio src={m.url} controls className="w-full" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* MCQ Question segment */}
                <div id="case-study-mcq" className="space-y-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-550" />
                    {renderFormattedText(activeCase.question)}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {activeCase.options.map((opt, idx) => {
                      const isSelected = selectedCaseAnswers[activeCase.id] === idx;
                      let optionBg = "bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-350";
                      
                      if (isSelected) {
                        optionBg = "bg-indigo-50/20 border-indigo-550 dark:bg-indigo-950/10 text-indigo-900 dark:text-indigo-400 font-medium";
                      }
                      if (isSub) {
                        if (idx === activeCase.correctOptionIndex) {
                          optionBg = "bg-emerald-50/30 border-emerald-500 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 font-semibold";
                        } else if (isSelected && !isCorrect) {
                          optionBg = "bg-rose-50/30 border-rose-500 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isSub}
                          onClick={() => handleCaseSelect(activeCase, idx)}
                          className={`text-left p-4.5 rounded-xl border text-xs transition-all flex justify-between items-center ${optionBg} ${
                            !isSub ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <span>{opt}</span>
                          {isSub && idx === activeCase.correctOptionIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                          {isSub && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rationale — required before submitting, to practice justifying the choice */}
                {!isSub && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Your Rationale
                    </p>
                    <textarea
                      placeholder="Explain why you chose this answer..."
                      value={caseRationales[activeCase.id] || ""}
                      onChange={(e) => setCaseRationales(prev => ({ ...prev, [activeCase.id]: e.target.value }))}
                      className="w-full h-20 p-3 border border-slate-200 dark:border-slate-750 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                    ></textarea>
                  </div>
                )}
                {isSub && caseRationales[activeCase.id] && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Your Rationale</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{caseRationales[activeCase.id]}</p>
                  </div>
                )}

                {/* Submissions button details */}
                {!isSub ? (
                  <button
                    disabled={!hasChosen || !caseRationales[activeCase.id]?.trim()}
                    onClick={() => submitCaseAnswer(activeCase)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      hasChosen && caseRationales[activeCase.id]?.trim()
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4 animate-fade-in">
                    {/* Exercise Feedback Panel */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      isCorrect 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-450" 
                        : "bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-450"
                    }`}>
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider">
                          {isCorrect ? "Nice Job! That's Correct." : "Not Quite! Let's Learn Why."}
                        </p>
                        <p className="text-xs mt-1 opacity-90">
                          {isCorrect
                            ? "Great job! You spotted the correct answer perfectly."
                            : "Don't worry! Mistakes are part of learning. Let's see why this answer is the right one."}
                        </p>
                      </div>
                      <button
                        onClick={() => retakeCaseAnswer(activeCase)}
                        className={`ml-auto shrink-0 flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer ${
                          isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retake
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border text-xs ${
                        isCorrect 
                          ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/10" 
                          : "bg-rose-50/50 dark:bg-rose-950/10 border-rose-500/10"
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Your Answer</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-350">
                          {activeCase.options[selectedCaseAnswers[activeCase.id]]}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-xl text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Correct Answer</span>
                        <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                          {activeCase.options[activeCase.correctOptionIndex]}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1">Why is this correct?</p>
                      <p className="text-xs text-slate-750 dark:text-slate-350 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {renderFormattedText(activeCase.explanation)}
                      </p>
                    </div>

                    {activeCase.reviewerNotes && (
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                          <ShieldAlert className="w-4 h-4" />
                          Trainer Tip
                        </p>
                        <p className="text-xs italic text-amber-900 dark:text-amber-300 mt-1">
                          {renderFormattedText(activeCase.reviewerNotes)}
                        </p>
                      </div>
                    )}
                    {/* Stepping controls */}
                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => {
                          if (caseIndex > 0) {
                            setCaseIndex(caseIndex - 1);
                          }
                        }}
                        disabled={caseIndex === 0}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        &larr; Prev Case
                      </button>
                      
                      {caseIndex < lesson.miniCaseStudies.length - 1 ? (
                        <button
                          onClick={() => setCaseIndex(caseIndex + 1)}
                          className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg px-4 py-1.5 text-xs transition-colors cursor-pointer"
                        >
                          Next Case study &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowWrapUp(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-1.5 text-xs transition-colors cursor-pointer"
                        >
                          Complete Case Studies Block
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Wrap-up: shown once all case studies are submitted (or
              immediately, for a lesson that has no case studies at all) */}
          {showWrapUpPanel && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-xs text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-widest">
                  {hasCaseStudies ? "Case Studies Complete" : "Lecture Complete"}
                </p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Nice work — here's what to remember
                </h3>
              </div>

              <div className="bg-indigo-550/10 border border-indigo-550/20 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 leading-snug">
                  Key Takeaways
                </h4>
                <div
                  className={`grid gap-3 text-xs ${
                    lesson.keyTakeaways.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {lesson.keyTakeaways.map((take, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="text-indigo-600 font-bold leading-none">&#10004;</span>
                      <span className="text-slate-700 dark:text-slate-350">{take}</span>
                    </div>
                  ))}
                </div>
              </div>

              {hasCaseStudies && <InlineReviewBox contextType="case_study" contextLabel={lesson.title} />}

              <div className="pt-2 flex justify-between">
                {hasCaseStudies ? (
                  <button
                    onClick={() => setShowWrapUp(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  >
                    &larr; Back to Case Studies
                  </button>
                ) : (
                  <span />
                )}
                <button
                  onClick={handleFinishLesson}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  Finish Lesson & Save Progress
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
