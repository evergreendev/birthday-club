import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  monthTriggerUrl: "mailchimp.birthdayMonthTriggerUrl",
  dayTriggerUrl: "mailchimp.birthdayDayTriggerUrl",
  audienceId: "mailchimp.audienceId",
  birthdayMonthSendDay: "birthdayClub.monthSendDay",
  timezone: "birthdayClub.timezone",
  consentText: "birthdayClub.consentText",
  automatedSendsEnabled: "birthdayClub.automatedSendsEnabled",
} as const;

export type BirthdayClubSettings = {
  monthTriggerUrl: string;
  dayTriggerUrl: string;
  audienceId: string;
  birthdayMonthSendDay: number;
  timezone: string;
  consentText: string;
  automatedSendsEnabled: boolean;
};

const DEFAULT_CONSENT =
  "I agree to receive birthday club emails related to my child or children. I understand I can unsubscribe from marketing emails at any time.";

export const DEFAULT_SETTINGS: BirthdayClubSettings = {
  monthTriggerUrl: "",
  dayTriggerUrl: "",
  audienceId: "",
  birthdayMonthSendDay: 1,
  timezone: "America/Denver",
  consentText: DEFAULT_CONSENT,
  automatedSendsEnabled: true,
};

export async function getSettings(): Promise<BirthdayClubSettings> {
  const rows = await prisma.appSetting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));

  const sendDay = Number(map.get(SETTING_KEYS.birthdayMonthSendDay));

  return {
    monthTriggerUrl:
      map.get(SETTING_KEYS.monthTriggerUrl) ?? DEFAULT_SETTINGS.monthTriggerUrl,
    dayTriggerUrl:
      map.get(SETTING_KEYS.dayTriggerUrl) ?? DEFAULT_SETTINGS.dayTriggerUrl,
    audienceId: map.get(SETTING_KEYS.audienceId) ?? DEFAULT_SETTINGS.audienceId,
    birthdayMonthSendDay:
      Number.isInteger(sendDay) && sendDay >= 1 && sendDay <= 28
        ? sendDay
        : DEFAULT_SETTINGS.birthdayMonthSendDay,
    timezone: map.get(SETTING_KEYS.timezone) ?? DEFAULT_SETTINGS.timezone,
    consentText: map.get(SETTING_KEYS.consentText) ?? DEFAULT_SETTINGS.consentText,
    automatedSendsEnabled:
      (map.get(SETTING_KEYS.automatedSendsEnabled) ?? "true") === "true",
  };
}

export async function saveSettings(settings: BirthdayClubSettings) {
  await prisma.$transaction(
    Object.entries({
      [SETTING_KEYS.monthTriggerUrl]: settings.monthTriggerUrl,
      [SETTING_KEYS.dayTriggerUrl]: settings.dayTriggerUrl,
      [SETTING_KEYS.audienceId]: settings.audienceId,
      [SETTING_KEYS.birthdayMonthSendDay]: String(
        settings.birthdayMonthSendDay,
      ),
      [SETTING_KEYS.timezone]: settings.timezone,
      [SETTING_KEYS.consentText]: settings.consentText,
      [SETTING_KEYS.automatedSendsEnabled]: String(
        settings.automatedSendsEnabled,
      ),
    }).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}
