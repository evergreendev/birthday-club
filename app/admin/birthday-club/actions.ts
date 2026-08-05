"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SendStatus } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/admin";
import { childInputSchema, parentSchema, settingsSchema } from "@/lib/birthday/validation";
import { generateManagementToken, hashToken, managementUrl } from "@/lib/birthday/tokens";
import { retryBirthdaySend } from "@/lib/birthday/service";
import { getSettings, saveSettings } from "@/lib/birthday/settings";
import {
  ensureAudienceMember,
  triggerCustomerJourney,
  validateMailchimpTriggerUrl,
} from "@/lib/birthday/mailchimp";
import { prisma } from "@/lib/prisma";

export type AdminState = {
  error?: string;
  success?: string;
  managementLink?: string;
};

export async function saveSettingsAction(
  state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  void state;
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    signupTriggerUrl: formData.get("signupTriggerUrl"),
    monthTriggerUrl: formData.get("monthTriggerUrl"),
    dayTriggerUrl: formData.get("dayTriggerUrl"),
    audienceId: formData.get("audienceId"),
    birthdayMonthSendDay: formData.get("birthdayMonthSendDay"),
    timezone: formData.get("timezone"),
    consentText: formData.get("consentText"),
    automatedSendsEnabled: formData.get("automatedSendsEnabled") === "on",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    if (parsed.data.signupTriggerUrl) {
      validateMailchimpTriggerUrl(parsed.data.signupTriggerUrl);
    }
    if (parsed.data.monthTriggerUrl) {
      validateMailchimpTriggerUrl(parsed.data.monthTriggerUrl);
    }
    if (parsed.data.dayTriggerUrl) {
      validateMailchimpTriggerUrl(parsed.data.dayTriggerUrl);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid URL." };
  }

  await saveSettings({
    signupTriggerUrl: parsed.data.signupTriggerUrl ?? "",
    monthTriggerUrl: parsed.data.monthTriggerUrl ?? "",
    dayTriggerUrl: parsed.data.dayTriggerUrl ?? "",
    audienceId: parsed.data.audienceId ?? "",
    birthdayMonthSendDay: parsed.data.birthdayMonthSendDay,
    timezone: parsed.data.timezone,
    consentText: parsed.data.consentText,
    automatedSendsEnabled: parsed.data.automatedSendsEnabled,
  });
  revalidatePath("/admin/birthday-club/settings");
  return { success: "Settings saved." };
}

export async function createParentAction(formData: FormData) {
  await requireAdmin();
  const parsed = parentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return;

  const token = generateManagementToken();
  const parent = await prisma.parent.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      email: parsed.data.email,
      active: parsed.data.active,
      managementTokenHash: hashToken(token),
      managementTokenCreatedAt: new Date(),
    },
  });
  redirect(`/admin/birthday-club/parents/${parent.id}`);
}

export async function updateParentAction(parentId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return;

  await prisma.parent.update({
    where: { id: parentId },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      email: parsed.data.email,
      active: parsed.data.active,
    },
  });
  revalidatePath(`/admin/birthday-club/parents/${parentId}`);
}

export async function deactivateFamilyAction(parentId: string) {
  await requireAdmin();
  await prisma.parent.update({
    where: { id: parentId },
    data: { active: false, children: { updateMany: { where: {}, data: { active: false } } } },
  });
  revalidatePath(`/admin/birthday-club/parents/${parentId}`);
}

export async function deleteFamilyAction(
  parentId: string,
  state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  void state;
  await requireAdmin();
  if (formData.get("confirm") !== "DELETE") {
    return { error: "Type DELETE to permanently remove this family." };
  }

  await prisma.parent.delete({ where: { id: parentId } });
  revalidatePath("/admin/birthday-club");
  revalidatePath("/admin/birthday-club/parents");
  redirect("/admin/birthday-club/parents");
}

export async function addAdminChildAction(parentId: string, formData: FormData) {
  await requireAdmin();
  const parsed = childInputSchema.safeParse({
    firstName: formData.get("firstName"),
    birthMonth: formData.get("birthMonth"),
    birthDay: formData.get("birthDay"),
  });
  if (!parsed.success) return;

  await prisma.child.create({ data: { parentId, ...parsed.data } });
  revalidatePath(`/admin/birthday-club/parents/${parentId}`);
}

export async function updateAdminChildAction(parentId: string, formData: FormData) {
  await requireAdmin();
  const childId = String(formData.get("childId") ?? "");
  const parsed = childInputSchema.safeParse({
    firstName: formData.get("firstName"),
    birthMonth: formData.get("birthMonth"),
    birthDay: formData.get("birthDay"),
  });
  if (!parsed.success) return;

  await prisma.child.update({
    where: { id: childId, parentId },
    data: { ...parsed.data, active: formData.get("active") === "on" },
  });
  revalidatePath(`/admin/birthday-club/parents/${parentId}`);
}

export async function regenerateLinkAction(
  parentId: string,
  state: AdminState,
): Promise<AdminState> {
  void state;
  await requireAdmin();
  const token = generateManagementToken();
  await prisma.parent.update({
    where: { id: parentId },
    data: {
      managementTokenHash: hashToken(token),
      managementTokenCreatedAt: new Date(),
    },
  });
  revalidatePath(`/admin/birthday-club/parents/${parentId}`);
  return {
    success: "New link generated. The previous link is now invalid.",
    managementLink: managementUrl(token),
  };
}

export async function retrySendAction(sendId: string) {
  await requireAdmin();
  await retryBirthdaySend(sendId);
  revalidatePath("/admin/birthday-club");
}

export async function testJourneyAction(
  type: "signup" | "month" | "day",
  state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  void state;
  await requireAdmin();
  if (formData.get("confirm") !== "TEST") {
    return { error: "Type TEST to confirm the test trigger." };
  }

  const settings = await getSettings();
  const url =
    type === "signup"
      ? settings.signupTriggerUrl
      : type === "month"
        ? settings.monthTriggerUrl
        : settings.dayTriggerUrl;
  if (!url) return { error: "No trigger URL is configured." };
  const email = process.env.ADMIN_EMAIL;
  if (!email) return { error: "ADMIN_EMAIL is not configured." };

  if (settings.audienceId) {
    const audience = await ensureAudienceMember(settings.audienceId, {
      email,
      firstName: process.env.ADMIN_FIRST_NAME?.trim() || "Birthday Club",
      lastName: process.env.ADMIN_LAST_NAME?.trim() || "Administrator",
    });
    if (!audience.ok) {
      return { error: audience.errorMessage };
    }
    if (audience.skipped) {
      return {
        error: `The administrator contact is ${audience.status} in Mailchimp and cannot be used for this test.`,
      };
    }
  }

  const result = await triggerCustomerJourney(url, email);
  if (!result.ok) return { error: result.errorMessage };
  return { success: "Test trigger sent to the administrator email." };
}

export async function markSendFailedForRetry(sendId: string) {
  await requireAdmin();
  await prisma.birthdaySend.update({
    where: { id: sendId },
    data: { status: SendStatus.FAILED },
  });
}
