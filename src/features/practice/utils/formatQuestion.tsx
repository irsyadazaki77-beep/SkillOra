import React from "react";

export function RenderFormattedQuestion({ text }: { text: string }) {
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts = text.split(codeBlockRegex);

  if (parts.length > 1) {
    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <div key={index} className="my-3 rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 text-xs text-slate-500 font-sans uppercase font-bold">
                  <span>Kode Contoh</span>
                  <span>JSX / TS</span>
                </div>
                <pre className="whitespace-pre-wrap">{part.trim()}</pre>
              </div>
            );
          }
          return (
            <p key={index} className="leading-relaxed font-medium">
              {part}
            </p>
          );
        })}
      </div>
    );
  }

  const inlineParts = text.split(/`([^`]+)`/g);
  return (
    <p className="leading-relaxed font-medium">
      {inlineParts.map((part, i) => (
        i % 2 === 1 ? (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-800 text-emerald-300 font-mono text-xs border border-slate-700">
            {part}
          </code>
        ) : (
          part
        )
      ))}
    </p>
  );
}
