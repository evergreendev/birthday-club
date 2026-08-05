import Link from "next/link";
import { SendStatus } from "@/app/generated/prisma/client";
import { getSettings } from "@/lib/birthday/settings";
import { formatMonthDay, localDateParts } from "@/lib/birthday/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BirthdayClubDashboard() {
  const settings = await getSettings();
  const current = localDateParts(new Date(), settings.timezone);
  const [parents, children, recentSuccess, recentFailures, upcoming] =
    await prisma.$transaction([
      prisma.parent.count({ where: { active: true } }),
      prisma.child.count({ where: { active: true, parent: { active: true } } }),
      prisma.birthdaySend.findMany({
        where: { status: SendStatus.SENT },
        orderBy: { sentAt: "desc" },
        take: 5,
        include: { parent: true, child: true },
      }),
      prisma.birthdaySend.findMany({
        where: { status: SendStatus.FAILED },
        orderBy: { attemptedAt: "desc" },
        take: 5,
        include: { parent: true, child: true },
      }),
      prisma.child.findMany({
        where: {
          active: true,
          parent: { active: true },
          OR: [
            { birthMonth: current.month, birthDay: { gte: current.day } },
            { birthMonth: { gt: current.month } },
          ],
        },
        include: { parent: true },
        orderBy: [{ birthMonth: "asc" }, { birthDay: "asc" }],
        take: 10,
      }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Birthday Club</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Automation timezone: {settings.timezone}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600">Active parents</p>
          <p className="mt-2 text-3xl font-semibold">{parents}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600">Active children</p>
          <p className="mt-2 text-3xl font-semibold">{children}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600">Recent successes</p>
          <p className="mt-2 text-3xl font-semibold">{recentSuccess.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600">Recent failures</p>
          <p className="mt-2 text-3xl font-semibold">{recentFailures.length}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Upcoming birthdays</h2>
          <div className="mt-4 space-y-3">
            {upcoming.length ? (
              upcoming.map((child) => (
                <p key={child.id} className="text-sm">
                  {child.firstName || "Child"} for{" "}
                  <Link
                    className="font-medium underline"
                    href={`/admin/birthday-club/parents/${child.parentId}`}
                  >
                    {child.parent.firstName} {child.parent.lastName}
                  </Link>{" "}
                  on {formatMonthDay(child.birthMonth, child.birthDay)}
                </p>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No upcoming birthdays found.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Recent failures</h2>
          <div className="mt-4 space-y-3">
            {recentFailures.length ? (
              recentFailures.map((send) => (
                <p key={send.id} className="text-sm text-red-700">
                  {send.type} for {send.parent.email}: {send.errorMessage}
                </p>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No recent failures.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
