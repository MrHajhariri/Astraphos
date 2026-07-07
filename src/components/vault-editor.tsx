"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateVaultFileAction } from "@/lib/actions";

export function VaultEditor({ workspaceId, file }: { workspaceId: string; file: { id: string; title: string; fileName: string; content: string } }) {
  const [title, setTitle] = useState(file.title);
  const [content, setContent] = useState(file.content);
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

      <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck className="min-h-[65vh] w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50/60 px-5 py-4 font-mono text-sm leading-7 text-zinc-900 outline-none focus:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200" placeholder="# Start writing Markdown..." />
    </div>
  );
}
