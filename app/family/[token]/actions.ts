"use server";

import { revalidatePath } from "next/cache";
import { assertRateLimit, requestIp } from "@/lib/birthday/rate-limit";
import { findParentByRawToken } from "@/lib/birthday/service";
import { childInputSchema } from "@/lib/birthday/validation";
import { prisma } from "@/lib/prisma";

export type FamilyState = {
  error?: string;
  success?: string;
};

async function requireFamily(rawToken: string) {
  await assertRateLimit("family-mutation", await requestIp(), 20, 60);
  const parent = await findParentByRawToken(rawToken);
  if (!parent) throw new Error("INVALID_LINK");
  return parent;
}

export async function addChildAction(
  rawToken: string,
  _state: FamilyState,
  formData: FormData,
): Promise<FamilyState> {
  try {
    const parent = await requireFamily(rawToken);
    const parsed = childInputSchema.safeParse({
      firstName: formData.get("firstName"),
      birthMonth: formData.get("birthMonth"),
      birthDay: formData.get("birthDay"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    await prisma.child.create({
      data: {
        parentId: parent.id,
        firstName: parsed.data.firstName,
        birthMonth: parsed.data.birthMonth,
        birthDay: parsed.data.birthDay,
      },
    });
    revalidatePath(`/family/${rawToken}`);
    return { success: "Child added." };
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return { error: "Too many changes. Try again shortly." };
    }
    return { error: "This family link is invalid or expired." };
  }
}

export async function updateChildAction(
  rawToken: string,
  _state: FamilyState,
  formData: FormData,
): Promise<FamilyState> {
  try {
    const parent = await requireFamily(rawToken);
    const childId = String(formData.get("childId") ?? "");
    const parsed = childInputSchema.safeParse({
      firstName: formData.get("firstName"),
      birthMonth: formData.get("birthMonth"),
      birthDay: formData.get("birthDay"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    await prisma.child.update({
      where: { id: childId, parentId: parent.id },
      data: parsed.data,
    });
    revalidatePath(`/family/${rawToken}`);
    return { success: "Child updated." };
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return { error: "Too many changes. Try again shortly." };
    }
    return { error: "The child could not be updated." };
  }
}

export async function removeChildAction(
  rawToken: string,
  _state: FamilyState,
  formData: FormData,
): Promise<FamilyState> {
  try {
    const parent = await requireFamily(rawToken);
    const childId = String(formData.get("childId") ?? "");
    await prisma.child.update({
      where: { id: childId, parentId: parent.id },
      data: { active: false },
    });
    revalidatePath(`/family/${rawToken}`);
    return { success: "Child removed." };
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return { error: "Too many changes. Try again shortly." };
    }
    return { error: "The child could not be removed." };
  }
}
