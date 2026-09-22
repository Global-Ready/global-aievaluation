import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, ArrowLeft, BookOpen, ClipboardCheck, Quote, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Belt-and-suspenders alongside the /admin disallow in app/robots.ts —
// these routes already redirect non-admins away server-side, but a bare
// noindex costs nothing.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect("/");
  }

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: freeCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("membership_tier", "free");

  const paidCount = (userCount ?? 0) - (freeCount ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <aside className="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen p-5 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Admin
          </span>
          <h1 className="text-sm font-black text-slate-900 dark:text-white">
            Content Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              Total Users
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {userCount ?? 0}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Free
              </p>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {freeCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Paid
              </p>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {paidCount}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          <Link
            href="/admin/modules"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Modules
          </Link>
          <Link
            href="/admin/practice-tasks"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            Real World Practice
          </Link>
          <Link
            href="/admin/jobs"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            Jobs
          </Link>
          <Link
            href="/admin/testimonials"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 transition-colors"
          >
            <Quote className="w-4 h-4" />
            Testimonials
          </Link>
          <Link
            href="/admin/affiliates"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 transition-colors"
          >
            <Gift className="w-4 h-4" />
            Affiliates
          </Link>
        </nav>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-6xl">{children}</main>
    </div>
  );
}
