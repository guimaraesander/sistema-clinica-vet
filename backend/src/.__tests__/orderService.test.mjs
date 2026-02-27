import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import orderService, { __setPrismaClient } from "../services/orderService.js";
import productService from "../services/productService.js";
import { NotFoundError } from "../utils/AppError.js";

// Mock prisma internals used by orderService
import { PrismaClient } from "@prisma/client";

describe('OrderService.createOrderFromCart', () => {
  let prisma;

  beforeAll(() => { prisma = new PrismaClient(); });

  afterAll(async () => {
    if (prisma?.$disconnect) await prisma.$disconnect();
  });

  test('happy path: cria pedido a partir do carrinho', async () => {
    // Arrange: mock prisma methods
    const userId = 'u1';
    const cart = { id: 'c1', items: [ { productId: 'p1', quantity: 2, product: { price: 100 } } ] };

    // Spy on prisma methods used
    prisma.cart = { findUnique: jest.fn().mockResolvedValue(cart) };
    prisma.$transaction = jest.fn(async (fn) => {
      const tx = {
        order: { create: jest.fn().mockResolvedValue({ id: 'o1', total: 200, items: cart.items }) },
        cartItem: { deleteMany: jest.fn() },
        cart: { delete: jest.fn() },
        product: { findUnique: jest.fn().mockResolvedValue({ stock: 10, price: 100 }), update: jest.fn() }
      };
      return fn(tx);
    });

    // Mock productService.ensureStock
    jest.spyOn(productService, 'ensureStock').mockResolvedValue({ id: 'p1', stock: 10, title: 'X' });

  // injetar prisma mock no service
  __setPrismaClient(prisma);

    // Act
    const result = await orderService.createOrderFromCart(userId, {});

    // Assert
    expect(result.id).toBe('o1');
    expect(result.total).toBe(200);
  });

  test('falha por estoque insuficiente', async () => {
    const userId = 'u1';
    const cart = { id: 'c1', items: [ { productId: 'p1', quantity: 5, product: { price: 100 } } ] };

    prisma.cart = { findUnique: jest.fn().mockResolvedValue(cart) };
    prisma.$transaction = jest.fn(async (fn) => {
      const tx = { product: { findUnique: jest.fn().mockResolvedValue({ stock: 3 }) } };
      // A transação deve lançar conflito
      return fn(tx);
    });

    jest.spyOn(productService, 'ensureStock').mockResolvedValue({ id: 'p1', stock: 3, title: 'X' });

  __setPrismaClient(prisma);

    await expect(orderService.createOrderFromCart(userId, {})).rejects.toHaveProperty('statusCode', 409);
  });

  test('falha por carrinho vazio (400)', async () => {
    const userId = 'u1';
    const cart = { id: 'c1', items: [] };
    prisma.cart = { findUnique: jest.fn().mockResolvedValue(cart) };
    __setPrismaClient(prisma);
    await expect(orderService.createOrderFromCart(userId, {})).rejects.toHaveProperty('statusCode', 400);
  });

  test('falha por produto inexistente (404)', async () => {
    const userId = 'u1';
    const cart = { id: 'c1', items: [ { productId: 'p404', quantity: 1, product: { price: 100 } } ] };

    prisma.cart = { findUnique: jest.fn().mockResolvedValue(cart) };
    // ensureStock lança NotFoundError antes de entrar na transação
    jest.spyOn(productService, 'ensureStock').mockImplementation(() => { throw new NotFoundError('Produto não encontrado'); });

    __setPrismaClient(prisma);

    await expect(orderService.createOrderFromCart(userId, {})).rejects.toHaveProperty('statusCode', 404);
  });

  test('preço alterado: recalcula total com preço atual', async () => {
    const userId = 'u1';
    const cart = { id: 'c2', items: [ { productId: 'p2', quantity: 2, product: { price: 100 } } ] };

    prisma.cart = { findUnique: jest.fn().mockResolvedValue(cart) };
    prisma.$transaction = jest.fn(async (fn) => {
      const tx = {
        order: { create: jest.fn().mockImplementation(({ data }) => {
          // retorna o total e itens criados usando os preços recalculados
          return Promise.resolve({ id: 'o2', total: data.total, items: data.items.create });
        }) },
        cartItem: { deleteMany: jest.fn() },
        cart: { delete: jest.fn() },
        product: { findUnique: jest.fn().mockResolvedValue({ stock: 10, price: 150 }), update: jest.fn() }
      };
      return fn(tx);
    });

    jest.spyOn(productService, 'ensureStock').mockResolvedValue({ id: 'p2', stock: 10, title: 'Y' });

    __setPrismaClient(prisma);

    const result = await orderService.createOrderFromCart(userId, {});
    expect(result.total).toBe(300); // 2 * 150
    expect(result.items[0].price).toBe(150);
  });
});
