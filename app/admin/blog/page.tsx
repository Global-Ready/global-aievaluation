import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminBlogPosts } from "@/lib/admin/queries";
import DeleteButton from "../DeleteButton";
import { deleteBlogPost } from "@/lib/actions/admin-blog";

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Blog</h2>
        <Link
          href="/admin/blog/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {p.title}
                  <div className="text-slate-400 font-normal font-mono">{p.id}</div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.category ?? "—"}</td>
                <td className="px-4 py-3">
                  {p.is_published ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Published</span>
                  ) : (
                    <span className="text-slate-400">Draft</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    href={`/admin/blog/${p.id}`}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={p.id} action={deleteBlogPost} label={p.title} />
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No blog posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
