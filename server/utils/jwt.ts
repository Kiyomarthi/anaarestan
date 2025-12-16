import jwt from "jsonwebtoken";

interface UserPayload {
  id: number;
  phone: string;
  role: "admin" | "user";
}

export const generateAccessToken = (user: UserPayload) => {
  const config = useRuntimeConfig();
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    config.jwtSecret!,
    {
      expiresIn: "48h",
    }
  );
};

export const verifyToken = (token: string) => {
  const config = useRuntimeConfig();
  try {
    return jwt.verify(token, config.jwtSecret!);
  } catch {
    return null;
  }
};
