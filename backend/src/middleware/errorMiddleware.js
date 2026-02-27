import { AppError } from "../utils/AppError.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Caso use AppError (padrão do projeto antigo)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code || "app_error",
    });
  }

  // Caso lance Error normal com statusCode/status (como fizemos no caixaService)
  const statusCode = err.statusCode || err.status || 500;

  // Log no terminal (dev)
  console.error("Unhandled error:", err);

  return res.status(statusCode).json({
    success: false,
    error: err.message || "Erro interno do servidor",
    code: statusCode === 500 ? "internal_error" : "request_error",
  });
}