import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function isSafeLink(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function renderInline(text: string): React.ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenPattern);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-zinc-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 font-mono text-[0.85em] border border-zinc-200/80 dark:border-zinc-700/80"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (isSafeLink(href)) {
        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
          >
            {label}
          </a>
        );
      }
      return label;
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function FencedCodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xs">
      <div className="px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span className="inline-flex items-center gap-1.5 uppercase tracking-wider font-semibold text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Salin Kode</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-[13px] leading-relaxed font-mono text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderTextBlocks(segment: string, keyPrefix: string): React.ReactNode[] {
  const lines = segment.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h3
          key={`${keyPrefix}-h3-${i}`}
          className="pt-3 pb-1 text-base sm:text-lg font-bold font-display text-zinc-950 dark:text-white border-b border-zinc-200/70 dark:border-zinc-800"
        >
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h2
          key={`${keyPrefix}-h2-${i}`}
          className="pt-4 pb-1 text-lg sm:text-xl font-bold font-display text-zinc-950 dark:text-white tracking-tight"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h1
          key={`${keyPrefix}-h1-${i}`}
          className="pt-2 pb-1 text-xl sm:text-2xl font-bold font-display text-zinc-950 dark:text-white tracking-tight"
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Blockquote group
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push(
        <blockquote
          key={`${keyPrefix}-bq-${i}`}
          className="my-3 pl-4 pr-4 py-3 rounded-r-xl border-l-4 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-1"
        >
          {quoteLines.map((q, qIdx) => (
            <p key={qIdx}>{renderInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Markdown table (| a | b |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines
        .filter((row) => !/^\|[\s:-]+\|$/.test(row.replace(/\|/g, "|").replace(/[^|\s:-]/g, "")))
        .filter((row) => !/^(\|\s*:?-+:?\s*)+\|$/.test(row))
        .map((row) =>
          row
            .slice(1, -1)
            .split("|")
            .map((cell) => cell.trim())
        );

      if (rows.length > 0) {
        const [header, ...bodyRows] = rows;
        nodes.push(
          <div key={`${keyPrefix}-tbl-${i}`} className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold">
                <tr>
                  {header.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-700">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Bullet or numbered list
    if (/^([-*]|\d+\.)\s+/.test(trimmed)) {
      const isOrdered = /^\d+\.\s+/.test(trimmed);
      const listItems: string[] = [];
      while (i < lines.length && /^([-*]|\d+\.)\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^([-*]|\d+\.)\s+/, ""));
        i++;
      }
      nodes.push(
        isOrdered ? (
          <ol key={`${keyPrefix}-ol-${i}`} className="my-2.5 space-y-2 list-decimal pl-5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {listItems.map((item, lIdx) => (
              <li key={lIdx} className="pl-1">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        ) : (
          <ul key={`${keyPrefix}-ul-${i}`} className="my-2.5 space-y-2 pl-1">
            {listItems.map((item, lIdx) => (
              <li key={lIdx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-2" />
                <div>{renderInline(item)}</div>
              </li>
            ))}
          </ul>
        )
      );
      continue;
    }

    // Paragraph (gather consecutive plain lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("> ") &&
      !lines[i].trim().startsWith("|") &&
      !/^([-*]|\d+\.)\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    nodes.push(
      <p key={`${keyPrefix}-p-${i}`} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {renderInline(paraLines.join(" "))}
      </p>
    );
  }

  return nodes;
}

/**
 * Safe React Markdown renderer supporting headings, lists, blockquotes,
 * tables, inline code/links/bold, and fenced code blocks with copy button.
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const safeContent = typeof content === "string" ? content : "";
  const fenceRegex = /```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIdx = 0;

  while ((match = fenceRegex.exec(safeContent)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = safeContent.slice(lastIndex, match.index);
      elements.push(...renderTextBlocks(textBefore, `seg-${blockIdx++}`));
    }
    elements.push(
      <FencedCodeBlock
        key={`code-${blockIdx++}`}
        language={match[1] || "code"}
        code={match[2].replace(/\n$/, "")}
      />
    );
    lastIndex = fenceRegex.lastIndex;
  }

  if (lastIndex < safeContent.length) {
    elements.push(...renderTextBlocks(safeContent.slice(lastIndex), `seg-${blockIdx++}`));
  }

  return <div className={`space-y-3 ${className}`}>{elements}</div>;
}
