export async function urlToFile(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1];
  return new File([blob], `${filename}.${ext}`, { type: blob.type });
}

export function formatPrice(number: number | string): string | null {
  if (!number) return null;
  const num = typeof number === "string" ? parseFloat(number) : number;

  if (isNaN(num)) return "0";

  return num.toLocaleString("en-US");
}

export function formatNumber(number: number | string): string {
  if (number === null || number === undefined) return "0";
  const num = typeof number === "string" ? parseFloat(number) : number;
  if (isNaN(num)) return "0";
  return num.toLocaleString("fa-IR");
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "همین الان";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} دقیقه پیش`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ساعت پیش`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} روز پیش`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} هفته پیش`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ماه پیش`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} سال پیش`;
}