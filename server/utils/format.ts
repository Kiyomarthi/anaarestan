export function createSlug(text: string) {
  let slug = text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF-]+/g, "")
    .replace(/--+/g, "-");

  slug = slug.replace(/^-+/, "").replace(/-+$/, "");

  const regex = /^[a-zA-Z0-9\u0600-\u06FF]+(?:-[a-zA-Z0-9\u0600-\u06FF]+)*$/;
  if (!regex.test(slug)) {
    throw new Error("Cannot create a valid slug from this text");
  }

  return slug;
}

export const generateCode = () => {
  const now = Date.now().toString().slice(-3);
  const rnd = Math.floor(100 + Math.random() * 900).toString();
  return now + rnd;
};
