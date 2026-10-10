import { notFound } from "next/navigation";
import { getAdminBlogPost } from "@/lib/admin/queries";
import BlogPostForm from "../BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminBlogPost(id);

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">Edit Blog Post</h2>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <BlogPostForm post={post} />
      </div>
    </div>
  );
}
