import { describe, expect, it } from "vitest";
import {
  birthdayDayMatches,
  birthdayHasPassedThisYear,
  isValidBirthDate,
} from "@/lib/birthday/date";
import { planBirthdaySends, type PlannerChild } from "@/lib/birthday/planner";
import { childInputSchema } from "@/lib/birthday/validation";
import { generateManagementToken, hashToken } from "@/lib/birthday/tokens";

const child = (overrides: Partial<PlannerChild>): PlannerChild => ({
  id: "c1",
  parentId: "p1",
  parentEmail: "parent@example.com",
  birthMonth: 7,
  birthDay: 20,
  active: true,
  parentActive: true,
  consentAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

describe("birthday validation", () => {
  it("accepts valid dates and rejects impossible calendar dates", () => {
    expect(isValidBirthDate(2, 29)).toBe(true);
    expect(isValidBirthDate(4, 31)).toBe(false);
    expect(isValidBirthDate(13, 1)).toBe(false);
    expect(childInputSchema.safeParse({ birthMonth: 4, birthDay: 31 }).success).toBe(false);
  });

  it("sends February 29 birthdays on February 28 in non-leap years", () => {
    expect(
      birthdayDayMatches({ birthMonth: 2, birthDay: 29 }, { year: 2027, month: 2, day: 28 }),
    ).toBe(true);
    expect(
      birthdayDayMatches({ birthMonth: 2, birthDay: 29 }, { year: 2028, month: 2, day: 29 }),
    ).toBe(true);
    expect(
      birthdayDayMatches({ birthMonth: 2, birthDay: 29 }, { year: 2028, month: 2, day: 28 }),
    ).toBe(false);
  });

  it("detects mid-month registration before and after the birthday", () => {
    expect(
      birthdayHasPassedThisYear({ birthMonth: 7, birthDay: 20 }, { year: 2026, month: 7, day: 15 }),
    ).toBe(false);
    expect(
      birthdayHasPassedThisYear({ birthMonth: 7, birthDay: 10 }, { year: 2026, month: 7, day: 15 }),
    ).toBe(true);
  });
});

describe("birthday planning", () => {
  it("supports multiple children belonging to one parent in different months", () => {
    const plan = planBirthdaySends(
      [child({ id: "c1", birthMonth: 7 }), child({ id: "c2", birthMonth: 8 })],
      { year: 2026, month: 7, day: 1 },
      1,
    );
    expect([...plan.monthGroups.values()].flat().map((item) => item.id)).toEqual(["c1"]);
  });

  it("deduplicates two children for the same parent in the same birthday month", () => {
    const plan = planBirthdaySends(
      [child({ id: "c1", birthDay: 10 }), child({ id: "c2", birthDay: 20 })],
      { year: 2026, month: 7, day: 1 },
      1,
    );
    expect(plan.monthGroups.size).toBe(1);
    expect([...plan.monthGroups.values()][0]).toHaveLength(2);
  });

  it("deduplicates siblings sharing the same actual birthday", () => {
    const plan = planBirthdaySends(
      [child({ id: "c1", birthDay: 17 }), child({ id: "c2", birthDay: 17 })],
      { year: 2026, month: 7, day: 17 },
      1,
    );
    expect(plan.dayGroups.size).toBe(1);
    expect([...plan.dayGroups.values()][0]).toHaveLength(2);
  });

  it("excludes disabled parents, disabled children, and missing consent", () => {
    const plan = planBirthdaySends(
      [
        child({ id: "disabled-child", active: false }),
        child({ id: "disabled-parent", parentActive: false }),
        child({ id: "missing-consent", consentAt: null }),
      ],
      { year: 2026, month: 7, day: 20 },
      1,
    );
    expect(plan.monthGroups.size).toBe(0);
    expect(plan.dayGroups.size).toBe(0);
  });
});

describe("management tokens", () => {
  it("uses random tokens and stores only SHA-256 hashes", () => {
    const first = generateManagementToken();
    const second = generateManagementToken();
    expect(first).not.toEqual(second);
    expect(Buffer.from(first, "base64url")).toHaveLength(32);
    expect(hashToken(first)).toHaveLength(64);
    expect(hashToken("parent@example.com")).not.toEqual(first);
  });
});
