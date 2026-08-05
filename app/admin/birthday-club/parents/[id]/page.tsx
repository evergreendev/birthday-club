import { notFound } from "next/navigation";
import {
  addAdminChildAction,
  deactivateFamilyAction,
  retrySendAction,
  updateAdminChildAction,
  updateParentAction,
} from "@/app/admin/birthday-club/actions";
import {
  DeleteFamilyForm,
  RegenerateLinkForm,
} from "@/app/admin/birthday-club/parents/[id]/admin-parent-forms";
import { formatMonthDay, MONTH_NAMES } from "@/lib/birthday/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      children: { orderBy: [{ active: "desc" }, { birthMonth: "asc" }, { birthDay: "asc" }] },
      sends: { orderBy: { attemptedAt: "desc" }, take: 25, include: { child: true } },
    },
  });
  if (!parent) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {parent.firstName} {parent.lastName}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">{parent.email}</p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Parent details</h2>
        <form action={updateParentAction.bind(null, parent.id)} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input name="firstName" required defaultValue={parent.firstName} className="rounded-md border border-zinc-300 px-3 py-2" />
          <input name="lastName" defaultValue={parent.lastName ?? ""} className="rounded-md border border-zinc-300 px-3 py-2" />
          <input name="email" type="email" required defaultValue={parent.email} className="rounded-md border border-zinc-300 px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={parent.active} /> Active
          </label>
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white sm:w-fit">
            Save parent
          </button>
        </form>
        <form action={deactivateFamilyAction.bind(null, parent.id)} className="mt-4">
          <button className="text-sm font-medium text-red-700">
            Deactivate family
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-950">Danger zone</h2>
        <DeleteFamilyForm
          parentId={parent.id}
          familyName={`${parent.firstName}${parent.lastName ? ` ${parent.lastName}` : ""}`}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Family management link</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Generate a fresh link when needed. The raw token is shown once and the
          previous link stops working immediately.
        </p>
        <div className="mt-4">
          <RegenerateLinkForm parentId={parent.id} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Children</h2>
        {parent.children.map((child) => (
          <form key={child.id} action={updateAdminChildAction.bind(null, parent.id)} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-[1fr_150px_100px_auto_auto]">
            <input type="hidden" name="childId" value={child.id} />
            <input name="firstName" defaultValue={child.firstName ?? ""} className="rounded-md border border-zinc-300 px-3 py-2" />
            <select name="birthMonth" defaultValue={child.birthMonth} className="rounded-md border border-zinc-300 px-3 py-2">
              {MONTH_NAMES.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <input name="birthDay" type="number" min="1" max="31" defaultValue={child.birthDay} className="rounded-md border border-zinc-300 px-3 py-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={child.active} /> Active
            </label>
            <button className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white">
              Save
            </button>
          </form>
        ))}
        <form action={addAdminChildAction.bind(null, parent.id)} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[1fr_150px_100px_auto]">
          <input name="firstName" placeholder="Child first name" className="rounded-md border border-zinc-300 bg-white px-3 py-2" />
          <select name="birthMonth" required className="rounded-md border border-zinc-300 bg-white px-3 py-2">
            <option value="">Month</option>
            {MONTH_NAMES.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <input name="birthDay" type="number" min="1" max="31" required placeholder="Day" className="rounded-md border border-zinc-300 bg-white px-3 py-2" />
          <button className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white">
            Add child
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Send history</h2>
        <div className="mt-4 space-y-3">
          {parent.sends.length ? (
            parent.sends.map((send) => (
              <div key={send.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 text-sm last:border-b-0">
                <span>
                  {send.type} · {send.status} · {send.child.firstName || "Child"} ·{" "}
                  {formatMonthDay(send.child.birthMonth, send.child.birthDay)}
                </span>
                {send.status === "FAILED" ? (
                  <form action={retrySendAction.bind(null, send.id)}>
                    <button className="rounded-md border border-zinc-300 px-3 py-1 font-medium">
                      Retry
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No send history yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
