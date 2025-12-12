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