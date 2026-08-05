import Image from "next/image";
import { SignupForm } from "@/app/birthday-club/signup-form";
import { getSettings } from "@/lib/birthday/settings";

export const dynamic = "force-dynamic";

export default async function BirthdayClubPage() {
  const settings = await getSettings();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8ed] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-20 top-72 h-64 w-64 rounded-full bg-fuchsia-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-cyan-200/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-1/2 h-64 w-64 rounded-full bg-yellow-200/50 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <header className="overflow-hidden rounded-4xl border-4 border-white bg-white shadow-[0_20px_60px_rgba(76,29,149,0.14)]">
          <div className="grid items-center lg:grid-cols-[0.9fr_1.1fr]">
            <div className="px-7 pb-4 pt-8 text-center sm:px-12 lg:py-12 lg:text-left">
              <div className="mb-4 inline-flex -rotate-2 items-center gap-2 rounded-full bg-yellow-300 px-4 py-2 text-sm font-black uppercase tracking-wider text-violet-900 shadow-sm">
                <span aria-hidden="true">🎉</span> Coming Soon!{/*You&apos;re invited!*/}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-violet-900 sm:text-6xl">
                Join the
                <span className="block text-fuchsia-500">Birthday Club!</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg lg:mx-0">
                Coming soon! 🎉 Sign up now to save your child’s spot in the Birthday Club fun.
              </p>
            </div>
            <div className="relative min-h-64 sm:min-h-80 lg:min-h-96">
              <Image
                src="/PARTY.jpg"
                alt="Children celebrating a birthday with colorful balloons and party hats"
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-contain object-bottom"
              />
            </div>
          </div>
          <div className="h-3 bg-linear-to-r from-fuchsia-500 via-yellow-300 to-cyan-400" />
        </header>

        <div className="mt-8 rounded-4xl border-4 border-white bg-white/95 p-5 shadow-[0_20px_60px_rgba(76,29,149,0.12)] sm:p-8 lg:p-10">
          <div className="mb-8 text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-500">
              Let&apos;s celebrate
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-violet-900">
              Tell us about your family
            </h2>
            <p className="mt-2 text-slate-600">
              Required fields are marked by your browser.
            </p>
          </div>
          <SignupForm consentText={settings.consentText} />
        </div>
      </div>
    </main>
  );
}
