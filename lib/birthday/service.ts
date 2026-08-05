import "server-only";

import { Prisma, SendStatus, SendType } from "@/app/generated/prisma/client";
import { birthdayDayMatches, birthdayHasPassedThisYear, localDateParts } from "@/lib/birthday/date";
import { ensureAudienceMember, triggerCustomerJourney } from "@/lib/birthday/mailchimp";
import { getSettings } from "@/lib/birthday/settings";
import { childSignature } from "@/lib/birthday/validation";
import { generateManagementToken, hashToken } from "@/lib/birthday/tokens";
import { prisma } from "@/lib/prisma";

type ChildInput = {
  firstName: string | null;
  birthMonth: number;
  birthDay: number;
};

export type CronSummary = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  disabled: boolean;
};

export async function registerFamily(input: {
  parentFirstName: string;
  parentLastName: string;
  email: string;
  children: ChildInput[];
  consentSource: string;
}) {
  const settings = await getSettings();
  if (settings.audienceId) {
    const audience = await ensureAudienceMember(settings.audienceId, {
      email: input.email,
      firstName: input.parentFirstName,
      lastName: input.parentLastName,
    });
    if (!audience.ok) {
      throw new Error("Could not update Mailchimp audience member.");
    }
  }

  const rawToken = generateManagementToken();
  const now = new Date();

  const parent = await prisma.$transaction(async (tx) => {
    const existing = await tx.parent.findUnique({
      where: { email: input.email },
      include: { children: true },
    });

    const parentRecord = await tx.parent.upsert({
      where: { email: input.email },
      create: {
        firstName: input.parentFirstName,
        lastName: input.parentLastName || null,
        email: input.email,
        consentAt: now,
        consentSource: input.consentSource,
        managementTokenHash: hashToken(rawToken),
        managementTokenCreatedAt: now,
      },
      update: {
        firstName: input.parentFirstName,
        lastName: input.parentLastName || null,
        active: true,
        consentAt: now,
        consentSource: input.consentSource,
        ...(existing?.managementTokenHash
          ? {}
          : {
              managementTokenHash: hashToken(rawToken),
              managementTokenCreatedAt: now,
            }),
      },
    });

    const currentChildren =
      existing?.children.map((child) =>
        childSignature({
          firstName: child.firstName,
          birthMonth: child.birthMonth,
          birthDay: child.birthDay,
        }),
      ) ?? [];
    const seen = new Set(currentChildren);

    for (const child of input.children) {
      const signature = childSignature(child);
      if (seen.has(signature)) continue;
      seen.add(signature);
      await tx.child.create({
        data: {
          parentId: parentRecord.id,
          firstName: child.firstName,
          birthMonth: child.birthMonth,
          birthDay: child.birthDay,
        },
      });
    }

    return parentRecord;
  });

  if (settings.signupTriggerUrl) {
    const signupEmail = await triggerCustomerJourney(
      settings.signupTriggerUrl,
      input.email,
    );
    if (!signupEmail.ok) {
      throw new Error("Could not send the Birthday Club signup email.");
    }
  }

  return {
    parent,
    createdManagementToken: !parent.managementTokenHash ? rawToken : null,
  };
}

export async function findParentByRawToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const parent = await prisma.parent.findFirst({
    where: { managementTokenHash: tokenHash, active: true },
    include: {
      children: { orderBy: [{ birthMonth: "asc" }, { birthDay: "asc" }] },
    },
  });

  if (!parent?.managementTokenHash) return null;
  return parent.managementTokenHash === tokenHash ? parent : null;
}

async function createSkippedRecords(
  children: Array<{ id: string; parentId: string }>,
  type: SendType,
  occurrenceYear: number,
) {
  if (children.length === 0) return 0;
  const result = await prisma.birthdaySend.createMany({
    data: children.map((child) => ({
      childId: child.id,
      parentId: child.parentId,
      type,
      occurrenceYear,
      status: SendStatus.SKIPPED,
      attemptedAt: new Date(),
      errorMessage: "Family-level duplicate suppressed.",
    })),
    skipDuplicates: true,
  });
  return result.count;
}

async function claimPendingSends(
  children: Array<{ id: string; parentId: string }>,
  type: SendType,
  occurrenceYear: number,
) {
  if (children.length === 0) return [];
  return prisma.birthdaySend.createManyAndReturn({
    data: children.map((child) => ({
      childId: child.id,
      parentId: child.parentId,
      type,
      occurrenceYear,
      status: SendStatus.PENDING,
      attemptedAt: new Date(),
    })),
    skipDuplicates: true,
  });
}

