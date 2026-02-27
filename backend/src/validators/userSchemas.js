import Joi from 'joi';

const strongPassword = Joi.string().min(8).pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'));

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(50),
  email: Joi.string().email(), // opcional no update
  password: strongPassword,
  address: Joi.string().max(255).allow('', null),
  phone: Joi.string().max(30).allow('', null),
  cnpj: Joi.string().max(30).allow('', null),
}).min(1); // precisa de pelo menos um campo

export const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(50),
  email: Joi.string().email(),
  role: Joi.string().valid('admin', 'cliente', 'vendedor'),
  password: strongPassword,
  address: Joi.string().max(255).allow('', null),
  phone: Joi.string().max(30).allow('', null),
  cnpj: Joi.string().max(30).allow('', null),
}).min(1);
