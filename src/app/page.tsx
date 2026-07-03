import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top_left,#e4e4e7,transparent_35%),linear-gradient(#fff,#fafafa)] px-6 dark:bg-[radial-gradient(circle_at_top_left,#27272a,transparent_35%),linear-gradient(#09090b,#18181b)]">
      <section className="max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Astraphos</p>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-7xl">
          Your open-source knowledge workspace.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Create nested rich-text documents, organize project knowledge, connect pages, and keep your data portable on PostgreSQL.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
            Start forging
          </Link>
          <Link href="/login" className="rounded-lg border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
