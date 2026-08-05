import Image from "next/image";
import Link from "next/link";

export default function BirthdayClubSuccessPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff8ed] px-4 py-10 text-slate-900 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-fuchsia-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-yellow-200/50 blur-3xl" />

      <div className="pointer-events-none absolute inset-x-0 top-5 mx-auto flex max-w-5xl justify-around text-3xl sm:text-4xl" aria-hidden="true">
        <span className="rotate-12">&#127880;</span>
        <span className="-rotate-12">&#127882;</span>
        <span className="rotate-6">&#127881;</span>
        <span className="-rotate-6">&#127880;</span>
        <span className="rotate-12">&#127882;</span>
      </div>

      <div className="relative w-full max-w-3xl overflow-hidden rounded-4xl border-4 border-white bg-white text-center shadow-[0_24px_70px_rgba(76,29,149,0.16)]">
        <div className="h-3 bg-linear-to-r from-fuchsia-500 via-yellow-300 to-cyan-400" />

        <div className="px-6 pb-0 pt-9 sm:px-12 sm:pt-12">
          <div className="mx-auto flex h-20 w-20 -rotate-3 items-center justify-center rounded-full bg-violet-700 text-4xl text-white shadow-[0_10px_25px_rgba(109,40,217,0.3)]" aria-hidden="true">
            &#10003;
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-fuchsia-500">
            Hip hip hooray!
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-violet-900 sm:text-6xl">
            You&apos;re officially in!
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
            Your family has joined the Birthday Club. Keep an eye on your inbox
            when each birthday month rolls around—we&apos;ll bring the celebration!
          </p>

          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-yellow-200 px-5 py-2.5 text-sm font-bold text-violet-950">
            <span aria-hidden="true">&#128140;</span>
            Birthday fun is headed your way
          </div>

          <div>
            <Link
              href="/birthday-club"
              className="mt-8 inline-flex rounded-full bg-linear-to-r from-fuchsia-500 via-violet-600 to-cyan-500 px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(147,51,234,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(147,51,234,0.38)] focus:outline-none focus:ring-4 focus:ring-fuchsia-200"
            >
              Back to Birthday Club
            </Link>
          </div>
        </div>

        <div className="relative mt-4 h-48 sm:h-64">
          <Image
            src="/PARTY.jpg"
            alt="Children celebrating with colorful balloons and party hats"
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </main>
  );
}
