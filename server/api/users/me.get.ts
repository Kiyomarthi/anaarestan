import { getDB } from "~~/server/db";
import { userFields } from "~~/server/utils/user";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  const db = (await getDB()) as any;

  if (!user?.id) return { success: false, message: "User not authenticated" };

  const [rows] = await db.execute(
    `SELECT ${userFields.join(", ")}, password FROM users WHERE id = ?`,
    [user?.id]
  );

  const userData = rows[0];

  const hasPassword = !!rows[0]?.password;

  delete userData.password;

  return { success: true, user: { ...userData, hasPassword } };
});
