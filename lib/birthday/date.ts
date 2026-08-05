export type Birthday = {
  birthMonth: number;
  birthDay: number;
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidBirthDate(month: number, day: number) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  if (month === 2 && day === 29) return true;
  return day <= daysInMonth(2024, month);
}

export function localDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

export function birthdayDayMatches(
  birthday: Birthday,
  current: { year: number; month: number; day: number },
) {
  if (
    birthday.birthMonth === 2 &&
    birthday.birthDay === 29 &&
    !isLeapYear(current.year)
  ) {
    return current.month === 2 && current.day === 28;
  }

  return (
    birthday.birthMonth === current.month && birthday.birthDay === current.day
  );
}

export function birthdayHasPassedThisYear(
  birthday: Birthday,
  current: { year: number; month: number; day: number },
) {
  const observedDay =
    birthday.birthMonth === 2 &&
    birthday.birthDay === 29 &&
    !isLeapYear(current.year)
      ? 28
      : birthday.birthDay;

  if (birthday.birthMonth < current.month) return true;
  if (birthday.birthMonth > current.month) return false;
  return observedDay < current.day;
}

export function formatMonthDay(month: number, day: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, month - 1, day)));
}
