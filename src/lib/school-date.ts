import { SITE } from "@/lib/site";

/** Calendar date at the school, independent of the browser's or server's timezone. */
export function schoolTodayIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (part: string) => parts.find((item) => item.type === part)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
