import { getWeeklyMetrics } from "@/lib/admin/weekly-metrics";

function formatValue(v: number | null): string {
  return v === null ? "—" : v.toLocaleString();
}

function formatEuros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export default async function AdminMetricsPage() {
  const { metrics, affiliateSales } = await getWeeklyMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Weekly Numbers</h2>
        <p className="text-xs text-slate-450 mt-1">
          The numbers to check every week. Last 7 days, with all-time totals alongside.
          &ldquo;—&rdquo; means that figure isn&apos;t tracked yet.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="text-left px-4 py-3">Metric</th>
              <th className="text-right px-4 py-3">Last 7 days</th>
              <th className="text-right px-4 py-3">All time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {metrics.map((m) => (
              <tr key={m.key}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 dark:text-white">{m.label}</div>
                  {m.note && <div className="text-[10px] text-slate-400 mt-0.5">{m.note}</div>}
                </td>
                <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                  {formatValue(m.last7)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                  {formatValue(m.allTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Sales from each affiliate</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="text-left px-4 py-3">Affiliate</th>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-right px-4 py-3">Sales (7 days)</th>
                <th className="text-right px-4 py-3">Sales value (7 days)</th>
                <th className="text-right px-4 py-3">Sales (all time)</th>
                <th className="text-right px-4 py-3">Sales value (all time)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {affiliateSales.map((a) => (
                <tr key={a.userId}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{a.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{a.code}</td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-bold">{a.sales7}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatEuros(a.sales7Cents)}</td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-bold">{a.salesAll}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatEuros(a.salesAllCents)}</td>
                </tr>
              ))}
              {affiliateSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No affiliates yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
