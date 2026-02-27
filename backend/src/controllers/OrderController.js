import orderService from "../services/orderService.js";

/**
 * Listar pedidos que contenham produtos do vendedor logado
 */
export const listarPedidosDoVendedor = async (req, res) => {
  try {
    const vendedorId = req.user?.id;
    if (!vendedorId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    // Usa versão paginada para suportar page/pageSize vindos da query
    const { page, pageSize, status, from, to, buyerId } = req.query || {};

    // Validação simples de status para evitar 500 por valor inválido (enum)
    const allowedStatus = [
      'AGUARDANDO_PAGAMENTO',
      'PAGAMENTO_CONFIRMADO',
      'EM_PREPARACAO',
      'ENVIADO',
      'ENTREGUE',
      'CANCELADO',
      'DEVOLVIDO'
    ];
    if (status && !allowedStatus.includes(String(status))) {
      return res.status(422).json({ message: `Status inválido: ${status}` });
    }
    const result = await orderService.listSellerOrdersPaginated(vendedorId, { page, pageSize, status, from, to, buyerId });
    res.json(result);
  } catch (error) {
    console.error("[listarPedidosDoVendedor] erro:", error);
    res.status(500).json({ message: "Erro ao buscar pedidos do vendedor", details: error?.message });
  }
};

/**
 * Criar um novo pedido a partir do carrinho do usuário
 */
export const criarPedido = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body;
    const order = await orderService.createOrderFromCart(userId, payload);
    res.status(201).json(order);
  } catch (error) {
    // Responder com o status adequado quando for um erro de domínio (AppError)
    const status = error?.statusCode || 500;
    const code = error?.code || "internal_error";
    console.error("[criarPedido] erro:", { status, code, message: error?.message });
    res.status(status).json({ error: "Erro ao criar pedido", details: error?.message, code });
  }
};

/**
 * Listar pedidos do usuário logado
 */
export const listarMeusPedidos = async (req, res) => {
  try {
    const orders = await orderService.listMyOrders(req.user.id);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar seus pedidos", details: error.message });
  }
};

/**
 * Buscar detalhes de um pedido específico (cliente comprador ou admin)
 */
export const obterPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderByIdForUser(id, req.user);
    res.json(order);
  } catch (error) {
    const status = error?.statusCode || 500;
    const code = error?.code || "internal_error";
    console.error("[obterPedidoPorId] erro:", { status, code, message: error?.message });
    res.status(status).json({ error: "Erro ao buscar pedido", details: error?.message, code });
  }
};

/**
 * Listar todos os pedidos (admin)
 */
export const listarTodosPedidos = async (req, res) => {
  try {
    const { page, pageSize, status, from, to, buyerId } = req.query;
    const result = await orderService.listAllOrdersPaginated({ page, pageSize, status, from, to, buyerId });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar todos os pedidos", details: error.message });
  }
};

/**
 * Atualizar status de um pedido (apenas admin)
 */
export const atualizarStatusPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;  // verificar se valor de status é um dos OrderStatus
    const order = await orderService.updateOrderStatus(id, status);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar status do pedido", details: error.message });
  }
};


  // Cancelar pedido (usuário) - vini - inicio
export const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await orderService.cancelOrder(id, req.user);
    res.json({ message: "Pedido cancelado com sucesso", pedido });
  } catch (error) {
    const status = error?.statusCode || 500;
    const code = error?.code || "internal_error";
    console.error("[cancelarPedido] erro:", { status, code, message: error?.message });
    res.status(status).json({ error: "Erro ao cancelar pedido", details: error?.message, code });
  }
};// vini - fim

/**
 * Confirmar pagamento (admin)
 */
export const confirmarPagamento = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.updateOrderStatus(id, 'PAGAMENTO_CONFIRMADO');
    res.json(order);
  } catch (error) {
    const status = error?.statusCode || 500;
    res.status(status).json({ error: 'Erro ao confirmar pagamento', details: error?.message });
  }
};

/**
 * Métricas admin
 */
export const obterMetricasAdmin = async (req, res) => {
  try {
    const metrics = await orderService.getAdminMetrics(req.query || {});
    res.json(metrics);
  } catch (error) {
    const status = error?.statusCode || 500;
    res.status(status).json({ error: 'Erro ao obter métricas', details: error?.message });
  }
};

/**
 * Métricas do vendedor logado
 */
export const obterMetricasVendedor = async (req, res) => {
  try {
    const vendedorId = req.user?.id;
    if (!vendedorId) return res.status(401).json({ message: 'Não autenticado' });
    const metrics = await orderService.getSellerMetrics(vendedorId, req.query || {});
    res.json(metrics);
  } catch (error) {
    const status = error?.statusCode || 500;
    res.status(status).json({ error: 'Erro ao obter métricas do vendedor', details: error?.message });
  }
};

/**
 * Cancelar pedido (vendedor) — Opção A
 * Regras: só cancela se todos os itens do pedido forem do vendedor solicitante
 */
export const cancelarPedidoVendedor = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await orderService.cancelOrderBySeller(id, req.user);
    res.json({ message: 'Pedido cancelado pelo vendedor com sucesso', pedido });
  } catch (error) {
    const status = error?.statusCode || 500;
    const code = error?.code || 'internal_error';
    console.error('[cancelarPedidoVendedor] erro:', { status, code, message: error?.message });
    res.status(status).json({ error: 'Erro ao cancelar pedido', details: error?.message, code });
  }
};
