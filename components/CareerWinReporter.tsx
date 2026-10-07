"use client";

import { useState } from "react";
import { Trophy, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { reportCareerWin } from "../lib/actions/career-wins";
import { createClient } from "../lib/supabase/client";

const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

const inputClass =
  "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500";

export default function CareerWinReporter() {
  const [kind, setKind] = useState<"interview" | "project">("interview");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      let screenshotPath: string | undefined;
      if (screenshot) {
        if (screenshot.size > MAX_SCREENSHOT_BYTES) {
          setError("Screenshot is too large (max 10MB).");
          return;
        }
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Please sign in again.");
          return;
        }
        const safeName = screenshot.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("career-win-proofs")
          .upload(path, screenshot, { contentType: screenshot.type || undefined });
        if (uploadError) {
          setError(`Screenshot upload failed: ${uploadError.message}`);
          return;
        }
        screenshotPath = path;
      }

      const result = await reportCareerWin({ kind, company, note, screenshotPath });
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      setCompany("");
      setNote("");
      setScreenshot(null);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 h-full">
      <div>
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" /> Report a Win
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Got an interview or a project? Let us know so we can track how the program is working.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className={inputClass}
            value={kind}
            onChange={(e) => setKind(e.target.value as "interview" | "project")}
          >
            <option value="interview">Interview secured</option>
            <option value="project">Project secured</option>
          </select>
          <input
            className={inputClass}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company or platform (optional)"
          />
        </div>
        <textarea
          className={inputClass}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything to add (optional)"
        />
        <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
          <span className="font-bold text-indigo-600 dark:text-indigo-400">Attach a screenshot</span>
          <span className="truncate">{screenshot ? screenshot.name : "(offer letter, invite email, etc. — optional)"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> {error}
          </p>
        )}
        {done && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Thanks — logged.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Submit
        </button>
      </form>
    </div>
  );
}
