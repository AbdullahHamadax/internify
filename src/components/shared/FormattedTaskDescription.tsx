"use client";

import { useMemo } from "react";

// Turn a long run-on task description into something readable, regardless of
// how it was written. Handles three signals, in order of reliability:
//   1. Inline headings like "Milestone 1:", "Deliverables:", "Requirements:"
//   2. Explicit line breaks and bullet markers (-, *, •, "1.", "2)")
//   3. Plain run-on paragraphs — split into sentence-grouped chunks so they
//      don't render as an unreadable wall of text.

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

const LABEL_REGEX =
  /(?:^|(?<=[.!?])\s+)([A-Z][A-Za-z]*(?:\s+(?:[A-Z][A-Za-z]*|\d+)){0,3}\s*:)/g;
const BULLET_REGEX = /^\s*(?:[-*•]|\d+[.)])\s+/;
// Split into sentences while keeping the terminating punctuation.
const SENTENCE_REGEX = /[^.!?]+[.!?]+(?:["')\]]+)?|\S[^.!?]*$/g;

// Break one chunk of prose into paragraph / list blocks.
function parseBody(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  let pendingList: string[] = [];
  let pendingProse: string[] = [];

  const flushList = () => {
    if (pendingList.length) {
      blocks.push({ kind: "list", items: pendingList });
      pendingList = [];
    }
  };
  const flushProse = () => {
    if (pendingProse.length) {
      blocks.push(...proseToParagraphs(pendingProse.join(" ")));
      pendingProse = [];
    }
  };

  for (const line of lines) {
    if (!line) {
      // Blank line = paragraph boundary.
      flushList();
      flushProse();
      continue;
    }
    if (BULLET_REGEX.test(line)) {
      flushProse();
      pendingList.push(line.replace(BULLET_REGEX, "").trim());
    } else {
      flushList();
      pendingProse.push(line);
    }
  }
  flushList();
  flushProse();

  return blocks;
}

// Group a run-on paragraph into ~2-sentence paragraphs so long blocks of prose
// stay readable. Short paragraphs are left as a single block.
function proseToParagraphs(text: string): Block[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= 240) return [{ kind: "paragraph", text: trimmed }];

  const sentences = trimmed.match(SENTENCE_REGEX)?.map((s) => s.trim()) ?? [
    trimmed,
  ];

  const paragraphs: Block[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const sentence of sentences) {
    current.push(sentence);
    currentLen += sentence.length;
    // Start a new paragraph after ~2 sentences or once it gets long.
    if (current.length >= 2 && currentLen >= 160) {
      paragraphs.push({ kind: "paragraph", text: current.join(" ") });
      current = [];
      currentLen = 0;
    }
  }
  if (current.length) {
    paragraphs.push({ kind: "paragraph", text: current.join(" ") });
  }
  return paragraphs;
}

function parseDescription(text: string): Block[] {
  const source = text.trim();
  if (!source) return [];

  const matches = Array.from(source.matchAll(LABEL_REGEX));
  if (matches.length === 0) {
    return parseBody(source);
  }

  const blocks: Block[] = [];

  const intro = source.slice(0, matches[0].index).trim();
  if (intro) blocks.push(...parseBody(intro));

  matches.forEach((match, i) => {
    blocks.push({ kind: "heading", text: match[1].replace(/\s*:$/, "").trim() });
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd =
      i + 1 < matches.length ? matches[i + 1].index : source.length;
    const body = source.slice(bodyStart, bodyEnd).trim();
    if (body) blocks.push(...parseBody(body));
  });

  return blocks;
}

export default function FormattedTaskDescription({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = useMemo(() => parseDescription(text), [text]);

  return (
    <div className={className ?? "space-y-3"}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          // Bold, brutalist section heading with an accent square marker.
          // Extra top spacing (unless it's the very first block) so each
          // section reads as its own visual unit.
          return (
            <div
              key={i}
              className={`flex items-center gap-2 ${i === 0 ? "" : "pt-1.5"}`}
            >
              <span className="h-3 w-3 shrink-0 rotate-45 border-2 border-foreground bg-[#FDE68A]" />
              <span className="text-xs font-black uppercase tracking-widest text-foreground">
                {block.text}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-foreground">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
