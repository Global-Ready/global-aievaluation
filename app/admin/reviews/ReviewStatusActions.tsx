"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setUserReviewStatus, type UserReviewStatus } from "@/lib/actions/admin-user-reviews";

export function PendingReviewActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-3">
      {isPending && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      <button
        type="button"
        onClick={() => startTransition(async () => { await setUserReviewStatus(id, "approved"); })}
        disabled={isPending}
        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-60 cursor-pointer"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => startTransition(async () => { await setUserReviewStatus(id, "rejected"); })}
        disabled={isPending}
        className="text-rose-600 dark:text-rose-450 font-bold hover:underline disabled:opacity-60 cursor-pointer"
      >
        Reject
      </button>
    </div>
  );
}

export function ReviewStatusSelect({ id, status }: { id: string; status: UserReviewStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {isPending && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as UserReviewStatus;
          startTransition(async () => { await setUserReviewStatus(id, next); });
        }}
        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-60 cursor-pointer"
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}
