import { getMetrics, resolveRange } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

const PRESETS: { key: string; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "1y", label: "1 year" },
];

function formatEuros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function pct(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

export default async function AdminMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = resolveRange(params);
  const { metrics, topSources, deviceRows, affiliateSales } = await getMetrics(range);
  const visitTotal = deviceRows.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Weekly Numbers</h2>
          <p className="text-xs text-slate-450 mt-1">Showing: {range.label}. Times are UTC.</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <a
                key={p.key}
                href={`?range=${p.key}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  range.preset === p.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="range" value="custom" />
            <input
              type="date"
              name="from"
              defaultValue={range.preset === "custom" ? params.from : undefined}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white"
              required
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              name="to"
              defaultValue={range.preset === "custom" ? params.to : undefined}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white"
              required
            />
            <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer">
              Apply
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="text-left px-4 py-3">Metric</th>
              <th className="text-right px-4 py-3">Value</th>
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
                  {m.value === null ? "—" : m.value.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Where visitors came from</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-right px-4 py-3">Visits</th>
                  <th className="text-right px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {topSources.map((s) => (
                  <tr key={s.name}>
                    <td className="px-4 py-2.5 text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">{s.count}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{pct(s.count, visitTotal)}</td>
                  </tr>
                ))}
                {topSources.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No visits in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Mobile vs PC</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="text-left px-4 py-3">Device</th>
                  <th className="text-right px-4 py-3">Visits</th>
                  <th className="text-right px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {deviceRows.map((d) => (
                  <tr key={d.name}>
                    <td className="px-4 py-2.5 capitalize text-slate-900 dark:text-white">{d.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">{d.count}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{pct(d.count, visitTotal)}</td>
                  </tr>
                ))}
                {deviceRows.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No visits in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Sales from each affiliate</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="text-left px-4 py-3">Affiliate</th>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-right px-4 py-3">Sales</th>
                <th className="text-right px-4 py-3">Sales value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {affiliateSales.map((a) => (
                <tr key={a.userId}>
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">{a.name}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">{a.code}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">{a.sales}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">{formatEuros(a.salesCents)}</td>
                </tr>
              ))}
              {affiliateSales.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No affiliates yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
