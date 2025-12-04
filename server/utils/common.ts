export function buildUpdateQuery(
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
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return null;

  values.push(idValue);
  const sql = `UPDATE ${table} SET ${fields.join(", ")} WHERE ${idField} = ?`;

  return { sql, values };
}
