import Link from "next/link";
import { logoutAction } from "@/app/admin/login/actions";
import { requireAdmin } from "@/lib/auth/admin";

export default async function BirthdayClubAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/admin/birthday-club">Dashboard</Link>
            <Link href="/admin/birthday-club/parents">Parents</Link>
            <Link href="/admin/birthday-club/settings">Settings</Link>
          </nav>
          <form action={logoutAction}>
            <button className="text-sm font-medium text-zinc-600">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
