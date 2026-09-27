import Link from "next/link";
import { getAllAdminAffiliates, type AdminAffiliateRow } from "@/lib/admin/queries";
import { RateForm, StatusToggleButton, PendingRequestActions } from "./AffiliateControls";

function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

type DecidedAffiliateRow = AdminAffiliateRow & { status: "active" | "disabled" };

export default async function AdminAffiliatesPage() {
  const affiliates = await getAllAdminAffiliates();
  const pending = affiliates.filter((a) => a.status === "pending");
  const decided = affiliates.filter((a): a is DecidedAffiliateRow => a.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Affiliates</h2>
        <p className="text-xs text-slate-450 mt-1">
          Only Career Accelerator members can request to join. Approve or reject requests below —
          payouts happen manually outside the app once a referral is marked paid.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Pending Requests ({pending.length})
          </h3>
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="text-left px-4 py-3">Affiliate</th>
                  <th className="text-left px-4 py-3">Code</th>
                  <th className="text-left px-4 py-3">Requested</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {pending.map((a) => (
                  <tr key={a.user_id}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {a.display_name ?? a.user_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">{a.code}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <PendingRequestActions userId={a.user_id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="text-left px-4 py-3">Affiliate</th>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Rate</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Requested</th>
              <th className="text-left px-4 py-3">Referrals</th>
              <th className="text-left px-4 py-3">Pending</th>
              <th className="text-left px-4 py-3">Paid</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {decided.map((a) => (
              <tr key={a.user_id}>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {a.display_name ?? a.user_id}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                  {a.code}
                </td>
                <td className="px-4 py-3">
                  <RateForm userId={a.user_id} currentRatePercent={Math.round(a.commission_rate * 100)} />
                </td>
                <td className="px-4 py-3">
                  {a.status === "active" ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                  ) : (
                    <span className="text-slate-400">Disabled</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(a.created_at)}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.referral_count}</td>
                <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-semibold">
                  {formatCents(a.pending_commission_cents)}
                </td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {formatCents(a.paid_commission_cents)}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    href={`/admin/affiliates/${a.user_id}`}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Ledger
                  </Link>
                  <StatusToggleButton userId={a.user_id} status={a.status} />
                </td>
              </tr>
            ))}
            {decided.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  No approved affiliates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
