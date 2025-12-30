import bcrypt from "bcryptjs";
import type { H3Event } from "h3";
import { getQuery } from "h3";

export async function buildUpdateQuery(
  table: string,
  data: Record<string, unknown>,
  idField: string,
  idValue: unknown,
  allowedFields: string[]
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === "password") {
        const hash = await bcrypt.hash(data[key] as string, 10);
        values.push(hash);
      } else {
        values.push(data[key]);
      }
    }
  }

  if (fields.length === 0) return null;

  values.push(idValue);
  const sql = `UPDATE ${table} SET ${fields.join(", ")} WHERE ${idField} = ?`;

  return { sql, values };
}

export async function buildInsertQuery(
  table: string,
  data: Record<string, unknown>,
  allowedFields: string[]
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(key);
      if (key === "password") {
        const hash = await bcrypt.hash(data[key] as string, 10);
        values.push(hash);
      } else {
        values.push(data[key]);
      }
    }
  }

  if (fields.length === 0) return null;

  const placeholders = fields.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${fields.join(
    ", "
  )}) VALUES (${placeholders})`;

  return { sql, values };
}

const ABSOLUTE_URL_REGEX = /^(https?:)?\/\//i;

/**
 * Prefix a relative path with the provided site URL.
 * - Leaves absolute URLs unchanged
 * - Adds http:// when the site URL has no protocol
 * - Trims duplicate slashes between host and path
 */
export function buildAbsoluteUrl(
  path: string | null | undefined,
  siteUrl?: string
) {
  if (!path) return path;

  if (ABSOLUTE_URL_REGEX.test(path)) return path;

  const rawSite = (siteUrl || "").trim();
  if (!rawSite) return path;

  const normalizedSite = rawSite.match(/^https?:\/\//i)
    ? rawSite
    : `http://${rawSite}`;

  const host = normalizedSite.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${host}${normalizedPath}`;
}

export function buildCacheKey(event: H3Event, prefix: string): string {
  const query = getQuery(event) as Record<
    string,
    string | number | boolean | null | undefined
  >;

  const normalizedQuery = Object.keys(query)
    .sort()
    .map((key) => `${key}:${String(query[key])}`)
    .join("|");

  return `${prefix}:${normalizedQuery}`;
}
