const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(secret: string) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("pinia-persist"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(secret);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );

  const buffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(encrypted), iv.byteLength);

  return btoa(String.fromCharCode(...buffer));
}

export async function decrypt(cipher: string, secret: string) {
  const buffer = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
  const iv = buffer.slice(0, 12);
  const data = buffer.slice(12);

  const key = await getKey(secret);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return decoder.decode(decrypted);
}
