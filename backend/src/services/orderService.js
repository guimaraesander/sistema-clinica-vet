import { PrismaClient } from "@prisma/client";
import { customAlphabet } from "nanoid";
import productService from "./productService.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/AppError.js";
let prisma = new PrismaClient();

// Apenas para testes: permite injetar um prisma mock
export const __setPrismaClient = (client) => {
  prisma = client;
};

class OrderService {
  /**
   * Listagem de pedidos por vendedor, com filtros opcionais via query.
   */
  async listOrdersBySeller(sellerId, query = {}) {
    // Filtros básicos: status, período
    const where = {
      items: {
        some: {
          product: { sellerId: String(sellerId) }
        }
      }
    };
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    // Filtra itens do seller
    return orders.map((o) => {
      const sellerItems = o.items.filter((it) => it.product?.sellerId === String(sellerId));
      const totalSeller = sellerItems.reduce((acc, it) => acc + Number(it.price) * it.quantity, 0);
      return {
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        buyer: o.buyer,
        items: sellerItems,
        totalVendedor: totalSeller,
      };
    });
  }
  async createOrderFromCart(userId, payload) {
    // payload pode conter dados de entrega e pagamento
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) throw new BadRequestError("Carrinho vazio");

    // Verificar estoque de todos os itens antes (pré-check)
    for (const item of cart.items) {
      await productService.ensureStock(item.productId, item.quantity);
    }

    // Normalização de campos vindos do payload
    // metodoPagamento pode vir como 'pix' | 'cartao' do frontend ou já no enum
    let metodoPagamento = payload.metodoPagamento;
    if (typeof metodoPagamento === 'string') {
      const m = metodoPagamento.toUpperCase();
      if (m === 'PIX') metodoPagamento = 'PIX';
      else if (m === 'CARTAO' || m === 'CARTAO_CREDITO' || m === 'CARTAO-DE-CREDITO') metodoPagamento = 'CARTAO_CREDITO';
      else if (m === 'CARTAO_DEBITO' || m === 'DEBITO') metodoPagamento = 'CARTAO_DEBITO';
      else if (m === 'BOLETO') metodoPagamento = 'BOLETO';
      else if (m === 'TRANSFERENCIA' || m === 'TRANSFERENCIA_BANCARIA') metodoPagamento = 'TRANSFERENCIA_BANCARIA';
    }

