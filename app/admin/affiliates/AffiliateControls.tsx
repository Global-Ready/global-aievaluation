"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  updateAffiliateCommissionRate,
  setAffiliateStatus,
  setReferralStatus,
  markAllReferralsPaid,
  type AffiliateReferralStatus,
} from "@/lib/actions/admin-affiliates";

const REFERRAL_STATUSES: AffiliateReferralStatus[] = ["pending", "approved", "paid", "reversed", "cancelled"];

export function RateForm({
  userId,
  currentRatePercent,
}: {
  userId: string;
  currentRatePercent: number;
}) {
  const [value, setValue] = useState(String(currentRatePercent));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const result = await updateAffiliateCommissionRate(userId, Number(value) || 0);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
      />
      <span className="text-slate-400">%</span>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-60 cursor-pointer inline-flex items-center gap-1"
      >
        {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
        Save
      </button>
      {error && <span className="text-rose-500 text-[10px]">{error}</span>}
    </div>
  );
}

export function PendingRequestActions({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-3">
      {isPending && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      <button
        type="button"
        onClick={() => startTransition(async () => { await setAffiliateStatus(userId, "active"); })}
        disabled={isPending}
        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-60 cursor-pointer"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => startTransition(async () => { await setAffiliateStatus(userId, "disabled"); })}
        disabled={isPending}
        className="text-rose-600 dark:text-rose-450 font-bold hover:underline disabled:opacity-60 cursor-pointer"
      >
        Reject
      </button>
    </div>
  );
}

export function StatusToggleButton({
  userId,
  status,
}: {
  userId: string;
  status: "active" | "disabled";
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = status === "active" ? "disabled" : "active";

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await setAffiliateStatus(userId, nextStatus); })}
      disabled={isPending}
      className={`font-bold hover:underline disabled:opacity-60 cursor-pointer inline-flex items-center gap-1 ${
        status === "active"
          ? "text-rose-600 dark:text-rose-450"
          : "text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === "active" ? "Disable" : "Enable"}
    </button>
  );
}

export function ReferralStatusSelect({
  referralId,
  status,
}: {
  referralId: string;
  status: AffiliateReferralStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {isPending && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as AffiliateReferralStatus;
          startTransition(async () => { await setReferralStatus(referralId, next); });
        }}
        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-60 cursor-pointer"
      >
        {REFERRAL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MarkAllPaidButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await markAllReferralsPaid(userId); })}
      disabled={isPending}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
    >
      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      Mark All Pending as Paid
    </button>
  );
}
