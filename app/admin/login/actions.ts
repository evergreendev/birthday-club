"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { assertRateLimit, requestIp } from "@/lib/birthday/rate-limit";

export type LoginState = {
  error?: string;
  signedIn?: boolean;
};

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await assertRateLimit("admin-login", await requestIp(), 5, 60);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin/birthday-club",
      redirect: false,
    });

    const resultUrl = new URL(String(result), "http://localhost");
    if (resultUrl.searchParams.has("error")) {
      return { error: "Invalid administrator credentials." };
    }

    return { signedIn: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid administrator credentials." };
    }
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return { error: "Too many attempts. Try again shortly." };
    }
    throw error;
  }

}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
