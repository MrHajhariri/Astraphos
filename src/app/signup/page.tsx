import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-900"><AuthForm mode="signup" /></main>;
}
