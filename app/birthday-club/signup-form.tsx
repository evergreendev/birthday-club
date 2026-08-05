"use client";

import { useActionState, useEffect, useState } from "react";
import { signupAction, type SignupState } from "@/app/birthday-club/actions";

const months = [
  ["1", "January"],
  ["2", "February"],
  ["3", "March"],
  ["4", "April"],
  ["5", "May"],
  ["6", "June"],
  ["7", "July"],
  ["8", "August"],
  ["9", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"],
];

export function SignupForm({ consentText }: { consentText: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(
    signupAction,
    {},
  );
  const [children, setChildren] = useState([0]);
  const nextIndex = children.length ? Math.max(...children) + 1 : 0;

  useEffect(() => {
    if (state.signedUp) {
      window.location.assign("/birthday-club/success");
    }
  }, [state.signedUp]);

  return (
    <form action={action} className="space-y-7">
      <section className="grid gap-5 rounded-2xl bg-cyan-50 p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <h3 className="flex items-center gap-2 text-xl font-black text-violet-900">
            <span aria-hidden="true">💌</span> Grown-up details
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Where should we send the birthday fun?
          </p>
        </div>
        <div>
          <label className="text-sm font-bold text-violet-950" htmlFor="parentFirstName">
            Parent first name
          </label>
          <input
            id="parentFirstName"
            name="parentFirstName"
            required
            className="mt-2 w-full rounded-xl border-2 border-cyan-200 bg-white px-4 py-3 outline-none transition focus:ring-4 focus:ring-fuchsia-100"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-violet-950" htmlFor="parentLastName">
            Parent last name
          </label>
          <input
            id="parentLastName"
            name="parentLastName"
            required
            className="mt-2 w-full rounded-xl border-2 border-cyan-200 bg-white px-4 py-3 outline-none transition focus:ring-4 focus:ring-fuchsia-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-bold text-violet-950" htmlFor="email">
            Parent email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-xl border-2 border-cyan-200 bg-white px-4 py-3 outline-none transition focus:ring-4 focus:ring-fuchsia-100"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-fuchsia-50 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-black text-violet-900">
              <span aria-hidden="true">🎂</span> Birthday stars
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Add each child you&apos;d like to celebrate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChildren((current) => [...current, nextIndex])}
            className="rounded-full bg-violet-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-200"
          >
            Add child
          </button>
        </div>

        {children.map((index, position) => (
          <div
            key={index}
            className="grid gap-4 rounded-2xl border-2 border-fuchsia-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_160px_120px_auto]"
          >
            <div>
              <label className="text-sm font-bold text-violet-950" htmlFor={`child-${index}`}>
                Child first name
              </label>
              <input
                id={`child-${index}`}
                name={`children[${index}][firstName]`}
                className="mt-2 w-full rounded-xl border-2 border-fuchsia-200 bg-white px-3 py-2.5 outline-none focus:ring-4 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-violet-950">Month</label>
              <select
                name={`children[${index}][birthMonth]`}
                required
                className="mt-2 w-full rounded-xl border-2 border-fuchsia-200 bg-white px-3 py-2.5 outline-none focus:ring-4 focus:ring-violet-100"
              >
                <option value="">Select</option>
                {months.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-violet-950">Day</label>
              <input
                name={`children[${index}][birthDay]`}
                type="number"
                min="1"
                max="31"
                required
                className="mt-2 w-full rounded-xl border-2 border-fuchsia-200 bg-white px-3 py-2.5 outline-none focus:ring-4 focus:ring-violet-100"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                disabled={children.length === 1}
                onClick={() =>
                  setChildren((current) =>
                    current.filter((childIndex) => childIndex !== index),
                  )
                }
                className="rounded-full border-2 border-fuchsia-200 px-3 py-2 text-sm font-bold text-fuchsia-700 transition hover:bg-fuchsia-50 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
            <input
              type="hidden"
              name={`children[${index}][position]`}
              value={position}
            />
          </div>
        ))}
      </section>

      <label className="flex gap-3 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-slate-700 transition hover:border-yellow-300">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-5 w-5 flex-none accent-violet-700"
        />
        <span>{consentText}</span>
      </label>

      <label className="flex gap-3 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-slate-700 transition hover:border-yellow-300">
        <input
          type="checkbox"
          name="registrationSharingAcknowledgement"
          required
          className="mt-1 h-5 w-5 flex-none accent-violet-700"
        />
        <span>
          I acknowledge that my email address and registration information may
          be shared internally with Evergreen Media and participating Premium
          Birthday Club sponsors so we can deliver Birthday Club updates,
          exclusive birthday offers, and other program-related communications.
        </span>
      </label>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-linear-to-r from-fuchsia-500 via-violet-600 to-cyan-500 px-6 py-4 text-base font-black text-white shadow-[0_10px_25px_rgba(147,51,234,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(147,51,234,0.38)] focus:outline-none focus:ring-4 focus:ring-fuchsia-200 disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "🎈 Join the Birthday Club"}
      </button>
    </form>
  );
}
