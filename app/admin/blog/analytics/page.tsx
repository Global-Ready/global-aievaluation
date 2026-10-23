import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBlogMetrics, resolveRange } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

const PRESETS: { key: string; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "3 months" },
  { key: "1y", label: "1 year" },
  { key: "all", label: "All time" },
];

function pct(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function BlogAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = resolveRange(params);
  const { totalVisits, countryRows, deviceRows, pageRows, recentVisits } = await getBlogMetrics(range);
  const deviceTotal = deviceRows.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/blog"
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
          </Link>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Blog Analytics</h2>
          <p className="text-xs text-slate-450 mt-1">
            Showing: {range.label}. Times are UTC. Only counts visits since this tracking shipped — it
            doesn't backfill earlier traffic.
          </p>
        </div>

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
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Total Blog Visits</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalVisits.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Visits by page</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="text-left px-4 py-3">Page</th>
                  <th className="text-right px-4 py-3">Visits</th>
                  <th className="text-right px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {pageRows.map((p) => (
                  <tr key={p.name}>
                    <td className="px-4 py-2.5 text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">{p.count}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 whitespace-nowrap shrink-0">{pct(p.count, totalVisits)}</td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No visits in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Visits by location</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="text-left px-4 py-3">Country</th>
                  <th className="text-right px-4 py-3">Visits</th>
                  <th className="text-right px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {countryRows.map((c) => (
                  <tr key={c.name}>
                    <td className="px-4 py-2.5 text-slate-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">{c.count}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 whitespace-nowrap shrink-0">{pct(c.count, totalVisits)}</td>
                  </tr>
                ))}
                {countryRows.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No visits in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Mobile vs PC</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-w-md">
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
                  <td className="px-4 py-2.5 text-right text-slate-500">{pct(d.count, deviceTotal)}</td>
                </tr>
              ))}
              {deviceRows.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No visits in this range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Recent visits {recentVisits.length === 200 && <span className="font-normal normal-case text-slate-400">(last 200)</span>}
        </h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Page</th>
                <th className="text-left px-4 py-3">Country</th>
                <th className="text-left px-4 py-3">Device</th>
                <th className="text-left px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {recentVisits.map((v, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-350 whitespace-nowrap">{formatDateTime(v.createdAt)}</td>
                  <td className="px-4 py-2.5 text-slate-900 dark:text-white">{v.page}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-350">{v.country}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-350 capitalize">{v.device}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-350">{v.source}</td>
                </tr>
              ))}
              {recentVisits.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No visits in this range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
