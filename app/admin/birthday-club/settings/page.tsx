import { SettingsForm, TestJourneyForm } from "@/app/admin/birthday-club/parents/[id]/admin-parent-forms";
import { getSettings } from "@/lib/birthday/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Non-secret configuration is stored in the database. The Mailchimp API
          key stays in environment variables.
        </p>
      </div>
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <SettingsForm settings={settings} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <TestJourneyForm type="month" />
        <TestJourneyForm type="day" />
      </section>
    </div>
  );
}
