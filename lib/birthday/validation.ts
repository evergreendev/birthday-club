import { z } from "zod";
import { isValidBirthDate } from "@/lib/birthday/date";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const childInputSchema = z
  .object({
    firstName: z.string().trim().max(80).optional().or(z.literal("")),
    birthMonth: z.coerce.number().int().min(1).max(12),
    birthDay: z.coerce.number().int().min(1).max(31),
  })
  .refine((value) => isValidBirthDate(value.birthMonth, value.birthDay), {
    message: "Enter a real calendar date.",
    path: ["birthDay"],
  })
  .transform((value) => ({
    firstName: value.firstName ? value.firstName : null,
    birthMonth: value.birthMonth,
    birthDay: value.birthDay,
  }));

export const signupSchema = z.object({
  parentFirstName: z.string().trim().min(1).max(80),
  parentLastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().transform(normalizeEmail),
  consent: z.literal("on", {
    error: "Consent is required.",
  }),
  registrationSharingAcknowledgement: z.literal("on", {
    error: "Registration information sharing acknowledgement is required.",
  }),
  children: z.array(childInputSchema).min(1).max(20),
});

export const parentSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().transform(normalizeEmail),
  active: z.coerce.boolean().default(true),
});

export const settingsSchema = z.object({
  monthTriggerUrl: z.string().trim().url().optional().or(z.literal("")),
  dayTriggerUrl: z.string().trim().url().optional().or(z.literal("")),
  audienceId: z.string().trim().max(120).optional().or(z.literal("")),
  birthdayMonthSendDay: z.coerce.number().int().min(1).max(28),
  timezone: z.string().trim().min(1).max(80),
  consentText: z.string().trim().min(20).max(2000),
  automatedSendsEnabled: z.coerce.boolean().default(false),
});

export function childSignature(input: {
  firstName: string | null;
  birthMonth: number;
  birthDay: number;
}) {
  return `${(input.firstName ?? "").trim().toLowerCase()}|${input.birthMonth}|${input.birthDay}`;
}

export function parseChildrenFromForm(formData: FormData) {
  const indexes = new Set<string>();
  for (const key of formData.keys()) {
    const match = key.match(/^children\[(\d+)]\[/);
    if (match) indexes.add(match[1]);
  }

  return [...indexes].sort((a, b) => Number(a) - Number(b)).map((index) => ({
    firstName: String(formData.get(`children[${index}][firstName]`) ?? ""),
    birthMonth: formData.get(`children[${index}][birthMonth]`),
    birthDay: formData.get(`children[${index}][birthDay]`),
  }));
}
