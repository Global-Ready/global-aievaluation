"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, Upload } from "lucide-react";
import { createBlogPost, updateBlogPost } from "@/lib/actions/admin-blog";
import { isRedirectError } from "@/lib/is-redirect-error";
import type { AdminBlogPostRow } from "@/lib/admin/queries";

const inputClass =
  "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500";
const labelClass =
  "text-xs text-slate-455 font-bold uppercase tracking-wider block mb-1.5";

export default function BlogPostForm({ post }: { post?: AdminBlogPostRow }) {
  const router = useRouter();
  const isEdit = !!post;

  const [id, setId] = useState(post?.id ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image_url ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [category, setCategory] = useState(post?.category ?? "");
  const [readMinutes, setReadMinutes] = useState(post?.read_minutes ? String(post.read_minutes) : "");
  const [authorName, setAuthorName] = useState(post?.author_name ?? "");
  const [authorRole, setAuthorRole] = useState(post?.author_role ?? "");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(post?.author_avatar_url ?? "");
  const [isPublished, setIsPublished] = useState(post?.is_published ?? false);
  const [sortOrder, setSortOrder] = useState(String(post?.sort_order ?? 0));

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("excerpt", excerpt);
    formData.set("content", content);
    formData.set("coverImageUrl", coverImageUrl);
    formData.set("category", category);
    formData.set("readMinutes", readMinutes);
    formData.set("authorName", authorName);
    formData.set("authorRole", authorRole);
    formData.set("authorAvatarUrl", authorAvatarUrl);
    formData.set("isPublished", String(isPublished));
    formData.set("sortOrder", sortOrder);
    if (coverImage) formData.set("coverImage", coverImage);

    try {
      const result = isEdit
        ? await updateBlogPost(post!.id, id, formData)
        : await createBlogPost(id, formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Slug / ID (used in the URL)</label>
          <input
            className={inputClass}
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. how-to-compare-two-ai-responses"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Excerpt (shown on the blog list card)</label>
          <textarea
            className={inputClass}
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Cover Image</label>
          {(coverImage || coverImageUrl) && (
            <img
              src={coverImage ? URL.createObjectURL(coverImage) : coverImageUrl}
              alt="Preview"
              className="w-full max-w-sm h-40 object-cover rounded-xl mb-2 border border-slate-150 dark:border-slate-800"
            />
          )}
          <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline mb-2">
            <Upload className="w-3.5 h-3.5" />
            {coverImageUrl || coverImage ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <input
            className={inputClass}
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="...or paste an image URL"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Content</label>
          <p className="text-[11px] text-slate-450 -mt-1 mb-2">
            Supports <code>**bold**</code>, <code>## Heading</code> / <code>### Subheading</code>, and
            links as <code>[link text](https://example.com)</code>. Leave a blank line between
            paragraphs.
          </p>
          <textarea
            className={`${inputClass} font-mono`}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Category (optional)</label>
          <input
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Evaluation Skills"
          />
        </div>
        <div>
          <label className={labelClass}>Read Time in Minutes (optional)</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={readMinutes}
            onChange={(e) => setReadMinutes(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Author Name (optional)</label>
          <input className={inputClass} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Author Role (optional)</label>
          <input className={inputClass} value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Author Avatar URL (optional)</label>
          <input
            className={inputClass}
            value={authorAvatarUrl}
            onChange={(e) => setAuthorAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className={labelClass}>Sort Order</label>
          <input
            type="number"
            className={inputClass}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is-published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="is-published" className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Published (visible on the public blog)
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-850">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-60 flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
