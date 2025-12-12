import { getDB } from "~~/server/db";
import { generateAccessToken } from "~~/server/utils/jwt";
import { userFields } from "~~/server/utils/user";
import { validate } from "~~/shared/validation";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { phone: string; password: string };
  const { phone, password } = body;

  validateBody(
    { phone, password },
    {
      phone: (v) => validate(v).required().phone().run(),
      password: (v) => validate(v).required().password().run(),
    }
  );

  const db = (await getDB()) as any;

  const [rows] = await db.execute(
    `SELECT ${userFields.join(", ")}, password FROM users WHERE phone = ?`,
    [phone]
  );

  const userRow = (rows as any[])[0];

  if (!userRow || !userRow.password) {
    throw createError({
      statusCode: 400,
      statusMessage: "شماره تلفن یا رمز عبور اشتباه است",
    });
  }

  const isMatch = await bcrypt.compare(password, userRow.password);

  if (!isMatch) {
    throw createError({
      statusCode: 400,
      statusMessage: "شماره تلفن یا رمز عبور اشتباه است",
    });
  }

  const { password: _pw, ...user } = userRow;

  const token = generateAccessToken(user);

  return { success: true, data: { token, user } };
});
