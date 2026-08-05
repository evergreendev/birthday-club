"use client";

import { useActionState } from "react";
import {
  addChildAction,
  removeChildAction,
  updateChildAction,
  type FamilyState,
} from "@/app/family/[token]/actions";
import { MONTH_NAMES } from "@/lib/birthday/date";

const months = MONTH_NAMES.map((label, index) => ({
  value: index + 1,
  label,
}));

function Message({ state }: { state: FamilyState }) {
  if (state.error) {
    return <p className="text-sm text-red-700">{state.error}</p>;
  }
  if (state.success) {
    return <p className="text-sm text-green-700">{state.success}</p>;
  }
  return null;
}

export function ChildEditForm({
  token,
  child,
}: {
  token: string;
  child: {
    id: string;
    firstName: string | null;
    birthMonth: number;
    birthDay: number;
  };
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateChildAction.bind(null, token),
    {},
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeChildAction.bind(null, token),
    {},
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <form action={updateAction} className="grid gap-4 sm:grid-cols-[1fr_160px_100px_auto]">
        <input type="hidden" name="childId" value={child.id} />
        <input
          name="firstName"
          defaultValue={child.firstName ?? ""}
          aria-label="Child first name"
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
        <select
          name="birthMonth"
          defaultValue={child.birthMonth}
          aria-label="Birthday month"
          className="rounded-md border border-zinc-300 px-3 py-2"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
        <input
          name="birthDay"
          type="number"
          min="1"
          max="31"
          defaultValue={child.birthDay}
          aria-label="Birthday day"
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={updatePending}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Save
        </button>
      </form>
      <form action={removeAction} className="mt-3">
        <input type="hidden" name="childId" value={child.id} />
        <button
          type="submit"
          disabled={removePending}
          onClick={(event) => {
            if (!window.confirm("Remove this child from birthday club emails?")) {
              event.preventDefault();
            }
          }}
          className="text-sm font-medium text-red-700"
        >
          Remove
        </button>
      </form>
      <div className="mt-2 space-y-1">
        <Message state={updateState} />
        <Message state={removeState} />
      </div>
    </div>
  );
}

export function AddChildForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    addChildAction.bind(null, token),
    {},
  );

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[1fr_160px_100px_auto]">
      <input
        name="firstName"
        aria-label="Child first name"
        placeholder="Child first name"
        className="rounded-md border border-zinc-300 bg-white px-3 py-2"
      />
      <select
        name="birthMonth"
        required
        aria-label="Birthday month"
        className="rounded-md border border-zinc-300 bg-white px-3 py-2"
      >
        <option value="">Month</option>
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <input
        name="birthDay"
        type="number"
        min="1"
        max="31"
        required
        aria-label="Birthday day"
        placeholder="Day"
        className="rounded-md border border-zinc-300 bg-white px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Add
      </button>
      <div className="sm:col-span-4">
        <Message state={state} />
      </div>
    </form>
  );
}
