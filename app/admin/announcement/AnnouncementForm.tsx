"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { updateSiteAnnouncement } from "@/lib/actions/admin-announcement";
import type { AdminSiteAnnouncementRow } from "@/lib/admin/queries";

const inputClass =
  "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500";
const labelClass =
  "text-xs text-slate-455 font-bold uppercase tracking-wider block mb-1.5";

export default function AnnouncementForm({ announcement }: { announcement: AdminSiteAnnouncementRow }) {
  const [message, setMessage] = useState(announcement.message);
  const [linkUrl, setLinkUrl] = useState(announcement.link_url ?? "");
  const [linkLabel, setLinkLabel] = useState(announcement.link_label ?? "");
  const [isActive, setIsActive] = useState(announcement.is_active);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("message", message);
    formData.set("linkUrl", linkUrl);
    formData.set("linkLabel", linkLabel);
    formData.set("isActive", String(isActive));

    const result = await updateSiteAnnouncement(formData);
    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div>
        <label className={labelClass}>Banner Message</label>
        <textarea
          className={inputClass}
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Our next cohort starts October 1st — enroll now!"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Link URL (optional)</label>
          <input
            className={inputClass}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className={labelClass}>Link Label (optional)</label>
          <input
            className={inputClass}
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Learn More"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Show this banner on the landing page and dashboard
        </span>
      </label>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-405 font-bold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      {saved && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
      >
        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Save
      </button>
    </form>
  );
}