async function completeSends(
  sendIds: string[],
  result: Awaited<ReturnType<typeof triggerCustomerJourney>>,
) {
  if (sendIds.length === 0) return;

  await prisma.birthdaySend.updateMany({
    where: { id: { in: sendIds }, status: SendStatus.PENDING },
    data: result.ok
      ? {
          status: SendStatus.SENT,
          sentAt: new Date(),
          providerResponse:
            (result.response as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
          errorMessage: null,
        }
      : {
          status: SendStatus.FAILED,
          providerResponse:
            (result.response as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
          errorMessage: result.errorMessage.slice(0, 500),
        },
  });
}

async function processGroup(input: {
  children: Array<{ id: string; parentId: string }>;
  parentEmail: string;
  type: SendType;
  occurrenceYear: number;
  triggerUrl: string;
}) {
  if (!input.triggerUrl) {
    const skipped = await createSkippedRecords(
      input.children,
      input.type,
      input.occurrenceYear,
    );
    return { sent: 0, failed: 0, skipped };
  }

  const claimed = await claimPendingSends(
    input.children,
    input.type,
    input.occurrenceYear,
  );
  if (claimed.length === 0) return { sent: 0, failed: 0, skipped: 0 };

  const result = await triggerCustomerJourney(input.triggerUrl, input.parentEmail);
  await completeSends(
    claimed.map((send) => send.id),
    result,
  );

  return {
    sent: result.ok ? claimed.length : 0,
    failed: result.ok ? 0 : claimed.length,
    skipped: 0,
  };
}

export async function processBirthdayCron(now = new Date()): Promise<CronSummary> {
  const settings = await getSettings();
  if (!settings.automatedSendsEnabled) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0, disabled: true };
  }

  const current = localDateParts(now, settings.timezone);
  const children = await prisma.child.findMany({
    where: {
      active: true,
      parent: {
        active: true,
        consentAt: { not: null },
      },
    },
    include: { parent: true },
  });

  const summary: CronSummary = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    disabled: false,
  };

  if (current.day >= settings.birthdayMonthSendDay) {
    const monthly = new Map<string, typeof children>();
    for (const child of children) {
      if (child.birthMonth !== current.month) continue;
      if (birthdayHasPassedThisYear(child, current)) continue;
      const key = `${child.parentId}:${current.month}`;
      monthly.set(key, [...(monthly.get(key) ?? []), child]);
    }

    for (const group of monthly.values()) {
      const existingFamilySend = await prisma.birthdaySend.findFirst({
        where: {
          parentId: group[0].parentId,
          type: SendType.BIRTHDAY_MONTH,
          occurrenceYear: current.year,
          child: { birthMonth: current.month },
        },
      });

      const result = existingFamilySend
        ? {
            sent: 0,
            failed: 0,
            skipped: await createSkippedRecords(
              group.map((child) => ({ id: child.id, parentId: child.parentId })),
              SendType.BIRTHDAY_MONTH,
              current.year,
            ),
          }
        : await processGroup({
            children: group.map((child) => ({ id: child.id, parentId: child.parentId })),
            parentEmail: group[0].parent.email,
            type: SendType.BIRTHDAY_MONTH,
            occurrenceYear: current.year,
            triggerUrl: settings.monthTriggerUrl,
          });

      summary.processed += group.length;
      summary.sent += result.sent;
      summary.failed += result.failed;
      summary.skipped += result.skipped;
    }
  }

  const daily = new Map<string, typeof children>();
  for (const child of children) {
    if (!birthdayDayMatches(child, current)) continue;
    const key = `${child.parentId}:${child.birthMonth}:${child.birthDay}`;
    daily.set(key, [...(daily.get(key) ?? []), child]);
  }

  for (const group of daily.values()) {
    const existingFamilySend = await prisma.birthdaySend.findFirst({
      where: {
        parentId: group[0].parentId,
        type: SendType.BIRTHDAY_DAY,
        occurrenceYear: current.year,
        child: { birthMonth: group[0].birthMonth, birthDay: group[0].birthDay },
      },
    });

    const result = existingFamilySend
      ? {
          sent: 0,
          failed: 0,
          skipped: await createSkippedRecords(
            group.map((child) => ({ id: child.id, parentId: child.parentId })),
            SendType.BIRTHDAY_DAY,
            current.year,
          ),
        }
      : await processGroup({
          children: group.map((child) => ({ id: child.id, parentId: child.parentId })),
          parentEmail: group[0].parent.email,
          type: SendType.BIRTHDAY_DAY,
          occurrenceYear: current.year,
          triggerUrl: settings.dayTriggerUrl,
        });

    summary.processed += group.length;
    summary.sent += result.sent;
    summary.failed += result.failed;
    summary.skipped += result.skipped;
  }

  return summary;
}

export async function retryBirthdaySend(sendId: string) {
  const send = await prisma.birthdaySend.findUnique({
    where: { id: sendId },
    include: { parent: true },
  });
  if (!send || send.status !== SendStatus.FAILED) {
    throw new Error("Only failed sends can be retried.");
  }

  const settings = await getSettings();
  const triggerUrl =
    send.type === SendType.BIRTHDAY_MONTH
      ? settings.monthTriggerUrl
      : settings.dayTriggerUrl;
  const result = await triggerCustomerJourney(triggerUrl, send.parent.email);
  await completeSends([send.id], result);
  return result;
}
