"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateSlugId } from "@/lib/admin/validateSlugId";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const BUCKET = "blog-media";

function slugFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function uploadCoverImage(
  supabase: SupabaseServerClient,
  id: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max 5MB).`);
  }

  const path = `${id}/cover-${Date.now()}-${slugFileName(file.name)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    readMinutes: formData.get("readMinutes") ? Number(formData.get("readMinutes")) : null,
    authorName: String(formData.get("authorName") ?? "").trim(),
    authorRole: String(formData.get("authorRole") ?? "").trim(),
    authorAvatarUrl: String(formData.get("authorAvatarUrl") ?? "").trim(),
    isPublished: formData.get("isPublished") === "true",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };
}

function readFile(formData: FormData, key: string): File | null {
  const file = formData.get(key);
  return file instanceof File && file.size > 0 ? file : null;
}

export async function createBlogPost(id: string, formData: FormData): Promise<{ error?: string }> {
  const idError = validateSlugId(id);
  if (idError) return { error: idError };

  const supabase = await createClient();
  const fields = readFields(formData);

  if (!fields.title) return { error: "Title is required." };

  let coverImageUrl = fields.coverImageUrl || null;
  const coverImage = readFile(formData, "coverImage");
  if (coverImage) {
    try {
      coverImageUrl = await uploadCoverImage(supabase, id, coverImage);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Upload failed." };
    }
  }

  const { error } = await supabase.from("blog_posts").insert({
    id,
    title: fields.title,
    excerpt: fields.excerpt || null,
    content: fields.content,
    cover_image_url: coverImageUrl,
    category: fields.category || null,
    read_minutes: fields.readMinutes,
    author_name: fields.authorName || null,
    author_role: fields.authorRole || null,
    author_avatar_url: fields.authorAvatarUrl || null,
    is_published: fields.isPublished,
    published_at: fields.isPublished ? new Date().toISOString() : null,
    sort_order: fields.sortOrder,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updateBlogPost(
  oldId: string,
  newId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const idError = validateSlugId(newId);
  if (idError) return { error: idError };

  const supabase = await createClient();
  const fields = readFields(formData);

  if (!fields.title) return { error: "Title is required." };

  let coverImageUrl = fields.coverImageUrl || null;
  const coverImage = readFile(formData, "coverImage");
  if (coverImage) {
    try {
      coverImageUrl = await uploadCoverImage(supabase, newId, coverImage);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Upload failed." };
    }
  }

  // Was it already published before this save? Only stamp published_at the
  // first time a post goes live, so re-saving doesn't bump its date.
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("is_published, published_at")
    .eq("id", oldId)
    .maybeSingle();

  const publishedAt = fields.isPublished
    ? existing?.published_at ?? new Date().toISOString()
    : null;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      id: newId,
      title: fields.title,
      excerpt: fields.excerpt || null,
      content: fields.content,
      cover_image_url: coverImageUrl,
      category: fields.category || null,
      read_minutes: fields.readMinutes,
      author_name: fields.authorName || null,
      author_role: fields.authorRole || null,
      author_avatar_url: fields.authorAvatarUrl || null,
      is_published: fields.isPublished,
      published_at: publishedAt,
      sort_order: fields.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", oldId);

  if (error) return { error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${newId}`);
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return {};
}
