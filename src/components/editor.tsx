"use client";

import { useRef, useTransition } from "react";
import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Code, Heading1, Heading2, ImageIcon, List, ListOrdered, Quote, Save } from "lucide-react";
import { updatePageAction, uploadAssetAction } from "@/lib/actions";

type RelatedPage = { id: string; title: string };

export function LoreEditor({
  workspaceId,
  page,
  pages,
}: {
  workspaceId: string;
  page: { id: string; title: string; content: JSONContent };
  pages: RelatedPage[];
}) {
  const [pending, startTransition] = useTransition();
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Press / for commands, or start writing..." }),
    ],
    content: page.content,
    editorProps: {
      attributes: {
        class: "prose prose-zinc max-w-none focus:outline-none dark:prose-invert prose-headings:font-semibold prose-pre:bg-zinc-950 prose-pre:text-zinc-50 min-h-[55vh]",
      },
    },
  });

  function save(formData: FormData) {
    if (!editor) return;
    const title = String(formData.get("title") || "Untitled");
    const selectedRelations = formData.getAll("relations").map(String);
    startTransition(async () => {
      await updatePageAction({ workspaceId, pageId: page.id, title, content: editor.getJSON(), relationIds: selectedRelations });
    });
  }

  async function upload(formData: FormData) {
    const result = await uploadAssetAction(formData);
    if (result.url && editor) editor.chain().focus().setImage({ src: result.url, alt: result.fileName ?? "Uploaded image" }).run();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10">
      <form action={save}>
        <input name="title" defaultValue={page.title} className="mb-6 w-full bg-transparent text-4xl font-bold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300 dark:text-zinc-50 dark:placeholder:text-zinc-700" placeholder="Untitled" />

        <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center gap-2 border-y border-zinc-200 bg-white/90 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <ToolbarButton label="H1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={16} /></ToolbarButton>
          <ToolbarButton label="H2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></ToolbarButton>
          <ToolbarButton label="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16} /></ToolbarButton>
          <ToolbarButton label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></ToolbarButton>
          <ToolbarButton label="Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={16} /></ToolbarButton>
          <ToolbarButton label="Code" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Code size={16} /></ToolbarButton>
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
            <ImageIcon size={16} /> Upload
            <input form="asset-upload-form" name="file" type="file" accept="image/*" className="hidden" onChange={() => uploadFormRef.current?.requestSubmit()} />
          </label>
          <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
            <Save size={16} /> {pending ? "Saving" : "Save"}
          </button>
        </div>

        <EditorContent editor={editor} />

        <div className="mt-10 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">Relationships</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {pages.filter((related) => related.id !== page.id).map((related) => (
              <label key={related.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                <input name="relations" value={related.id} type="checkbox" /> {related.title || "Untitled"}
              </label>
            ))}
          </div>
        </div>
      </form>
      <form id="asset-upload-form" ref={uploadFormRef} action={upload} className="hidden">
        <input type="hidden" name="pageId" value={page.id} />
      </form>
    </div>
  );
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900">
      {children}
    </button>
  );
}
