export class AppError extends Error {
  constructor(message, statusCode = 500, code = "internal_error") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida") {
    super(message, 400, "bad_request");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, 401, "unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Proibido") {
    super(message, 403, "forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Não encontrado") {
    super(message, 404, "not_found");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito") {
    super(message, 409, "conflict");
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Entidade inválida") {
    super(message, 422, "unprocessable_entity");
  }
}
