export const protectedRoutes: string[] = [
  "/api/user/update-password",
  "/api/user/update",
  "/api/user/me",
  "/api/products", // POST only (GET is public)
  "/api/products/[id]", // PUT and DELETE
];
