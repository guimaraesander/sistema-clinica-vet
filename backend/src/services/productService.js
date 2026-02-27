import prisma from "../config/prisma.js";

export async function listProductsService({ search } = {}) {
  const where = {
    ativo: true,
    ...(search
      ? {
          OR: [
            { nome: { contains: search, mode: "insensitive" } },
            { codigo: { contains: search, mode: "insensitive" } },
            { categoria: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const produtos = await prisma.produto.findMany({
    where,
    orderBy: [{ nome: "asc" }],
    include: {
      estoqueSaldo: true,
    },
  });

  return produtos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nome: p.nome,
    categoria: p.categoria,
    precoVenda: Number(p.precoVenda),
    custo: p.custo ? Number(p.custo) : null,
    estoqueMin: p.estoqueMin,
    ativo: p.ativo,
    estoqueAtual: p.estoqueSaldo?.quantidade ?? 0,
    createdAt: p.createdAt,
  }));
}