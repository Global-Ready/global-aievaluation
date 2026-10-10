import BlogPostForm from "../BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">New Blog Post</h2>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <BlogPostForm />
      </div>
    </div>
  );
}
