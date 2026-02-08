export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class FudoApiError extends AppError {
  constructor(
    message: string,
    public fudoStatus?: number,
    public fudoResponse?: unknown
  ) {
    super(message, "FUDO_API_ERROR", fudoStatus || 500);
    this.name = "FudoApiError";
  }
}

export class AuthError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Sin permisos para esta accion") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error("Unhandled error:", error);
  return Response.json(
    { error: "Error interno del servidor", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
