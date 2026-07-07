import Link from "next/link";

export type Backlink = {
  id: string;
  sourceType: "PAGE" | "VAULT_FILE";
  title: string;
  href: string;
};

export function Backlinks({ backlinks }: { backlinks: Backlink[] }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-10 md:px-10">
      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Backlinks</p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-900">{backlinks.length}</span>
        </div>
        {backlinks.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {backlinks.map((backlink) => (
              <Link key={backlink.id} href={backlink.href} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-violet-700">
                <span className="mr-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-950 dark:text-violet-200">{backlink.sourceType === "PAGE" ? "Note" : "Vault"}</span>
                <span className="text-zinc-700 dark:text-zinc-200">{backlink.title || "Untitled"}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No backlinks yet. Link here from another note or Vault file with [[{`Page Name`}]].</p>
        )}
      </div>
    </div>
  );
}
