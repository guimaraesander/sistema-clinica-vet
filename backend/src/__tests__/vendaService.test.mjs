import { jest } from "@jest/globals";

const mockPrisma = {
  usuario: { findUnique: jest.fn() },
  caixa: { findFirst: jest.fn() },
  produto: { findMany: jest.fn() },
  $transaction: jest.fn(),
};

jest.unstable_mockModule("../config/prisma.js", () => ({
  default: mockPrisma,
}));

const { AppError } = await import("../utils/AppError.js");
const { criarVendaService } = await import("../services/vendaService.js");

function setupBaseMocks() {
  mockPrisma.usuario.findUnique.mockResolvedValue({
    id: "usr_1",
    nome: "Caixa",
    perfil: "CAIXA",
    ativo: true,
  });

  mockPrisma.caixa.findFirst.mockResolvedValue({
    id: "cx_1",
    status: "ABERTO",
  });

  mockPrisma.produto.findMany.mockResolvedValue([
    {
      id: "prd_1",
      codigo: "789",
      nome: "Ração",
      precoVenda: 10,
    },
  ]);
}

describe("criarVendaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupBaseMocks();
  });

  it("deve usar baixa de estoque condicional (updateMany com quantidade gte)", async () => {
    const tx = {
      venda: {
        create: jest.fn().mockResolvedValue({
          id: "ven_1",
          status: "PENDENTE",
          pagoNoAto: 0,
          fiadoValor: 20,
        }),
      },
      vendaItem: { create: jest.fn().mockResolvedValue({}) },
      estoqueSaldo: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
      },
      estoqueMov: { create: jest.fn().mockResolvedValue({}) },
    };

    mockPrisma.$transaction.mockImplementation(async (fn) => fn(tx));

    await criarVendaService({
      usuarioId: "usr_1",
      itens: [{ produtoId: "prd_1", quantidade: 2 }],
    });

    expect(tx.estoqueSaldo.updateMany).toHaveBeenCalledWith({
      where: {
        produtoId: "prd_1",
        quantidade: { gte: 2 },
      },
      data: {
        quantidade: { decrement: 2 },
      },
    });
  });

  it("deve falhar com 409 quando não consegue debitar estoque", async () => {
    const tx = {
      venda: {
        create: jest.fn().mockResolvedValue({
          id: "ven_1",
          status: "PENDENTE",
          pagoNoAto: 0,
          fiadoValor: 20,
        }),
      },
      vendaItem: { create: jest.fn().mockResolvedValue({}) },
      estoqueSaldo: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn().mockResolvedValue({ quantidade: 1 }),
      },
      estoqueMov: { create: jest.fn().mockResolvedValue({}) },
    };

    mockPrisma.$transaction.mockImplementation(async (fn) => fn(tx));

    await expect(
      criarVendaService({
        usuarioId: "usr_1",
        itens: [{ produtoId: "prd_1", quantidade: 2 }],
      })
    ).rejects.toEqual(
      expect.objectContaining({
        statusCode: 409,
        code: "request_error",
      })
    );

    expect(tx.estoqueSaldo.findUnique).toHaveBeenCalledWith({
      where: { produtoId: "prd_1" },
      select: { quantidade: true },
    });
  });

  it("deve falhar com 404 quando produto não existe", async () => {
    mockPrisma.produto.findMany.mockResolvedValue([]);

    await expect(
      criarVendaService({
        usuarioId: "usr_1",
        itens: [{ produtoId: "prd_inexistente", quantidade: 1 }],
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
