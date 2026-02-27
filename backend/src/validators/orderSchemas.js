import { z } from "zod";

export const createOrderSchema = {
  body: z.object({
    cep: z.string().min(5).optional(),
    cidade: z.string().min(2).optional(),
    enderecoEntrega: z.string().min(3).optional(),
    complemento: z.string().optional(),
    dataEntregaPrevista: z.string().optional(),
    estado: z.string().min(2).max(2).optional(),
    metodoPagamento: z.enum(["pix", "cartao", "boleto"]).optional()
  })
};
