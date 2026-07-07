"use client";

import { useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Save } from "lucide-react";
import { updateTemplateContentAction } from "@/lib/actions";

export function TemplateEditor({ workspaceId, template }: { workspaceId: string; template: { id: string; name: string; description: string | null; content: JSONContent } }) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [pending, startTransition] = useTransition();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Write template content..." })],
    content: template.content,
    editorProps: { attributes: { class: "prose prose-zinc max-w-none focus:outline-none dark:prose-invert min-h-[50vh]" } },
  });

  function save() {
    if (!editor) return;
    startTransition(async () => {
      await updateTemplateContentAction({ workspaceId, templateId: template.id, name, description, content: editor.getJSON() });
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10">
      <input value={name} onChange={(event) => setName(event.target.value)} className="w-full bg-transparent text-4xl font-bold tracking-tight text-zinc-950 outline-none dark:text-zinc-50" />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="mt-3 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
      <div className="sticky top-0 z-10 my-6 flex justify-end border-y border-zinc-200 bg-white/90 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
          <Save size={16} /> {pending ? "Saving" : "Save template"}
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
