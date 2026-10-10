import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { getPublishedBlogPost } from "@/lib/content";
import { renderLessonParagraph } from "@/components/LessonContentRenderer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublishedBlogPost(id);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPublishedBlogPost(id);

  if (!post) notFound();

  const paragraphs = post.content.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <article className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <Link
          href="/blog"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
        </Link>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            {post.category && <span className="text-indigo-600 dark:text-indigo-400">{post.category}</span>}
            {post.readMinutes && (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readMinutes} min read
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {post.title}
          </h1>
          {(post.authorName || post.publishedAt) && (
            <div className="flex items-center gap-2.5 pt-1">
              {post.authorAvatarUrl && (
                <img src={post.authorAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              )}
              <div className="text-xs">
                {post.authorName && <p className="font-bold text-slate-800 dark:text-slate-200">{post.authorName}</p>}
                <p className="text-slate-450">
                  {post.authorRole}
                  {post.authorRole && post.publishedAt && " · "}
                  {post.publishedAt && new Date(post.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {post.coverImageUrl && (
          <img src={post.coverImageUrl} alt="" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800" />
        )}

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
          {paragraphs.map((p, i) => renderLessonParagraph(p, i))}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-850">
          <Link
            href="/blog"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
          </Link>
        </div>
      </article>
    </div>
  );
}
