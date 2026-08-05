import { notFound } from "next/navigation";
import { AddChildForm, ChildEditForm } from "@/app/family/[token]/family-forms";
import { assertRateLimit, requestIp } from "@/lib/birthday/rate-limit";
import { formatMonthDay } from "@/lib/birthday/date";
import { findParentByRawToken } from "@/lib/birthday/service";
import { maskEmail } from "@/lib/birthday/tokens";

export const dynamic = "force-dynamic";

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    await assertRateLimit("family-page", await requestIp(), 30, 60);
  } catch {
    notFound();
  }

  const parent = await findParentByRawToken(token);
  if (!parent) notFound();

  const activeChildren = parent.children.filter((child) => child.active);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Manage Birthday Club
          </h1>
          <p className="mt-3 text-zinc-600">
            Managing family records for {maskEmail(parent.email)}.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Children</h2>
          {activeChildren.length ? (
            activeChildren.map((child) => (
              <div key={child.id}>
                <p className="mb-2 text-sm text-zinc-600">
                  {child.firstName || "Child"}:{" "}
                  {formatMonthDay(child.birthMonth, child.birthDay)}
                </p>
                <ChildEditForm token={token} child={child} />
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-zinc-200 bg-white p-4 text-zinc-600">
              No active children are currently listed.
            </p>
          )}
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Add a child</h2>
          <AddChildForm token={token} />
        </section>
      </div>
    </main>
  );
}
