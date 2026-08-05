import Link from "next/link";
import { createParentAction } from "@/app/admin/birthday-club/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(Number(params.page ?? 1), 1);
  const take = 20;
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [parents, total] = await Promise.all([
    prisma.parent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: { _count: { select: { children: true } } },
    }),
    prisma.parent.count({ where }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Parents</h1>
        <form className="mt-4 flex max-w-md gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
            Search
          </button>
        </form>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white">
        {parents.length ? (
          parents.map((parent) => (
            <Link
              key={parent.id}
              href={`/admin/birthday-club/parents/${parent.id}`}
              className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0"
            >
              <span>
                <span className="font-medium">
                  {parent.firstName} {parent.lastName}
                </span>{" "}
                <span className="text-zinc-600">{parent.email}</span>
              </span>
              <span className="text-zinc-600">
                {parent.active ? "Active" : "Inactive"} · {parent._count.children} children
              </span>
            </Link>
          ))
        ) : (
          <p className="p-4 text-sm text-zinc-600">No parents found.</p>
        )}
      </section>

      <div className="flex gap-3 text-sm">
        {page > 1 ? (
          <Link className="underline" href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>
            Previous
          </Link>
        ) : null}
        {page * take < total ? (
          <Link className="underline" href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>
            Next
          </Link>
        ) : null}
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Add parent</h2>
        <form action={createParentAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input name="firstName" required placeholder="First name" className="rounded-md border border-zinc-300 px-3 py-2" />
          <input name="lastName" placeholder="Last name" className="rounded-md border border-zinc-300 px-3 py-2" />
          <input name="email" type="email" required placeholder="Email" className="rounded-md border border-zinc-300 px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked /> Active
          </label>
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white sm:w-fit">
            Add parent
          </button>
        </form>
      </section>
    </div>
  );
}