    // dataEntregaPrevista pode vir como string ou Date
    let dataEntregaPrevista = payload.dataEntregaPrevista
      ? new Date(payload.dataEntregaPrevista)
      : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // transação: recalcula preços atuais, cria pedido + itens, limpa carrinho, decrementa estoque (checagem atômica)
    const order = await prisma.$transaction(async (tx) => {
      // Recalcular preços e checar estoque com dados atuais
      let totalAtual = 0;
      const orderItemsDataAtual = [];
      for (const item of cart.items) {
        const p = await tx.product.findUnique({ where: { id: String(item.productId) }, select: { price: true, stock: true } });
        if (!p || p.stock < item.quantity) {
          throw new ConflictError("Estoque insuficiente para um ou mais itens");
        }
        const priceNow = Number(p.price);
        totalAtual += priceNow * item.quantity;
        orderItemsDataAtual.push({ productId: item.productId, quantity: item.quantity, price: priceNow });
      }

      const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
      const orderId = nanoid();

      // criar pedido com preços recalculados
      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          buyerId: userId,
          total: totalAtual,
          cep: payload.cep,
          cidade: payload.cidade,
          enderecoEntrega: payload.enderecoEntrega,
          complemento: payload.complemento,
          dataEntregaPrevista,
          estado: payload.estado,
          cpf: payload.cpf,
          metodoPagamento,
          items: { create: orderItemsDataAtual }
        },
        include: { items: { include: { product: true } }, buyer: true }
      });

      // limpar carrinho
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });

      // decrementar estoque com checagem (não permitir estoque negativo)
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: String(item.productId) },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return createdOrder;
    });

    return order;
  }

  async listMyOrders(userId) {
    return prisma.order.findMany({ where: { buyerId: userId }, include: { items: { include: { product: true } } } });
  }

  async getOrderByIdForUser(orderId, requester) {
    const id = String(orderId);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, buyer: true }
    });
    if (!order) throw new NotFoundError("Pedido não encontrado");

    const isAdmin = requester?.role === 'admin';
    const isBuyer = order.buyerId === requester?.id;
    if (!isAdmin && !isBuyer) {
      throw new ForbiddenError("Sem permissão para visualizar este pedido");
    }
    return order;
  }

  async listAllOrders() {
    return prisma.order.findMany({ include: { items: true, buyer: true } });
  }

  async updateOrderStatus(orderId, status) {
    const next = String(status);
    const allowedStatuses = [
      'AGUARDANDO_PAGAMENTO',
      'PAGAMENTO_CONFIRMADO',
      'EM_PREPARACAO',
      'ENVIADO',
      'ENTREGUE',
      'CANCELADO',
      'DEVOLVIDO'
    ];
    if (!allowedStatuses.includes(next)) {
      throw new BadRequestError(`Status inválido: ${next}`);
    }

    const id = String(orderId);
    const order = await prisma.order.findUnique({ where: { id }, select: { status: true, statusPagamento: true } });
    if (!order) throw new NotFoundError('Pedido não encontrado');

    // Máquina de estados simples
    const canGo = {
      AGUARDANDO_PAGAMENTO: ['PAGAMENTO_CONFIRMADO', 'CANCELADO'],
      PAGAMENTO_CONFIRMADO: ['EM_PREPARACAO', 'CANCELADO'],
      EM_PREPARACAO: ['ENVIADO', 'CANCELADO'],
      ENVIADO: ['ENTREGUE', 'DEVOLVIDO'],
      ENTREGUE: ['DEVOLVIDO'],
      CANCELADO: [],
      DEVOLVIDO: [],
    };

    const current = order.status;
    const allowedNext = canGo[current] || [];
    if (!allowedNext.includes(next)) {
      throw new ConflictError(`Transição de status não permitida: ${current} -> ${next}`);
    }

    // Ajuste de statusPagamento coerente
    let statusPagamento = order.statusPagamento;
    if (next === 'PAGAMENTO_CONFIRMADO' || next === 'EM_PREPARACAO' || next === 'ENVIADO' || next === 'ENTREGUE') {
      statusPagamento = 'PAGO';
    }
    if (next === 'CANCELADO') {
      statusPagamento = 'CANCELADO';
    }
    if (next === 'DEVOLVIDO') {
      statusPagamento = 'REEMBOLSADO';
    }

    return prisma.order.update({ where: { id }, data: { status: next, statusPagamento } });
  }

  /**
   * Métricas agregadas para ADMIN.
   * Filtros: status, from, to, buyerId.
   * Retorna: totalPedidos, totalItens, faturamentoTotal, statusBreakdown {status: count}.
   */
  async getAdminMetrics({ status, from, to, buyerId }) {
    const where = {};
    if (status) where.status = String(status);
    if (buyerId) where.buyerId = String(buyerId);
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalPedidos = orders.length;
    const totalItens = orders.reduce((acc, o) => acc + o.items.reduce((a, it) => a + it.quantity, 0), 0);
    const faturamentoTotal = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const statusBreakdown = orders.reduce((map, o) => {
      map[o.status] = (map[o.status] || 0) + 1;
      return map;
    }, {});

    return { totalPedidos, totalItens, faturamentoTotal, statusBreakdown };
  }

  /**
   * Métricas agregadas para VENDEDOR (ou admin com sellerId).
   * Filtros: status, from, to.
   * Retorna: totalPedidosSeller, totalItensSeller, totalFaturadoSeller, statusBreakdown (por pedidos com itens do seller).
   */
  async getSellerMetrics(sellerId, { status, from, to, buyerId }) {
    const where = {
      items: { some: { product: { sellerId: String(sellerId) } } }
    };
    if (status) where.status = String(status);
    if (buyerId) where.buyerId = String(buyerId);
    if (from || to) {
      const createdAt = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      where.createdAt = createdAt;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const totalPedidosSeller = orders.length;
    let totalItensSeller = 0;
    let totalFaturadoSeller = 0;
    const statusBreakdown = {};

    for (const o of orders) {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
      const sellerItems = o.items.filter((it) => it.product?.sellerId === String(sellerId));
      totalItensSeller += sellerItems.reduce((a, it) => a + it.quantity, 0);
      totalFaturadoSeller += sellerItems.reduce((a, it) => a + Number(it.price) * it.quantity, 0);
    }

    return { totalPedidosSeller, totalItensSeller, totalFaturadoSeller, statusBreakdown };
  }

  /**
   * Cancela um pedido (cliente que é o comprador ou admin).
   * Regras:
   * - Só pode cancelar se status ∈ [AGUARDANDO_PAGAMENTO, PAGAMENTO_CONFIRMADO, EM_PREPARACAO]
   * - Admin também segue a mesma regra
   * - Ao cancelar, estoque de cada produto é devolvido (incremento) em transação.
   */
  async cancelOrder(orderId, requester) {
    const id = String(orderId);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) throw new NotFoundError("Pedido não encontrado");

    const isAdmin = requester?.role === 'admin';
    const isBuyer = order.buyerId === requester?.id;
    if (!isAdmin && !isBuyer) {
      throw new ForbiddenError("Sem permissão para cancelar este pedido");
    }

    const cancelableStatuses = [
      'AGUARDANDO_PAGAMENTO',
      'PAGAMENTO_CONFIRMADO',
      'EM_PREPARACAO'
    ];
    if (!cancelableStatuses.includes(order.status)) {
      throw new ConflictError("Pedido não pode ser cancelado no status atual");
    }

    const result = await prisma.$transaction(async (tx) => {
      // devolve estoque (tolerante a produto removido)
      for (const it of order.items) {
        await tx.product.updateMany({
          where: { id: String(it.productId) },
          data: { stock: { increment: it.quantity } }
        });
      }

      // atualiza pedido
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELADO',
          statusPagamento: 'CANCELADO'
        },
        include: { items: true }
      });
      return updated;
    });

    return result;
  }

  /**
   * Cancelamento por VENDEDOR (Opção A):
   * - Só permite cancelar o pedido inteiro se TODOS os itens pertencem ao vendedor solicitante.
   * - Status permitido: AGUARDANDO_PAGAMENTO, PAGAMENTO_CONFIRMADO, EM_PREPARACAO
   * - Devolve estoque de todos os itens e marca como CANCELADO/CANCELADO
   */
  async cancelOrderBySeller(orderId, requester) {
    const sellerId = String(requester?.id);
    if (!requester || requester.role !== 'vendedor') {
      throw new ForbiddenError('Apenas vendedores podem cancelar por esta rota');
    }

    const id = String(orderId);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!order) throw new NotFoundError('Pedido não encontrado');

    // Verifica se todos os itens pertencem ao vendedor
    if (!order.items.length) throw new ConflictError('Pedido sem itens');
    const allFromSeller = order.items.every((it) => it.product?.sellerId === sellerId);
    if (!allFromSeller) {
      throw new ForbiddenError('Pedido contém itens de outros vendedores; cancelamento total não permitido');
    }

    const cancelableStatuses = [
      'AGUARDANDO_PAGAMENTO',
      'PAGAMENTO_CONFIRMADO',
      'EM_PREPARACAO'
    ];
    if (!cancelableStatuses.includes(order.status)) {
      throw new ConflictError('Pedido não pode ser cancelado no status atual');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Devolve estoque de todos os itens do pedido
      for (const it of order.items) {
        await tx.product.updateMany({
          where: { id: String(it.productId) },
          data: { stock: { increment: it.quantity } }
        });
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CANCELADO', statusPagamento: 'CANCELADO' },
        include: { items: true }
      });
      return updated;
    });

    return result;
  }

  /**
   * Lista pedidos que contenham itens de produtos do vendedor informado.
   * Retorna somente os itens pertencentes ao vendedor (não expõe itens de outros vendedores).
   */
  async listSellerOrders(sellerId) {
    // Buscar pedidos que têm pelo menos um item cujo produto pertence ao seller
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: { sellerId: String(sellerId) }
          }
        }
      },
      include: {
        buyer: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Filtrar itens por sellerId para não vazar itens de outros sellers no mesmo pedido
    const filtered = orders.map((o) => {
      const sellerItems = o.items.filter((it) => it.product?.sellerId === String(sellerId));
      const totalSeller = sellerItems.reduce((acc, it) => acc + Number(it.price) * it.quantity, 0);
      return {
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        buyer: o.buyer,
        items: sellerItems,
        totalVendedor: totalSeller,
      };
    });

    return filtered;
  }

  /**
   * Listagem paginada e filtrada para admin.
   */
  async listAllOrdersPaginated({ page = 1, pageSize = 10, status, from, to, buyerId }) {
    const where = {};
    if (status) where.status = status;
    if (buyerId) where.buyerId = String(buyerId);
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const take = Number(pageSize);
    const skip = (Number(page) - 1) * take;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { items: true, buyer: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      })
    ]);

    return {
      data: orders,
      pagination: {
        page: Number(page),
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      }
    };
  }

  /**
   * Listagem paginada e filtrada para vendedor (apenas pedidos que contenham seus produtos).
   * Filtra itens de cada pedido para expor somente os do vendedor e calcula totalVendedor.
   */
  async listSellerOrdersPaginated(sellerId, { page = 1, pageSize = 10, status, from, to, buyerId }) {
    const where = {
      items: { some: { product: { sellerId: String(sellerId) } } }
    };
    if (status) where.status = status;
    if (buyerId) where.buyerId = String(buyerId);
    if (from || to) {
      const createdAt = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) createdAt.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) createdAt.lte = d;
      }
      if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(pageSize) || 10);
    const skip = (pageNum - 1) * take;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { buyer: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      })
    ]);

    const mapped = orders.map((o) => {
      const sellerItems = o.items.filter((it) => it.product?.sellerId === String(sellerId));
      const totalVendedor = sellerItems.reduce((acc, it) => acc + Number(it.price) * it.quantity, 0);
      return { id: o.id, createdAt: o.createdAt, status: o.status, buyer: o.buyer, items: sellerItems, totalVendedor };
    });

    return {
      data: mapped,
      pagination: {
        page: pageNum,
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      }
    };
  }
}

export default new OrderService();