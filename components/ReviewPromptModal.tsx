"use client";

import { useState } from "react";
import { Star, X, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { submitUserReview, type ReviewContextType } from "../lib/actions/user-reviews";

const CONTEXT_COPY: Record<ReviewContextType, { title: string; subtitle: string }> = {
  case_study: {
    title: "How was this case study?",
    subtitle: "Your review may be shared (with your approval and ours) to help other learners.",
  },
  interview: {
    title: "How was your AI interview?",
    subtitle: "Tell us how the practice interview felt — it might be featured on our site once approved.",
  },
  practice_level: {
    title: "How was this practice level?",
    subtitle: "Share your experience completing this level — approved reviews may be featured on our site.",
  },
};

export default function ReviewPromptModal({
  contextType,
  contextLabel,
  onClose,
}: {
  contextType: ReviewContextType;
  contextLabel?: string;
  onClose: () => void;
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
    setIsSubmitting(true);
    const result = await submitUserReview({ contextType, contextLabel, rating, quote });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Thanks for the feedback!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              It'll show on the site once an admin approves it.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 pr-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white">{copy.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{copy.subtitle}</p>
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
                    className={`w-7 h-7 transition-colors ${
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
              rows={3}
              placeholder="What stood out to you?"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />

            {error && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Maybe later
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || !quote.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
