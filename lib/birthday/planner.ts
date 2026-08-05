import { birthdayDayMatches, birthdayHasPassedThisYear } from "@/lib/birthday/date";

export type PlannerChild = {
  id: string;
  parentId: string;
  parentEmail: string;
  birthMonth: number;
  birthDay: number;
  active: boolean;
  parentActive: boolean;
  consentAt: Date | null;
};

export type BirthdayPlan = {
  monthGroups: Map<string, PlannerChild[]>;
  dayGroups: Map<string, PlannerChild[]>;
};

export function planBirthdaySends(
  children: PlannerChild[],
  current: { year: number; month: number; day: number },
  birthdayMonthSendDay: number,
): BirthdayPlan {
  const eligible = children.filter(
    (child) => child.active && child.parentActive && child.consentAt,
  );
  const monthGroups = new Map<string, PlannerChild[]>();
  const dayGroups = new Map<string, PlannerChild[]>();

  if (current.day >= birthdayMonthSendDay) {
    for (const child of eligible) {
      if (child.birthMonth !== current.month) continue;
      if (birthdayHasPassedThisYear(child, current)) continue;
      const key = `${child.parentId}:${current.month}`;
      monthGroups.set(key, [...(monthGroups.get(key) ?? []), child]);
    }
  }

  for (const child of eligible) {
    if (!birthdayDayMatches(child, current)) continue;
    const key = `${child.parentId}:${child.birthMonth}:${child.birthDay}`;
    dayGroups.set(key, [...(dayGroups.get(key) ?? []), child]);
  }

  return { monthGroups, dayGroups };
}
