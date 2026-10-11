"use client";

import { useRef, type KeyboardEvent } from "react";
import { Bold, Link as LinkIcon, Video, Image as ImageIcon, ImagePlus } from "lucide-react";
import { renderFormattedText, renderLessonParagraph } from "@/components/LessonContentRenderer";

const DEFAULT_CLASS =
  "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500";

interface BoldTextareaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  required?: boolean;
  showPreview?: boolean;
  // Adds YouTube / Image / Image+Link buttons alongside Bold/Link — for
  // long-form content fields (e.g. blog posts), not short free-text ones.
  showMediaEmbeds?: boolean;
}

// Reusable "**bold**" toggle for admin free-text fields — highlight text,
// click Bold (or Ctrl/Cmd+B) to wrap/unwrap it. Same behavior as the
// original Content Blocks editor toggle, factored out so every admin text
// field that renders to students can offer it consistently.
export default function BoldTextarea({
  value,
  onChange,
  rows = 3,
  placeholder,
  className,
  required,
  showPreview = true,
  showMediaEmbeds = false,
}: BoldTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const toggleBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart: start, selectionEnd: end } = textarea;
    if (start === end) return; // nothing highlighted

    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);

    let nextText: string;
    let newStart: number;
    let newEnd: number;

    if (selected.length >= 4 && selected.startsWith("**") && selected.endsWith("**")) {
      const inner = selected.slice(2, -2);
      nextText = before + inner + after;
      newStart = start;
      newEnd = start + inner.length;
    } else if (before.endsWith("**") && after.startsWith("**")) {
      nextText = before.slice(0, -2) + selected + after.slice(2);
      newStart = start - 2;
      newEnd = end - 2;
    } else {
      nextText = `${before}**${selected}**${after}`;
      newStart = start + 2;
      newEnd = end + 2;
    }

    onChange(nextText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    });
  };

  // Wraps the selection (or inserts a placeholder) as "[label](url)", the
  // same link syntax renderFormattedText knows how to render as a real <a>.
  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart: start, selectionEnd: end } = textarea;
    const selected = value.slice(start, end);

    const url = window.prompt("Link URL", "https://");
    if (!url) return;

    const before = value.slice(0, start);
    const after = value.slice(end);
    const inserted = `[${selected || "link text"}](${url})`;
    const nextText = before + inserted + after;

    onChange(nextText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + inserted.length);
    });
  };

  // Inserts text on its own line (blank lines around it as needed) —
  // renderLessonParagraph auto-embeds a line that's nothing but a YouTube
  // link, an image URL, or "[img:URL](linkURL)" as a video/image.
  const insertOwnLine = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart: start, selectionEnd: end } = textarea;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const leadBreak = before.length > 0 && !before.endsWith("\n") ? "\n\n" : "";
    const trailBreak = after.length > 0 && !after.startsWith("\n") ? "\n\n" : "";
    const inserted = `${leadBreak}${text}${trailBreak}`;
    const nextText = before + inserted + after;

    onChange(nextText);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + inserted.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const insertYouTubeEmbed = () => {
    const url = window.prompt("YouTube video URL", "https://youtu.be/");
    if (!url) return;
    insertOwnLine(url);
  };

  const insertImage = () => {
    const url = window.prompt("Image URL", "https://");
    if (!url) return;
    insertOwnLine(url);
  };

  const insertImageWithLink = () => {
    const imageUrl = window.prompt("Image URL", "https://");
    if (!imageUrl) return;
    const linkUrl = window.prompt("Where should clicking the image go?", "https://");
    if (!linkUrl) return;
    insertOwnLine(`[img:${imageUrl}](${linkUrl})`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleBold();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertLink();
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleBold}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
          title="Bold selected text (Ctrl/Cmd+B)"
        >
          <Bold className="w-3 h-3" />
          Bold
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLink}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
          title="Insert link (Ctrl/Cmd+K)"
        >
          <LinkIcon className="w-3 h-3" />
          Link
        </button>
        {showMediaEmbeds && (
          <>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertYouTubeEmbed}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
              title="Embed a YouTube video"
            >
              <Video className="w-3 h-3" />
              YouTube
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertImage}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
              title="Insert an image"
            >
              <ImageIcon className="w-3 h-3" />
              Image
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertImageWithLink}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850"
              title="Insert an image that links somewhere when clicked"
            >
              <ImagePlus className="w-3 h-3" />
              Image + Link
            </button>
          </>
        )}
      </div>
      <textarea
        ref={textareaRef}
        className={className ?? DEFAULT_CLASS}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
      />
      {showPreview && value.trim() && (
        <div className="rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preview</p>
          {showMediaEmbeds ? (
            <div className="space-y-2">{renderLessonParagraph(value, "preview")}</div>
          ) : (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{renderFormattedText(value)}</p>
          )}
        </div>
      )}
    </div>
  );
}
