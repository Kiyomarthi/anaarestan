export function validateBody(
  body: any,
  schema: Record<string, (v: any) => true | string>
) {
  const errors: Record<string, string> = {};

  for (const key in schema) {
    const result = schema[key](body[key]);
    if (result !== true) {
      errors[key] = result;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw createError({
      statusCode: 400,
      message: "Validation Error",
      data: errors,
    });
  }

  return true;
}
