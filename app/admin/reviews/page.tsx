import { getAdminUserReviews, type AdminUserReviewRow } from "@/lib/admin/queries";
import { PendingReviewActions, ReviewStatusSelect } from "./ReviewStatusActions";

const CONTEXT_LABELS: Record<AdminUserReviewRow["context_type"], string> = {
  case_study: "Case Study",
  interview: "AI Interview",
  practice_level: "Practice Level",
};

function Stars({ rating }: { rating: number }) {
  return <span className="text-amber-500">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

export default async function AdminReviewsPage() {
  const reviews = await getAdminUserReviews();
  const pending = reviews.filter((r) => r.status === "pending");
  const decided = reviews.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Student Reviews</h2>
        <p className="text-xs text-slate-450 mt-1">
          Prompted after finishing a lesson's case studies, an AI interview, or a Real World
          Practice level. Approved reviews are shown publicly alongside testimonials.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{r.display_name ?? r.user_id}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{CONTEXT_LABELS[r.context_type]}{r.context_label ? ` — ${r.context_label}` : ""}</span>
                      <span className="text-slate-400">·</span>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{r.quote}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <PendingReviewActions id={r.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="text-left px-4 py-3">Student</th>
              <th className="text-left px-4 py-3">Context</th>
              <th className="text-left px-4 py-3">Rating</th>
              <th className="text-left px-4 py-3">Quote</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {decided.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.display_name ?? r.user_id}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {CONTEXT_LABELS[r.context_type]}{r.context_label ? ` — ${r.context_label}` : ""}
                </td>
                <td className="px-4 py-3"><Stars rating={r.rating} /></td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{r.quote}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <ReviewStatusSelect id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {decided.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No reviews decided yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
