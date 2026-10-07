"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { submitUserReview, type ReviewContextType } from "../lib/actions/user-reviews";

const inputClass =
  "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500";

const CONTEXT_OPTIONS: { value: ReviewContextType; label: string }[] = [
  { value: "case_study", label: "A lesson / case study" },
  { value: "interview", label: "AI Interview Simulator" },
  { value: "practice_level", label: "Real World Practice" },
];

// Always-available alternative to the pop-up prompts shown right after
// finishing something — a student who skips that moment still has
// somewhere to leave a review.
export default function DashboardReviewPanel() {
  const [contextType, setContextType] = useState<ReviewContextType>("case_study");
  const [contextLabel, setContextLabel] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

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
    setContextLabel("");
    setRating(0);
    setQuote("");
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
      <div>
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500" /> Leave a Review
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Tell us about a lesson, your AI interview, or Real World Practice — anytime, not just right after. Approved reviews may be featured on our site.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className={inputClass}
            value={contextType}
            onChange={(e) => setContextType(e.target.value as ReviewContextType)}
          >
            {CONTEXT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            className={inputClass}
            value={contextLabel}
            onChange={(e) => setContextLabel(e.target.value)}
            placeholder="Which one? (optional)"
          />
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
          className={inputClass}
          rows={2}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="What stood out to you?"
          required
        />

        {error && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> {error}
          </p>
        )}
        {done && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Thanks — sent for approval.
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
    </div>
  );
}
