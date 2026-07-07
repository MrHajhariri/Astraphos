"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { updateVaultFileAction } from "@/lib/actions";

export function VaultEditor({ workspaceId, file }: { workspaceId: string; file: { id: string; title: string; fileName: string; content: string } }) {
  const [title, setTitle] = useState(file.title);
  const [content, setContent] = useState(file.content);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateVaultFileAction({ workspaceId, fileId: file.id, title, content });
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full bg-transparent text-4xl font-bold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300 dark:text-zinc-50 dark:placeholder:text-zinc-700" placeholder="Untitled" />
          <p className="mt-1 text-sm text-zinc-500">{file.fileName}</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
          <Save size={16} /> {pending ? "Saving" : "Save"}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["edit", "preview", "split"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-full px-3 py-1.5 text-sm capitalize ${mode === item ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>
              {item}
            </button>
          ))}
        </div>
        <p className="text-sm text-zinc-500">{content.trim().split(/\s+/).filter(Boolean).length} words · {content.length} chars</p>
      </div>

      <div className={`grid gap-4 ${mode === "split" ? "lg:grid-cols-2" : ""}`}>
        {mode !== "preview" ? (
          <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck className="min-h-[65vh] w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50/60 px-5 py-4 font-mono text-sm leading-7 text-zinc-900 outline-none focus:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200" placeholder="# Start writing Markdown..." />
        ) : null}
        {mode !== "edit" ? (
          <div className="prose prose-zinc min-h-[65vh] max-w-none rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:prose-invert dark:border-zinc-800 dark:bg-zinc-950">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}
