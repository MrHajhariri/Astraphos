import Link from "next/link";
import { Archive, FileText, FolderOpen, GitFork, LogOut, Plus, Search, Settings, Tags } from "lucide-react";
import { createPageAction, logoutAction } from "@/lib/actions";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageLink, SortablePageTree } from "@/components/sortable-page-tree";

type PageNode = {
  id: string;
  title: string;
  parentId: string | null;
  isFavorite: boolean;
};

export function Sidebar({
  user,
  workspace,
  pages,
  activePageId,
}: {
  user: { name: string | null; email: string };
  workspace: { id: string; name: string };
  pages: PageNode[];
  activePageId?: string;
}) {
  const favorites = pages.filter((page) => page.isFavorite);

  return (
    <aside className="flex h-dvh w-full flex-col border-r border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950 md:w-72">
      <div className="mb-4 flex items-center gap-3 rounded-xl px-2 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
          {getInitials(workspace.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{workspace.name}</p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
        </div>
        <ThemeToggle />
      </div>

      <Link href={`/w/${workspace.id}/search`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <Search size={16} /> Search
      </Link>

      <Link href={`/w/${workspace.id}/graph`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <GitFork size={16} /> Graph
      </Link>

      <Link href={`/w/${workspace.id}/archive`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <Archive size={16} /> Archive
      </Link>

      <Link href={`/w/${workspace.id}/templates`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <FileText size={16} /> Templates
      </Link>

      <Link href={`/w/${workspace.id}/vault`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <FolderOpen size={16} /> Vault
      </Link>

      <Link href={`/w/${workspace.id}/tags`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <Tags size={16} /> Tags
      </Link>

      <Link href={`/w/${workspace.id}/folders`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <FolderOpen size={16} /> Folders
      </Link>

      <Link href={`/w/${workspace.id}/node-types`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <GitFork size={16} /> Node types
      </Link>

      <Link href={`/w/${workspace.id}/settings`} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
        <Settings size={16} /> Settings
      </Link>

      <form action={createPageAction} className="mb-4">
        <input type="hidden" name="workspaceId" value={workspace.id} />
        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900">
          <Plus size={16} /> New page
        </button>
      </form>

      {favorites.length ? (
        <div className="mb-4">
          <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Favorites</p>
          {favorites.map((page) => (
            <PageLink key={page.id} page={page} workspaceId={workspace.id} active={page.id === activePageId} favorite />
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Pages</p>
        <SortablePageTree pages={pages} workspaceId={workspace.id} activePageId={activePageId} />
      </div>

      <form action={logoutAction}>
        <button className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-900">
          <LogOut size={16} /> Sign out
        </button>
      </form>
    </aside>
  );
}
