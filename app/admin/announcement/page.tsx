import { getAdminSiteAnnouncement } from "@/lib/admin/queries";
import AnnouncementForm from "./AnnouncementForm";

export default async function AdminAnnouncementPage() {
  const announcement = await getAdminSiteAnnouncement();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Announcement Banner</h2>
        <p className="text-xs text-slate-450 mt-1">
          Shown at the top of the public landing page and the logged-in dashboard — e.g. to
          advertise the next cohort. Turn it off when it's no longer relevant.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <AnnouncementForm announcement={announcement} />
      </div>
    </div>
  );
}
