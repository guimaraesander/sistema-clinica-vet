// Middleware de validação que suporta Joi e Zod - Dani
// Aceita um schema único (aplicado ao body) ou um objeto { body, params, query }
import { z } from 'zod';

const isJoiSchema = (s) => s && s.isJoi === true;
const isZodSchema = (s) => s && typeof s.safeParse === 'function' && s instanceof z.ZodType;

const formatZodError = (error) =>
  error.issues.map((i) => `${i.path?.join('.') || 'field'}: ${i.message}`).join('; ');

export const validate = (schema) => (req, res, next) => {
  const normalize = (sch) => ({ body: sch });
  const target = schema && (isJoiSchema(schema) || isZodSchema(schema) ? normalize(schema) : schema);

  if (!target || (!target.body && !target.params && !target.query)) {
    return next();
  }

  const options = { abortEarly: false, stripUnknown: true }; // Joi: remove chaves desconhecidas

  const runValidation = (sch, data, where) => {
    // Joi
    if (isJoiSchema(sch)) {
      const { value, error } = sch.validate(data, options);
      if (error) {
        return { error: error.details.map((d) => d.message).join('; ') };
      }
      return { value };
    }
    // Zod
    if (isZodSchema(sch)) {
      const result = sch.safeParse(data);
      if (!result.success) {
        return { error: formatZodError(result.error) };
      }
      return { value: result.data };
    }
    // Esquema inválido
    return { error: `Invalid ${where} schema` };
  };

  // Validar body
  if (target.body) {
    const { value, error } = runValidation(target.body, req.body, 'body');
    if (error) return res.status(422).json({ message: error });
    req.body = value;
  }
  // Validar params
  if (target.params) {
    const { value, error } = runValidation(target.params, req.params, 'params');
    if (error) return res.status(422).json({ message: error });
    req.params = value;
  }
  // Validar query
  if (target.query) {
    const { value, error } = runValidation(target.query, req.query, 'query');
    if (error) return res.status(422).json({ message: error });
    req.query = value;
  }
  next();
};
