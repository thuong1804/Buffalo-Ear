export type Locale = "vi" | "en";
export const localeCookie = "buffalo-ear-locale";
export const intlLocale = (locale: string) =>
  locale === "en" ? "en-GB" : "vi-VN";
export function parseLocaleCookie(cookie: string | null | undefined): Locale {
  const value = cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${localeCookie}=`))
    ?.slice(localeCookie.length + 1);
  return value === "en" ? "en" : "vi";
}
