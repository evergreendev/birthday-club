"use client";

import { useActionState, useEffect } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  useEffect(() => {
    if (state.signedIn) {
      window.location.assign("/admin/birthday-club");
    }
  }, [state.signedIn]);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-zinc-800" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-800" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </div>
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
