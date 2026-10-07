import { Star, MessageSquareQuote } from "lucide-react";
import type { LessonReview } from "../types";

// Approved student reviews shown directly under a lesson's case studies —
// not just folded into the landing-page testimonials — so other students
// browsing this same lesson can see what past students said about it.
export default function LessonReviewsList({ reviews }: { reviews?: LessonReview[] }) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-850 space-y-4">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
        <MessageSquareQuote className="w-3.5 h-3.5" />
        What other learners said ({reviews.length})
      </h4>
      <div className="space-y-3">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{r.name}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-3 h-3 ${
                      n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1.5">{r.quote}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
