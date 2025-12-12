export async function urlToFile(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1];
  return new File([blob], `${filename}.${ext}`, { type: blob.type });
}
