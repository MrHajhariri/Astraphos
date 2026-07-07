import { createWikiTargetAction } from "@/lib/actions";

export function UnresolvedLinks({ workspaceId, links, returnTo }: { workspaceId: string; links: string[]; returnTo: string }) {
  if (!links.length) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-10 md:px-10">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-950 dark:bg-amber-950/20">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Unresolved wiki links</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {links.map((link) => (
            <div key={link} className="rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-900 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">[[{link}]]</p>
              <div className="mt-3 flex gap-2">
                <form action={createWikiTargetAction}>
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <input type="hidden" name="title" value={link} />
                  <input type="hidden" name="targetType" value="PAGE" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Create note</button>
                </form>
                <form action={createWikiTargetAction}>
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <input type="hidden" name="title" value={link} />
                  <input type="hidden" name="targetType" value="VAULT_FILE" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button className="rounded-lg border border-cyan-200 px-3 py-1.5 text-xs text-cyan-700 hover:bg-cyan-50 dark:border-cyan-900 dark:text-cyan-200 dark:hover:bg-cyan-950/40">Create Vault</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
