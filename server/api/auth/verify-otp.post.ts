import { getDB } from "~~/server/db";
import { generateAccessToken } from "~~/server/utils/jwt";
import { validate } from "~~/shared/validation";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { phone, code } = body;

  validateBody(body, {
    phone: (v) => validate(v).required().phone().run(),
    code: (v) => validate(v).required().equal(4).run(),
  });

  const db = (await getDB()) as any;

  const [rows] = await db.execute(
    "SELECT * FROM otp_codes WHERE phone=? AND code=? AND used=0",
    [phone, code]
  );

  const otp = (rows as any[])[0];

  if (!otp)
    throw createError({ statusCode: 400, statusMessage: "Invalid OTP" });
  if (new Date(otp.expires_at) < new Date())
    throw createError({ statusCode: 400, statusMessage: "OTP expired" });

  await db.execute("UPDATE otp_codes SET used=1 WHERE id=?", [otp.id]);

  const [userRows] = await db.execute("SELECT * FROM users WHERE phone=?", [
    phone,
  ]);
  let user = (userRows as any[])[0];

  if (!user) {
    const [result] = await db.execute("INSERT INTO users (phone) VALUES (?)", [
      phone,
    ]);

    const newUserId = (result as any).insertId;

    const [newUserRows] = await db.execute(
      `SELECT ${userFields.join(", ")} FROM users WHERE id=?`,  
      [newUserId]
    );

    user = (newUserRows as any[])[0];
  }

  const token = generateAccessToken(user);

  const data = { token, user };

  return { success: true, data };
});
