import { updatePageMetadataAction, updateVaultFileMetadataAction } from "@/lib/actions";

type MetadataTag = { name: string };
type MetadataOption = { id: string; name: string; color?: string };

export function PageMetadataPanel({
  workspaceId,
  page,
  nodeTypes,
}: {
  workspaceId: string;
  page: { id: string; nodeTypeId: string | null; tags: { tag: MetadataTag }[] };
  nodeTypes: MetadataOption[];
}) {
  return (
    <form action={updatePageMetadataAction} className="mx-auto mb-6 grid w-full max-w-4xl gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-[1fr_2fr_auto]">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="pageId" value={page.id} />
      <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Node type
        <select name="nodeTypeId" defaultValue={page.nodeTypeId ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200">
          <option value="">Default note</option>
          {nodeTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Tags
        <input name="tags" defaultValue={page.tags.map(({ tag }) => tag.name).join(", ")} placeholder="worldbuilding, research" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
      </label>
      <button className="self-end rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Save metadata</button>
    </form>
  );
}

export function VaultMetadataPanel({
  workspaceId,
  file,
  nodeTypes,
  folders,
}: {
  workspaceId: string;
  file: { id: string; nodeTypeId: string | null; folderId: string | null; tags: { tag: MetadataTag }[] };
  nodeTypes: MetadataOption[];
  folders: MetadataOption[];
}) {
  return (
    <form action={updateVaultFileMetadataAction} className="mx-auto mb-6 grid w-full max-w-5xl gap-3 px-5 md:grid-cols-[1fr_1fr_2fr_auto] md:px-10">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="fileId" value={file.id} />
      <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Node type
        <select name="nodeTypeId" defaultValue={file.nodeTypeId ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200">
          <option value="">Markdown</option>
          {nodeTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Folder
        <select name="folderId" defaultValue={file.folderId ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200">
          <option value="">Root</option>
          {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Tags
        <input name="tags" defaultValue={file.tags.map(({ tag }) => tag.name).join(", ")} placeholder="lore, draft" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
      </label>
      <button className="self-end rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Save metadata</button>
    </form>
  );
}
