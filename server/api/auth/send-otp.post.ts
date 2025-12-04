import { randomInt } from "crypto";
import { getDB } from "~~/server/db";
import { validate } from "~~/shared/validation/index";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  validateBody(body, {
    phone: (v) => validate(v).required().phone().run(),
  });

  const phone = body.phone;

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  // const response: any = await $fetch("https://api.sms.ir/v1/send/verify", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Accept: "text/plain",
  //     "x-api-key": "uKJCIorPSowvCxfjP9Z36gkncDwE8fQVMIofVa6kgJIqlxEf",
  //   },
  //   body: {
  //     phone,
  //     templateId: 123456,
  //     parameters: [{ name: "Code", value: code }],
  //   },
  // });

  const db = (await getDB()) as any;

  const [rows] = await db.execute(
    "SELECT code, expires_at FROM otp_codes WHERE phone = ? ORDER BY expires_at DESC LIMIT 1",
    [phone]
  );

  const lastOtp = rows[0] as { code: string; expires_at: Date } | undefined;

  if (lastOtp) {
    const now = new Date();
    const expiresAt = new Date(lastOtp.expires_at);
    if (expiresAt > now) {
      const remaining = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
      const data = {
        message: `An OTP is already sent. Try again in ${remaining} seconds.`,
        remaining,
      };
      return {
        success: false,
        data,
      };
    }
  }

  await db.execute(
    "INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)",
    [phone, code, expiresAt]
  );

  // const data = { expiresAt, response: response?.data };
  const data = { expiresAt, code };

  return { success: true, data };
});
