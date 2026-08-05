import Link from "next/link";

export default function FamilyNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-950">
          This family link is invalid
        </h1>
        <p className="mt-3 text-zinc-600">
          The link may have expired or been regenerated. Ask an administrator for
          a new family management link.
        </p>
        <Link
          href="/birthday-club"
          className="mt-6 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
        >
          Birthday club form
        </Link>
      </div>
    </main>
  );
}
