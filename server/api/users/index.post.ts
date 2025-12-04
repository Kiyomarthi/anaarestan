import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { userAdminFields, userFields } from "~~/server/utils/user";
import bcrypt from "bcrypt";
import { validate } from "~~/shared/validation";
import { buildInsertQuery } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const body = await readBody(event);
  const { full_name, phone, role, password } = body;

  validateBody(body, {
    full_name: (v) => validate(v).min(3).max(100).run(),
    phone: (v) => validate(v).required().phone().run(),
    role: (v) => validate(v).required().checkRule(["admin", "user"]).run(),
    password: (v) => validate(v).password().run(),
  });

  const db = await getDB();

  // Check for duplicate phone
  const [existing] = (await db.execute("SELECT id FROM users WHERE phone = ?", [
    phone,
  ])) as any[];
  if (Array.isArray(existing) && existing.length > 0) {
    return {
      success: false,
      message: "User with this phone already exists.",
    };
  }

  // Insert new user
  const values: any[] = [full_name, phone, role];

  const query = await buildInsertQuery("users", body, userAdminFields);

  if (!query) {
    return {
      success: false,
      data: {
        message: "هیچ فیلدی برای ثبت وجود ندارد.",
      },
    };
  }

  const [result] = (await db.execute(query.sql, query.values)) as any[];

  return {
    success: true,
    data: result[0],
  };
});
