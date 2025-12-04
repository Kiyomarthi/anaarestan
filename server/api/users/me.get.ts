import { JwtPayload } from "jsonwebtoken";
import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { userFields } from "~~/server/utils/user";

export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as JwtPayload;

  const db = (await getDB()) as any;

  if (!user?.id) return { success: false, message: "User not authenticated" };

  const [rows] = await db.execute(
    `SELECT ${userFields.join(", ")}, password FROM users WHERE id = ?`,
    [user?.id]
  );

  const userData = rows[0];

  const hasPassword = !!rows[0]?.password;

  return { success: true, user: { ...userData, hasPassword } };
});
