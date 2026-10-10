import React from "react";
import type { CaseStudyMediaItem } from "../types";

// Shared between LessonView (the live student-facing page) and the admin's
// Content Blocks editor (as a live preview), so both agree on exactly what
// "**bold**" / "## heading" / bullet syntax renders as.
// Renders "\n" as line breaks so a blank line typed between two paragraphs
// (e.g. "**Response A:**\n\n...\n\n**Response B:**\n\n...") stays visually
// separated instead of collapsing onto one line — this is what plain HTML
// does with whitespace by default, since callers pass raw multi-line text
// straight through rather than pre-splitting it into lines first.
// Matches markdown-style "[label](https://example.com)" links.
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

// A bare YouTube URL on its own line (no "[label](...)" wrapping — that's
// treated as an explicit text link instead, see below) auto-embeds as a
// player, matching how pasting a link into Notion/Medium behaves. Covers
// watch?v=, youtu.be, embed/, and shorts/ URLs, with any trailing query
// string (?si=, &t=, etc.) ignored.
const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;

function getYouTubeEmbedId(line: string): string | null {
  const m = line.trim().match(YOUTUBE_URL_PATTERN);
  return m ? m[1] : null;
}

function renderYouTubeEmbed(videoId: string, key: number | string) {
  return (
    <div key={key} className="relative w-full max-w-xl aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Embedded video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

function renderLineWithLinks(line: string, keyPrefix: string): React.ReactNode {
  if (!line.includes("](")) return line;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let linkIndex = 0;
  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }
    nodes.push(
      <a
        key={`${keyPrefix}-link-${linkIndex++}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300"
      >
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) nodes.push(line.slice(lastIndex));
  return nodes;
}

function renderTextWithLineBreaks(part: string, keyPrefix: string) {
  const lines = part.split("\n");
  return lines.map((line, i) => (
    <React.Fragment key={`${keyPrefix}-${i}`}>
      {i > 0 && <br />}
      {renderLineWithLinks(line, `${keyPrefix}-${i}`)}
    </React.Fragment>
  ));
}

export function renderFormattedText(text: string) {
  if (!text.includes("**")) {
    return <span>{renderTextWithLineBreaks(text, "l")}</span>;
  }
  const parts = text.split("**");
  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} className="font-extrabold text-slate-900 dark:text-white">
              {renderTextWithLineBreaks(part, `${index}`)}
            </strong>
          );
        }
        return (
          <React.Fragment key={index}>
            {renderTextWithLineBreaks(part, `${index}`)}
          </React.Fragment>
        );
      })}
    </span>
  );
}

function headingMatch(line: string): { level: 2 | 3; text: string } | null {
  const m = line.match(/^(#{2,3})\s+(.*)/);
  if (!m) return null;
  return { level: m[1].length === 2 ? 2 : 3, text: m[2] };
}

function renderHeading(level: 2 | 3, text: string, key: number | string) {
  return level === 2 ? (
    <h3 key={key} className="text-base font-extrabold text-slate-900 dark:text-white pt-2">
      {renderFormattedText(text)}
    </h3>
  ) : (
    <h4 key={key} className="text-sm font-extrabold text-slate-800 dark:text-slate-100 pt-1">
      {renderFormattedText(text)}
    </h4>
  );
}

function renderBlockMedia(media: CaseStudyMediaItem | undefined, key: number | string) {
  if (!media) return null;
  if (media.type === "image") {
    return <img key={key} src={media.url} alt="" className="rounded-xl max-h-80 w-auto object-contain" />;
  }
  if (media.type === "video") {
    return (
      <video key={key} src={media.url} controls className="rounded-xl max-h-80 w-auto bg-black" />
    );
  }
  return <audio key={key} src={media.url} controls className="w-full max-w-md" />;
}

export function renderLessonParagraph(p: string, pIndex: number | string, media?: CaseStudyMediaItem) {
  if (!p.includes("\n")) {
    const videoId = getYouTubeEmbedId(p);
    if (videoId) return renderYouTubeEmbed(videoId, pIndex);

    const asHeading = headingMatch(p.trim());
    if (asHeading) {
      return (
        <React.Fragment key={pIndex}>
          {renderHeading(asHeading.level, asHeading.text, `${pIndex}-h`)}
          {renderBlockMedia(media, `${pIndex}-m`)}
        </React.Fragment>
      );
    }
    return (
      <div key={pIndex} className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-350">
          {renderFormattedText(p)}
        </p>
        {renderBlockMedia(media, `${pIndex}-m`)}
      </div>
    );
  }

  const lines = p.split("\n");
  return (
    <div key={pIndex} className="space-y-2.5 my-3">
      {lines.map((line, lIndex) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIndex} className="h-2" />;

        const videoId = getYouTubeEmbedId(trimmed);
        if (videoId) return renderYouTubeEmbed(videoId, lIndex);

        const asHeading = headingMatch(trimmed);
        if (asHeading) return renderHeading(asHeading.level, asHeading.text, lIndex);

        // Check for bullet list (e.g. "• text", "- text", "* text"). Requires
        // a space after the marker so a bold-opening "**text**" line (no
        // space between the two asterisks) is never mistaken for a bullet.
        const bulletMatch = trimmed.match(/^([•\-\*])\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={lIndex} className="flex items-start gap-2.5 pl-4 animate-fade-in">
              <span className="text-[#4F46E5] dark:text-indigo-400 font-extrabold select-none mt-0.5 shrink-0 text-base leading-none">
                •
              </span>
              <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-350 flex-1">
                {renderFormattedText(bulletMatch[2])}
              </span>
            </div>
          );
        }

        // Check for numbered list (e.g. 1. 2.)
        const numberMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numberMatch) {
          return (
            <div key={lIndex} className="flex items-start gap-2.5 pl-4 animate-fade-in">
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded-md min-w-[20px] text-center select-none shrink-0 mt-0.5 leading-none">
                {numberMatch[1]}
              </span>
              <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-350 flex-1">
                {renderFormattedText(numberMatch[2])}
              </span>
            </div>
          );
        }

        return (
          <p key={lIndex} className="text-sm leading-relaxed text-slate-700 dark:text-slate-350">
            {renderFormattedText(line)}
          </p>
        );
      })}
      {renderBlockMedia(media, `${pIndex}-m`)}
    </div>
  );
}
