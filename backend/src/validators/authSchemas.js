import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['cliente', 'vendedor']),
    phone: z.string().min(8).optional(),
    address: z.string().min(3).optional(),
    cnpj: z.string().min(14).max(18).optional(),
  }).strict()
    .refine((data) => data.role !== 'vendedor' || !!data.cnpj, {
      message: 'CNPJ é obrigatório para vendedores.',
      path: ['cnpj']
    })
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }).strict()
};
