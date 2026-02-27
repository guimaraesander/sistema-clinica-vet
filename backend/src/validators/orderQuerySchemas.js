import { z } from "zod";

export const listOrdersQuery = {
  query: z.object({
    page: z.string().transform(Number).optional(),
    pageSize: z.string().transform(Number).optional(),
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    buyerId: z.string().optional(),
  })
};

export const listSellerOrdersQuery = {
  query: z.object({
    page: z.string().transform(Number).optional(),
    pageSize: z.string().transform(Number).optional(),
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    buyerId: z.string().optional(),
    sellerId: z.string().optional(), // opcional para admin auditar, vendedor ignora esse valor
  })
};
