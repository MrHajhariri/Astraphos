import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <AuthShell><AuthForm mode="login" /></AuthShell>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-900">{children}</main>;
}
