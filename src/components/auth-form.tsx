"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signUpAction } from "@/lib/actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Astraphos</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {mode === "login" ? "Welcome back" : "Create your workspace"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Own your notes, docs, and project knowledge from day one.
        </p>
      </div>

      {mode === "signup" ? (
        <label className="mb-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
          <input name="name" className="mt-2 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" placeholder="Ada Lovelace" />
        </label>
      ) : null}

      <label className="mb-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Email
        <input name="email" type="email" required className="mt-2 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" placeholder="you@example.com" />
      </label>

      <label className="mb-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Password
        <input name="password" type="password" required minLength={8} className="mt-2 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" placeholder="At least 8 characters" />
      </label>

      {state?.error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{state.error}</p> : null}

      <button disabled={pending} className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
        {pending ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "login" ? "No account yet?" : "Already have an account?"} {" "}
        <Link className="font-medium text-zinc-950 underline dark:text-zinc-50" href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? "Sign up" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
