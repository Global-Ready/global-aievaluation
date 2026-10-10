import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper, Clock, ArrowRight } from "lucide-react";
import { getPublishedBlogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides, methodology, and practical advice for AI evaluators and data annotators.",
};

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/assets/images/logos/global-logo.png" alt="Global Ready AIEval" width={22} height={22} />
            <span className="text-base font-extrabold text-[#3B28CC] dark:text-indigo-400 tracking-tight">
              Global Ready AIEval
            </span>
          </Link>
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Newspaper className="w-3.5 h-3.5" /> Blog
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Guides &amp; Insights for AI Evaluators
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Practical guides, methodology, and preparation advice for human feedback raters and AI evaluators.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Newspaper className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">No articles published yet</p>
            <p className="text-xs text-slate-450 mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col"
              >
                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-850 relative overflow-hidden">
                  {post.coverImageUrl ? (
                    <img src={post.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    {post.category && (
                      <span className="text-indigo-600 dark:text-indigo-400">{post.category}</span>
                    )}
                    {post.readMinutes && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readMinutes} min read
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-auto pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-450">{post.authorName ?? ""}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                      Read article <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 dark:from-indigo-500/5 dark:to-emerald-500/5 border border-indigo-500/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Ready to try it yourself?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Put what you&apos;ve read into practice with real AI evaluation exercises.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
