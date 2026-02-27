import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getPendingSellersService = async () => {
    return prisma.user.findMany({
        where: { role: 'vendedor', status: 'pending' },
        select: {
            id: true,
            name: true,
            email: true,
            cnpj: true,
            phone: true,
            address: true,
            createdAt: true
        }
    });
};

export const getSellerByIdService = async (id) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            cnpj: true,
            phone: true,
            address: true,
            status: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

export const updateSellerStatusService = async (id, status) => {
    return prisma.user.update({
        where: { id },
        data: { status: status === 'approved' ? 'active' : 'rejected' },
        select: {
            id: true,
            name: true,
            email: true,
            status: true
        }
    });
};

// Lista vendedores ativos/rejeitados/pendentes (opcionalmente filtra por status)
export const getSellersListService = async ({ search = '', status } = {}) => {
    const where = {
        role: 'vendedor',
        ...(status ? { status } : {}),
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { email: { contains: search, mode: 'insensitive' } },
                      { cnpj: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };
    const sellers = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, cnpj: true, status: true },
    });
    return sellers;
};

// Lista clientes com estatísticas (contagem de pedidos e total gasto)
export const getCustomersWithStatsService = async ({ skip = 0, take = 20, search = '' } = {}) => {
    const where = {
        role: 'cliente',
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { email: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };

    const total = await prisma.user.count({ where });
    const customers = await prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            _count: { select: { orders: true } },
        },
    });

    const customerIds = customers.map((c) => c.id);
    const totalsByBuyer = customerIds.length
        ? await prisma.order.groupBy({
              by: ['buyerId'],
              where: { buyerId: { in: customerIds } },
              _sum: { total: true },
          })
        : [];

    const totalsMap = new Map(totalsByBuyer.map((t) => [t.buyerId, t._sum.total || 0]));
    const items = customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
        ordersCount: c._count.orders,
        totalSpent: totalsMap.get(c.id) || 0,
    }));

    return { total, items };
};

// Lista produtos com dados do vendedor
export const getProductsListService = async ({ skip = 0, take = 20, search = '', sellerId, stockStatus } = {}) => {
    const where = {
        ...(search
            ? {
                  OR: [
                      { title: { contains: search, mode: 'insensitive' } },
                      { brand: { contains: search, mode: 'insensitive' } },
                      { seller: { name: { contains: search, mode: 'insensitive' } } },
                  ],
              }
            : {}),
        ...(sellerId ? { sellerId } : {}),
        ...(() => {
            if (!stockStatus || stockStatus === 'all') return {};
            if (stockStatus === 'out') return { stock: 0 };
            if (stockStatus === 'low') return { stock: { gt: 0, lte: 5 } };
            if (stockStatus === 'in') return { stock: { gt: 0 } };
            return {};
        })(),
    };

    const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                price: true,
                stock: true,
                createdAt: true,
                seller: { select: { id: true, name: true, email: true } },
            },
        }),
    ]);

    return { total, items: products };
};

// Lista pedidos/vendas com dados do comprador e contagem de itens
export const getOrdersListService = async ({ skip = 0, take = 20, status, search = '', buyerId } = {}) => {
    const where = {
        ...(status ? { status } : {}),
        ...(buyerId ? { buyerId } : {}),
        ...(search
            ? {
                  OR: [
                      { buyer: { name: { contains: search, mode: 'insensitive' } } },
                      { buyer: { email: { contains: search, mode: 'insensitive' } } },
                  ],
              }
            : {}),
    };

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                total: true,
                status: true,
                createdAt: true,
                buyer: { select: { id: true, name: true, email: true } },
                _count: { select: { items: true } },
            },
        }),
    ]);

    const items = orders.map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        buyer: o.buyer,
        itemsCount: o._count.items,
    }));

    return { total, items };
};

// Detalhes do cliente: dados básicos, pedidos e itens mais recentes
export const getCustomerDetailsService = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            address: true,
            phone: true,
            role: true,
        },
    });
    if (!user || user.role !== 'cliente') return null;

    const orders = await prisma.order.findMany({
        where: { buyerId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            _count: { select: { items: true } },
            items: {
                select: {
                    id: true,
                    quantity: true,
                    price: true,
                    product: { select: { id: true, title: true, seller: { select: { id: true, name: true } } } },
                },
            },
        },
    });

    const totalOrders = await prisma.order.count({ where: { buyerId: id } });
    const totalSpentAgg = await prisma.order.aggregate({
        where: { buyerId: id },
        _sum: { total: true },
    });

    return {
        user,
        stats: {
            totalOrders,
            totalSpent: totalSpentAgg._sum.total || 0,
        },
        orders,
    };
};
