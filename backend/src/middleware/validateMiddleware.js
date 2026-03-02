import { AppError } from "../utils/AppError.js";

export function validate(schema) {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details?.map((d) => d.message).join("; ") || "Payload invalido.";
      return next(new AppError(details, 400, "request_error"));
    }

    req.body = value;
    return next();
  };
}

