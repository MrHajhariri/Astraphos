"use client";

import { useRef, useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Code, Heading1, Heading2, ImageIcon, List, ListOrdered, Quote, Save } from "lucide-react";
import { updatePageAction, uploadAssetAction } from "@/lib/actions";

type RelatedPage = { id: string; title: string };
type WikiTarget = { id: string; title: string; type: "PAGE" | "VAULT_FILE" };
type SlashCommandId = "paragraph" | "h1" | "h2" | "bullet" | "ordered" | "quote" | "code" | "image";

const slashItems: { id: SlashCommandId; label: string; hint: string }[] = [
  { id: "paragraph", label: "Text", hint: "Plain paragraph" },
  { id: "h1", label: "Heading 1", hint: "Large section title" },
  { id: "h2", label: "Heading 2", hint: "Medium section title" },
  { id: "bullet", label: "Bullet list", hint: "Unordered list" },
  { id: "ordered", label: "Numbered list", hint: "Ordered list" },
  { id: "quote", label: "Quote", hint: "Callout or excerpt" },
  { id: "code", label: "Code block", hint: "Preformatted code" },
  { id: "image", label: "Image", hint: "Upload an image" },
];

export function LoreEditor({
  workspaceId,
  page,
  pages,
  wikiTargets,
}: {
  workspaceId: string;
  page: { id: string; title: string; content: JSONContent };
  pages: RelatedPage[];
  wikiTargets?: WikiTarget[];
}) {
  const [pending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [wikiQuery, setWikiQuery] = useState<string | null>(null);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [selectedWikiIndex, setSelectedWikiIndex] = useState(0);
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
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
    onUpdate({ editor }) {
      const { $from } = editor.state.selection;
      const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, " ");
      const match = textBefore.match(/(?:^|\s)\/([a-z0-9 ]*)$/i);
      const wikiMatch = textBefore.match(/\[\[([^\]]*)$/i);
      setSlashQuery(match ? match[1] : null);
      setWikiQuery(wikiMatch ? wikiMatch[1] : null);
      setSelectedSlashIndex(0);
      setSelectedWikiIndex(0);
    },
  });

  const filteredSlashItems = slashQuery === null ? [] : slashItems.filter((item) => item.label.toLowerCase().includes(slashQuery.toLowerCase()));
  const filteredWikiTargets = wikiQuery === null ? [] : (wikiTargets ?? []).filter((target) => target.title.toLowerCase().includes(wikiQuery.toLowerCase())).slice(0, 8);

  function save(formData: FormData) {
    if (!editor) return;
    const title = String(formData.get("title") || "Untitled");
    const selectedRelations = formData.getAll("relations").map(String);
    startTransition(async () => {
      await updatePageAction({ workspaceId, pageId: page.id, title, content: editor.getJSON(), relationIds: selectedRelations });
    });
  }

  async function upload(formData: FormData) {
    setUploadError(null);
    const result = await uploadAssetAction(formData);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url && editor) editor.chain().focus().setImage({ src: result.url, alt: result.fileName ?? "Uploaded image" }).run();
  }

  function runSlashCommand(run: () => void) {
    if (!editor) return;
    const { $from } = editor.state.selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, " ");
    const slashOffset = textBefore.lastIndexOf("/");
    if (slashOffset >= 0) {
      editor.chain().focus().deleteRange({ from: $from.start() + slashOffset, to: $from.pos }).run();
    }
    setSlashQuery(null);
    run();
  }

  function executeSlashCommand(id: SlashCommandId) {
    runSlashCommand(() => {
      if (id === "paragraph") editor?.chain().focus().setParagraph().run();
      if (id === "h1") editor?.chain().focus().toggleHeading({ level: 1 }).run();
      if (id === "h2") editor?.chain().focus().toggleHeading({ level: 2 }).run();
      if (id === "bullet") editor?.chain().focus().toggleBulletList().run();
      if (id === "ordered") editor?.chain().focus().toggleOrderedList().run();
      if (id === "quote") editor?.chain().focus().toggleBlockquote().run();
      if (id === "code") editor?.chain().focus().toggleCodeBlock().run();
      if (id === "image") uploadInputRef.current?.click();
    });
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (wikiQuery !== null && filteredWikiTargets.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedWikiIndex((index) => (index + 1) % filteredWikiTargets.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedWikiIndex((index) => (index - 1 + filteredWikiTargets.length) % filteredWikiTargets.length);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        insertWikiTarget(filteredWikiTargets[selectedWikiIndex].title);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setWikiQuery(null);
      }
      return;
    }
    if (slashQuery === null || filteredSlashItems.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSlashIndex((index) => (index + 1) % filteredSlashItems.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSlashIndex((index) => (index - 1 + filteredSlashItems.length) % filteredSlashItems.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const item = filteredSlashItems[selectedSlashIndex];
      if (item) executeSlashCommand(item.id);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setSlashQuery(null);
    }
  }

  function insertWikiTarget(title: string) {
    if (!editor) return;
    const { $from } = editor.state.selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, " ");
    const start = textBefore.lastIndexOf("[[");
    if (start >= 0) {
      editor.chain().focus().deleteRange({ from: $from.start() + start, to: $from.pos }).insertContent(`[[${title}]]`).run();
    }
    setWikiQuery(null);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10" onKeyDown={handleEditorKeyDown}>
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
            <input ref={uploadInputRef} form="asset-upload-form" name="file" type="file" accept="image/*" className="hidden" onChange={() => uploadFormRef.current?.requestSubmit()} />
          </label>
          <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
            <Save size={16} /> {pending ? "Saving" : "Save"}
          </button>
        </div>

        {uploadError ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-200">{uploadError}</p> : null}

        <div className="relative">
          {wikiQuery !== null && filteredWikiTargets.length ? (
            <div className="absolute left-0 top-2 z-30 w-80 overflow-hidden rounded-xl border border-cyan-200 bg-white shadow-xl dark:border-cyan-900 dark:bg-zinc-950">
              {filteredWikiTargets.map((target, index) => (
                <button key={`${target.type}:${target.id}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertWikiTarget(target.title)} className={`block w-full px-3 py-2 text-left ${index === selectedWikiIndex ? "bg-cyan-50 dark:bg-cyan-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}>
                  <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">{target.title}</span>
                  <span className="block text-xs text-cyan-600 dark:text-cyan-300">{target.type === "PAGE" ? "Note" : "Vault"}</span>
                </button>
              ))}
            </div>
          ) : null}
          {slashQuery !== null && filteredSlashItems.length ? (
            <div className="absolute left-0 top-2 z-20 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
              {filteredSlashItems.map((item, index) => (
                <button key={item.label} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => executeSlashCommand(item.id)} className={`block w-full px-3 py-2 text-left ${index === selectedSlashIndex ? "bg-zinc-100 dark:bg-zinc-900" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}>
                  <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">{item.label}</span>
                  <span className="block text-xs text-zinc-500">{item.hint}</span>
                </button>
              ))}
            </div>
          ) : null}
          <EditorContent editor={editor} />
        </div>

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
