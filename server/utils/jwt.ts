import jwt from "jsonwebtoken";

interface UserPayload {
  id: number;
  phone: string;
  role: "admin" | "user";
}

export const generateAccessToken = (user: UserPayload) => {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET!,
    {
      expiresIn: "48h",
    }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
};
