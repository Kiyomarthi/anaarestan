import { getDB } from "~~/server/db";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import { requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";

export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as JwtPayload;
  const body = await readBody(event);

  const oldPassword = body?.oldPassword;
  const newPassword = body?.newPassword;
  const userId = body?.id;

  validateBody(body, {
    id: (v) => validate(v).required().run(),
  });

  if (user.id != userId) {
    requireRole(event, "admin");
  }

  const db = (await getDB()) as any;

  const [rows] = await db.execute("SELECT password FROM users WHERE id = ?", [
    userId,
  ]);

  if (rows[0].password) {
    if (!oldPassword || !newPassword)
      throw createError({
        statusCode: 400,
        statusMessage: "Both passwords are required",
      });
  } else {
    if (!newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "new password are required",
      });
    }
  }

  if (rows[0].password) {
    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch)
      throw createError({
        statusCode: 400,
        statusMessage: "Old password is incorrect",
      });

    if (await bcrypt.compare(newPassword, rows[0].password)) {
      throw createError({
        statusCode: 400,
        statusMessage: "New password must be different from old password",
      });
    }
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await db.execute("UPDATE users SET password = ? WHERE id = ?", [
    hash,
    userId,
  ]);

  return { success: true };
});
