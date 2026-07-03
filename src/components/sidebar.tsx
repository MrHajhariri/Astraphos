import Link from "next/link";
import { FileText, LogOut, Plus, Search, Star } from "lucide-react";
import { createPageAction, logoutAction } from "@/lib/actions";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const roots = pages.filter((page) => !page.parentId);

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
        <PageTree pages={pages} nodes={roots} workspaceId={workspace.id} activePageId={activePageId} />
      </div>

      <form action={logoutAction}>
        <button className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-900">
          <LogOut size={16} /> Sign out
        </button>
      </form>
    </aside>
  );
}

function PageTree({ pages, nodes, workspaceId, activePageId }: { pages: PageNode[]; nodes: PageNode[]; workspaceId: string; activePageId?: string }) {
  return nodes.map((page) => {
    const children = pages.filter((child) => child.parentId === page.id);
    return (
      <div key={page.id}>
        <PageLink page={page} workspaceId={workspaceId} active={page.id === activePageId} />
        {children.length ? <div className="ml-4 border-l border-zinc-200 pl-1 dark:border-zinc-800"><PageTree pages={pages} nodes={children} workspaceId={workspaceId} activePageId={activePageId} /></div> : null}
      </div>
    );
  });
}

function PageLink({ page, workspaceId, active, favorite }: { page: PageNode; workspaceId: string; active?: boolean; favorite?: boolean }) {
  return (
    <Link href={`/w/${workspaceId}/p/${page.id}`} className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${active ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>
      {favorite ? <Star size={15} className="fill-current" /> : <FileText size={15} />}
      <span className="truncate">{page.title || "Untitled"}</span>
    </Link>
  );
}
