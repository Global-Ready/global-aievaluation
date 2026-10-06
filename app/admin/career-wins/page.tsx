import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function AdminCareerWinsPage() {
  const service = createServiceClient();
  const { data: wins, error } = await service
    .from("career_wins")
    .select("id, user_id, kind, company, note, screenshot_path, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`AdminCareerWinsPage: ${error.message}`);

  const userIds = [...new Set((wins ?? []).map((w) => w.user_id))];
  const { data: profiles } = userIds.length
    ? await service.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const rows = await Promise.all(
    (wins ?? []).map(async (w) => {
      let screenshotUrl: string | null = null;
      if (w.screenshot_path) {
        const { data } = await service.storage
          .from("career-win-proofs")
          .createSignedUrl(w.screenshot_path, 60 * 60);
        screenshotUrl = data?.signedUrl ?? null;
      }
      return { ...w, studentName: names.get(w.user_id) ?? "Unknown", screenshotUrl };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Career Wins</h2>
        <p className="text-xs text-slate-450 mt-1">
          Interviews and projects students report from their dashboard, with any screenshot they attached.
          Counts by date range are on the Weekly Numbers page.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="text-left px-4 py-3">Reported</th>
              <th className="text-left px-4 py-3">Student</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Company / Platform</th>
              <th className="text-left px-4 py-3">Note</th>
              <th className="text-left px-4 py-3">Screenshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.studentName}</td>
                <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">{r.kind}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.company ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs">{r.note ?? "—"}</td>
                <td className="px-4 py-3">
                  {r.screenshotUrl ? (
                    <a href={r.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                      View
                    </a>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No wins reported yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
