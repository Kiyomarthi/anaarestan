import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { buildUpdateQuery } from "~~/server/utils/common";
import { userAdminFields, userFields } from "~~/server/utils/user";
import { validate } from "~~/shared/validation";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");
  const id = event.context.params?.id;
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه کاربر ارسال نشده است",
    });
  }

  validateBody(body, {
    full_name: (v) => validate(v).min(3).max(100).run(),
    phone: (v) => validate(v).phone().run(),
    role: (v) => validate(v).checkMatch(["admin", "user"]).run(),
    password: (v) => validate(v).password().run(),
  });

  const query = await buildUpdateQuery(
    "users",
    body,
    "id",
    id,
    userAdminFields
  );

  if (!query) {
    return {
      success: false,
      message: "هیچ فیلد معتبری برای بروزرسانی ارسال نشده است",
    };
  }

  const db = await getDB();
  await db.execute(query.sql, query.values);

  const [rows] = (await db.execute(
    `SELECT ${userFields.join(", ")} FROM users WHERE id = ?`,
    [id]
  )) as any[];

  return {
    success: true,
    data: rows[0] || null,
  };
});
