import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const criarProdutoVendedorService = async (data, userId) => {
    return prisma.product.create({
        data: {
            ...data,
            price: parseFloat(data.price),
            stock: parseInt(data.stock),
            seller: { connect: { id: userId } },
            category: { connect: { id: data.categoryId } }
        }
    });
};

export const listarMeusProdutosService = async (userId) => {
    return prisma.product.findMany({
        where: { sellerId: userId },
        include: { category: true },
        orderBy: { createdAt: 'desc' }
    });
};

export const atualizarProdutoService = async (id, vendedorId, data) => {
    const produto = await prisma.product.findUnique({ where: { id } });
    if (!produto) throw new Error('Produto não encontrado');
    if (produto.sellerId !== vendedorId) throw new Error('Acesso negado');
    return prisma.product.update({ where: { id }, data });
};

export const listarPedidosDoVendedorService = async (userId) => {
    return prisma.order.findMany({
        where: { items: { some: { product: { sellerId: userId } } } },
        include: {
            items: { include: { product: true } },
            buyer: true
        },
        orderBy: { createdAt: 'desc' }
    });
};
