"use server";

import { assertRateLimit, requestIp } from "@/lib/birthday/rate-limit";
import {
  registerFamily,
  syncSignupWithMailchimp,
} from "@/lib/birthday/service";
import { parseChildrenFromForm, signupSchema } from "@/lib/birthday/validation";

export type SignupState = {
  error?: string;
  signedUp?: boolean;
};

export async function signupAction(
  _state: SignupState,
  formData: FormData,
): Promise<SignupState> {
  try {
    await assertRateLimit("public-signup", await requestIp(), 10, 60);
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return { error: "Too many submissions. Try again shortly." };
    }
    throw error;
  }

  const parsed = signupSchema.safeParse({
    parentFirstName: formData.get("parentFirstName"),
    parentLastName: formData.get("parentLastName"),
    email: formData.get("email"),
    consent: formData.get("consent"),
    registrationSharingAcknowledgement: formData.get(
      "registrationSharingAcknowledgement",
    ),
    children: parseChildrenFromForm(formData),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const registration = {
    parentFirstName: parsed.data.parentFirstName,
    parentLastName: parsed.data.parentLastName,
    email: parsed.data.email,
    children: parsed.data.children,
    consentSource: "public-signup",
  };

  await registerFamily(registration);

  void syncSignupWithMailchimp(registration).catch((error) => {
      console.error("[birthday-club] Post-signup Mailchimp sync failed.", error);
  });

  return { signedUp: true };
}
