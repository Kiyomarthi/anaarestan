import bcrypt from "bcrypt";

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
