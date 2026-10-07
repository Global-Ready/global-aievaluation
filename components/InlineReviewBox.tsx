"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { submitUserReview, type ReviewContextType } from "../lib/actions/user-reviews";

const CONTEXT_COPY: Record<ReviewContextType, { title: string; subtitle: string }> = {
  case_study: {
    title: "How was this lesson?",
    subtitle: "Your review may be shown on our site once approved.",
  },
  interview: {
    title: "How was this AI interview?",
    subtitle: "Your review may be shown on our site once approved.",
  },
  practice_level: {
    title: "How was this practice level?",
    subtitle: "Your review may be shown on our site once approved.",
  },
};

// Embedded directly on the screen where a student just finished something
// (a lesson's case studies, an interview report, a practice level) rather
// than a popup or a generic dashboard form — so it's seen at the moment
// it's most relevant, and stays visible rather than being dismissed.
export default function InlineReviewBox({
  contextType,
  contextLabel,
}: {
  contextType: ReviewContextType;
  contextLabel?: string;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const copy = CONTEXT_COPY[contextType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating === 0) {
      setError("Pick a star rating.");
      return;
    }
    setIsSubmitting(true);
    const result = await submitUserReview({ contextType, contextLabel, rating, quote });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
          Thanks for the review — it'll show on the site once approved.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/40 rounded-2xl p-5 space-y-3"
    >
      <div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white">{copy.title}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{copy.subtitle}</p>
      </div>

      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            className="cursor-pointer"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                n <= (hoverRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 dark:text-slate-700"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        rows={2}
        placeholder="What stood out to you?"
        required
        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
      />

      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
      >
        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Submit Review
      </button>
    </form>
  );
}
