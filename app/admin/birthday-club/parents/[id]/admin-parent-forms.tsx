"use client";

import { useActionState, useState } from "react";
import {
  deleteFamilyAction,
  regenerateLinkAction,
  saveSettingsAction,
  testJourneyAction,
  type AdminState,
} from "@/app/admin/birthday-club/actions";

export function DeleteFamilyForm({
  parentId,
  familyName,
}: {
  parentId: string;
  familyName: string;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState<AdminState, FormData>(
    deleteFamilyAction.bind(null, parentId),
    {},
  );

  return (
    <form action={action} className="mt-4 space-y-3">
      <p className="text-sm text-red-800">
        Permanently delete {familyName}, all children, and all send history.
        This cannot be undone.
      </p>
      <label className="block text-sm font-medium text-red-900">
        Type DELETE to confirm
        <input
          name="confirm"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          className="mt-2 block w-full max-w-xs rounded-md border border-red-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
      </label>
      {state.error ? <p className="text-sm font-medium text-red-700">{state.error}</p> : null}
      <button
        disabled={pending || confirmation !== "DELETE"}
        className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Permanently delete family"}
      </button>
    </form>
  );
}

export function RegenerateLinkForm({ parentId }: { parentId: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    regenerateLinkAction.bind(null, parentId),
    {},
  );

  return (
    <div className="space-y-3">
      <form action={action}>
        <button
          disabled={pending}
          onClick={(event) => {
            if (!window.confirm("Generate a new link and invalidate the previous one?")) {
              event.preventDefault();
            }
          }}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Generating..." : "Regenerate family link"}
        </button>
      </form>
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.managementLink ? (
        <div className="rounded-md bg-zinc-50 p-3">
          <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
            Copy now. This raw link is not stored.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={state.managementLink}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.managementLink ?? "")}
              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
            >
              Copy
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SettingsForm({
  settings,
}: {
  settings: {
    monthTriggerUrl: string;
    dayTriggerUrl: string;
    audienceId: string;
    birthdayMonthSendDay: number;
    timezone: string;
    consentText: string;
    automatedSendsEnabled: boolean;
  };
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    saveSettingsAction,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-medium">
        Birthday-month trigger URL
        <input name="monthTriggerUrl" defaultValue={settings.monthTriggerUrl} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Birthday-day trigger URL
        <input name="dayTriggerUrl" defaultValue={settings.dayTriggerUrl} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Mailchimp audience ID
        <input name="audienceId" defaultValue={settings.audienceId} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Month send day
          <input name="birthdayMonthSendDay" type="number" min="1" max="28" defaultValue={settings.birthdayMonthSendDay} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium">
          Timezone
          <input name="timezone" defaultValue={settings.timezone} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Consent disclosure
        <textarea name="consentText" defaultValue={settings.consentText} rows={5} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="automatedSendsEnabled" defaultChecked={settings.automatedSendsEnabled} />
        Enable automated sends
      </label>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <button disabled={pending} className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}

export function TestJourneyForm({ type }: { type: "month" | "day" }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    testJourneyAction.bind(null, type),
    {},
  );

  return (
    <form action={action} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="font-medium">
        Test {type === "month" ? "birthday-month" : "birthday-day"} journey
      </h3>
      <input
        name="confirm"
        placeholder="Type TEST"
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
      />
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <button disabled={pending} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-60">
        Send test
      </button>
    </form>
  );
}
