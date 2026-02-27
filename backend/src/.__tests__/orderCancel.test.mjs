import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import orderService, { __setPrismaClient } from "../services/orderService.js";
import { PrismaClient } from "@prisma/client";

describe('OrderService.cancelOrder', () => {
  let prisma;

  beforeAll(() => { prisma = new PrismaClient(); });
  afterAll(async () => { if (prisma?.$disconnect) await prisma.$disconnect(); });

  test('cancela pedido e devolve estoque', async () => {
    const requester = { id: 'buyer1', role: 'cliente' };
    const order = {
      id: 'o1', buyerId: 'buyer1', status: 'EM_PREPARACAO', items: [ { productId: 'p1', quantity: 2 } ]
    };

    prisma.order = { findUnique: jest.fn().mockResolvedValue(order) };
    prisma.$transaction = jest.fn(async (fn) => {
      const tx = {
        product: { update: jest.fn().mockResolvedValue({ id: 'p1', stock: 12 }) },
        order: { update: jest.fn().mockResolvedValue({ ...order, status: 'CANCELADO' }) }
      };
      return fn(tx);
    });

    __setPrismaClient(prisma);

    const result = await orderService.cancelOrder(order.id, requester);
    expect(result.status).toBe('CANCELADO');
  });

  test('bloqueia cancelamento quando status é ENVIADO', async () => {
    const requester = { id: 'buyer1', role: 'cliente' };
    const order = { id: 'o2', buyerId: 'buyer1', status: 'ENVIADO', items: [] };
    prisma.order = { findUnique: jest.fn().mockResolvedValue(order) };
    __setPrismaClient(prisma);
    await expect(orderService.cancelOrder(order.id, requester)).rejects.toHaveProperty('statusCode', 409);
  });

  test('apenas admin ou comprador podem cancelar', async () => {
    const requester = { id: 'other', role: 'cliente' };
    const order = { id: 'o3', buyerId: 'buyer1', status: 'AGUARDANDO_PAGAMENTO', items: [] };
    prisma.order = { findUnique: jest.fn().mockResolvedValue(order) };
    __setPrismaClient(prisma);
    await expect(orderService.cancelOrder(order.id, requester)).rejects.toHaveProperty('statusCode', 403);
  });
});
