import { defineNuxtPlugin, useRuntimeConfig, useCookie } from "#app";
import type { Pinia, PiniaPluginContext, StateTree } from "pinia";

type StorageKind = "local" | "session" | "cookie";
type JsonObject = Record<string, unknown>;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistOptions {
  key?: string;
  storage?: StorageKind | StorageLike;
  paths?: string[];
  throttle?: number;
  encrypt?: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function isClient() {
  return typeof window !== "undefined";
}

function localStorageAdapter(): StorageLike {
  return {
    getItem: (k) => (isClient() ? localStorage.getItem(k) : null),
    setItem: (k, v) => {
      if (isClient()) localStorage.setItem(k, v);
    },
    removeItem: (k) => {
      if (isClient()) localStorage.removeItem(k);
    },
  };
}

function sessionStorageAdapter(): StorageLike {
  return {
    getItem: (k) => (isClient() ? sessionStorage.getItem(k) : null),
    setItem: (k, v) => {
      if (isClient()) sessionStorage.setItem(k, v);
    },
    removeItem: (k) => {
      if (isClient()) sessionStorage.removeItem(k);
    },
  };
}

function cookieAdapter(): StorageLike {
  return {
    getItem: (key) => useCookie<string | null>(key).value ?? null,
    setItem: (key, value) => {
      if (!isClient()) return;
      useCookie<string | null>(key, { path: "/", sameSite: "lax" }).value =
        value;
    },
    removeItem: (key) => {
      if (!isClient()) return;
      useCookie<string | null>(key, { path: "/", sameSite: "lax" }).value =
        null;
    },
  };
}

function resolveStorage(kind?: StorageKind | StorageLike): StorageLike {
  if (kind && typeof kind === "object") return kind;
  if (kind === "session") return sessionStorageAdapter();
  if (kind === "cookie") return cookieAdapter();
  return localStorageAdapter();
}

function pickPaths<T extends JsonObject>(state: T, paths?: string[]) {
  if (!paths?.length) return state;
  const out: JsonObject = {};
  for (const p of paths) {
    if (p in state) out[p] = state[p];
  }
  return out;
}

async function getKey(secret: string) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
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
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(secret);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );
  const buf = new Uint8Array(iv.length + encrypted.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...buf));
}

async function decrypt(cipher: string, secret: string) {
  const buf = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
  const iv = buf.slice(0, 12);
  const data = buf.slice(12);
  const key = await getKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return decoder.decode(decrypted);
}

function throttle<T extends (...a: any[]) => void>(fn: T, delay = 200): T {
  let last = 0;
  let timer: any;
  return function (...args: any[]) {
    const now = Date.now();
    const remain = delay - (now - last);
    if (remain <= 0) {
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remain);
    }
  } as T;
}

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia;
  const secret = useRuntimeConfig().persistSecret;

  pinia.use((store) => {
    const opts = store.options as { persist?: boolean | PersistOptions };
    if (!opts.persist) return;

    const cfg = typeof opts.persist === "boolean" ? {} : opts.persist;
    const key = cfg.key ?? `pinia:${store.store.$id}`;
    const storage = resolveStorage(cfg.storage);

    const hydrate = async () => {
      const raw = storage.getItem(key);
      if (!raw) return;
      const data = cfg.encrypt ? await decrypt(raw, secret) : raw;
      Object.assign(store.store.$state, JSON.parse(data));
    };

    hydrate();

    let save = async (state: StateTree) => {
      const picked = pickPaths(state as JsonObject, cfg.paths);
      const raw = JSON.stringify(picked);
      const data = cfg.encrypt ? await encrypt(raw, secret) : raw;
      storage.setItem(key, data);
    };

    if (cfg.throttle) save = throttle(save, cfg.throttle);

    store.store.$subscribe(
      (_m, state) => {
        save(state);
      },
      { detached: true }
    );
  });
});
