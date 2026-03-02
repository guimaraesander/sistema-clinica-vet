import { AppError } from "../utils/AppError.js";

function mapStatusToCode(statusCode) {
  switch (statusCode) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "unprocessable_entity";
    default:
      return statusCode >= 500 ? "internal_error" : "request_error";
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Sempre loga no terminal (bom para debug)
  console.error("Unhandled error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code || mapStatusToCode(err.statusCode),
    });
  }

  const statusCode = Number(err?.statusCode || err?.status || 500);
  const message = err?.message || "Erro interno do servidor";

  return res.status(statusCode).json({
    success: false,
    error: message,
    code: mapStatusToCode(statusCode),
  });
}