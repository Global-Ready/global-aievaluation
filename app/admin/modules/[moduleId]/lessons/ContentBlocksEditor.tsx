"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Upload, Trash2, X, Image as ImageIcon, Video, Music, Bold, Link as LinkIcon, Loader2 } from "lucide-react";
import type { AdminContentBlock } from "@/lib/admin/queries";
import { htmlClipboardToMarkdown } from "@/lib/paste-to-markdown";
import { renderLessonParagraph } from "@/components/LessonContentRenderer";
import { uploadMediaClip, removeMediaClip } from "@/lib/supabase/upload-media";

const MAX_CLIP_SECONDS = 10;

const inputClass =
  "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readClipDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src);
      resolve(el.duration);
    };
    el.onerror = () => {
      URL.revokeObjectURL(el.src);
      reject(new Error("Could not read that file's duration."));
    };
    el.src = URL.createObjectURL(file);
  });
}

interface ContentBlocksEditorProps {
  lessonId: string;
  blocks: AdminContentBlock[];
  onChange: (blocks: AdminContentBlock[]) => void;
}

// Media uploads straight to Supabase on selection (see
// lib/supabase/upload-media.ts) instead of being held as a pending File for
// the form's "use server" action to upload later — that path 413'd on
// anything but the smallest clips, since Vercel caps a server action's
// request body well below the app's own 20MB limit. Once uploaded, the
// result is merged straight into the block's `media` array, same as
// pre-existing media — there's no separate "pending" media concept anymore.
export default function ContentBlocksEditor({ lessonId, blocks, onChange }: ContentBlocksEditorProps) {
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<Record<string, string>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const updateBlock = (idx: number, patch: Partial<AdminContentBlock>) => {
    const next = [...blocks];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const addBlock = () =>
    onChange([...blocks, { id: newId("block"), text: "", media: [] }]);

  const handlePaste = (idx: number, e: ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData("text/html");
    if (!html) return; // plain-text paste — let the browser handle it normally

    const markdown = htmlClipboardToMarkdown(html);
    if (!markdown) return;

    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const current = blocks[idx].text;
    const nextText = current.slice(0, start) + markdown + current.slice(end);
    updateBlock(idx, { text: nextText });
  };

  const toggleBold = (idx: number) => {
    const textarea = textareaRefs.current[blocks[idx].id];
    if (!textarea) return;

    const { selectionStart: start, selectionEnd: end } = textarea;
    if (start === end) return; // nothing highlighted

    const text = blocks[idx].text;
    const before = text.slice(0, start);
    const selected = text.slice(start, end);
    const after = text.slice(end);

    let nextText: string;
    let newStart: number;
    let newEnd: number;

    if (selected.length >= 4 && selected.startsWith("**") && selected.endsWith("**")) {
      // Selection includes the ** markers themselves (e.g. the admin
      // triple-clicked the whole "**word**") — strip them from inside.
      const inner = selected.slice(2, -2);
      nextText = before + inner + after;
      newStart = start;
      newEnd = start + inner.length;
    } else if (before.endsWith("**") && after.startsWith("**")) {
      // Selection sits just inside existing markers — strip the adjacent ones.
      nextText = before.slice(0, -2) + selected + after.slice(2);
      newStart = start - 2;
      newEnd = end - 2;
    } else {
      // Not bold yet — wrap it.
      nextText = `${before}**${selected}**${after}`;
      newStart = start + 2;
      newEnd = end + 2;
    }

    updateBlock(idx, { text: nextText });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    });
  };

  // Wraps the selection (or inserts a placeholder) as "[label](url)", the
  // same link syntax renderFormattedText/renderLessonParagraph render as a
  // real <a>.
  const insertLink = (idx: number) => {
    const textarea = textareaRefs.current[blocks[idx].id];
    if (!textarea) return;

    const { selectionStart: start, selectionEnd: end } = textarea;
    const text = blocks[idx].text;
    const selected = text.slice(start, end);

    const url = window.prompt("Link URL", "https://");
    if (!url) return;

    const before = text.slice(0, start);
    const after = text.slice(end);
    const inserted = `[${selected || "link text"}](${url})`;
    const nextText = before + inserted + after;

    updateBlock(idx, { text: nextText });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + inserted.length);
    });
  };

  // Inserts a YouTube URL on its own line — renderLessonParagraph (used for
  // both this live preview and the actual lesson page) auto-embeds any
  // line that's nothing but a YouTube link as a video player.
  const insertYouTubeEmbed = (idx: number) => {
    const textarea = textareaRefs.current[blocks[idx].id];
    if (!textarea) return;

    const url = window.prompt("YouTube video URL", "https://youtu.be/");
    if (!url) return;

    const { selectionStart: start, selectionEnd: end } = textarea;
    const text = blocks[idx].text;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const leadBreak = before.length > 0 && !before.endsWith("\n") ? "\n\n" : "";
    const trailBreak = after.length > 0 && !after.startsWith("\n") ? "\n\n" : "";
    const inserted = `${leadBreak}${url}${trailBreak}`;
    const nextText = before + inserted + after;

    updateBlock(idx, { text: nextText });
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + inserted.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleBold(idx);
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertLink(idx);
    }
  };

  const removeBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const removeMedia = (idx: number) => {
    const existing = blocks[idx].media?.[0];
    if (existing?.path) removeMediaClip("lesson-media", existing.path).catch(() => {});
    updateBlock(idx, { media: [] });
  };

  const handleAddMedia = async (
    idx: number,
    type: "image" | "video" | "audio",
    file: File | null,
  ) => {
    if (!file) return;
    const blockId = blocks[idx].id;
    setMediaError((prev) => ({ ...prev, [blockId]: "" }));

    if (type !== "image") {
      try {
        const duration = await readClipDuration(file);
        if (duration > MAX_CLIP_SECONDS) {
          setMediaError((prev) => ({
            ...prev,
            [blockId]: `That ${type} is ${duration.toFixed(1)}s long. Clips must be ${MAX_CLIP_SECONDS}s or less.`,
          }));
          return;
        }
      } catch {
        setMediaError((prev) => ({ ...prev, [blockId]: "Could not read that file's duration." }));
        return;
      }
    }

    setUploadingBlockId(blockId);
    try {
      const existing = blocks[idx].media?.[0];
      const media = await uploadMediaClip("lesson-media", `${lessonId}/${blockId}`, type, file);
      if (existing?.path) removeMediaClip("lesson-media", existing.path).catch(() => {});
      updateBlock(idx, { media: [media] });
    } catch (err) {
      setMediaError((prev) => ({
        ...prev,
        [blockId]: err instanceof Error ? err.message : "Upload failed.",
      }));
    } finally {
      setUploadingBlockId(null);
    }
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        const existing = block.media?.[0];
        const isUploading = uploadingBlockId === block.id;

        return (
          <div
            key={block.id}
            className="border border-slate-200 dark:border-slate-850 rounded-xl p-3 space-y-2.5"
          >
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-mono text-slate-400 mt-2.5 shrink-0 w-4 text-right">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggleBold(idx)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
                    title="Bold selected text (Ctrl/Cmd+B)"
                  >
                    <Bold className="w-3 h-3" />
                    Bold
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertLink(idx)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
                    title="Insert link (Ctrl/Cmd+K)"
                  >
                    <LinkIcon className="w-3 h-3" />
                    Link
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertYouTubeEmbed(idx)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
                    title="Embed a YouTube video"
                  >
                    <Video className="w-3 h-3" />
                    YouTube
                  </button>
                </div>
                <textarea
                  ref={(el) => {
                    textareaRefs.current[block.id] = el;
                  }}
                  className={inputClass}
                  rows={4}
                  value={block.text}
                  onChange={(e) => updateBlock(idx, { text: e.target.value })}
                  onPaste={(e) => handlePaste(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  placeholder="Lecture paragraph text... (pasting from Word/ChatGPT/Claude keeps bold headings)"
                />
                {block.text.trim() && (
                  <div className="rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Preview (how this looks to students)
                    </p>
                    {renderLessonParagraph(block.text, block.id)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeBlock(idx)}
                className="text-rose-500 hover:text-rose-600 shrink-0 mt-2"
                title="Remove block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pl-6 space-y-2">
              {existing && (
                <div className="flex items-start gap-2">
                  {existing.type === "image" ? (
                    <img src={existing.url} alt="" className="max-h-32 rounded-lg" />
                  ) : existing.type === "video" ? (
                    <video src={existing.url} controls className="max-h-32 rounded-lg bg-black" />
                  ) : (
                    <audio src={existing.url} controls className="w-full max-w-xs" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="text-rose-500 hover:text-rose-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isUploading ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-450">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                </span>
              ) : (
                !existing && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Add image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAddMedia(idx, "image", e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                      <Video className="w-3.5 h-3.5" />
                      Add video
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleAddMedia(idx, "video", e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                      <Music className="w-3.5 h-3.5" />
                      Add audio
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleAddMedia(idx, "audio", e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                )
              )}
              {mediaError[block.id] && (
                <p className="text-[11px] text-red-500 font-semibold">{mediaError[block.id]}</p>
              )}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addBlock}
        className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline flex items-center gap-1"
      >
        <Upload className="w-3.5 h-3.5" />
        + Add Content Block
      </button>
    </div>
  );
}
