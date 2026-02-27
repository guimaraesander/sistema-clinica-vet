import api from './api';

export const getOrdersByUser = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

// Cria um novo pedido a partir do carrinho do usuário autenticado
// payload esperado pelo backend (orderService.createOrderFromCart):
// { cep, cidade, enderecoEntrega, complemento?, dataEntregaPrevista?, estado, metodoPagamento }
export const createOrder = async (payload) => {
  const response = await api.post('/orders', payload);
  return response.data;
};

// Cancela um pedido do usuário autenticado (ou admin)
export const cancelOrder = async (id) => {
  const response = await api.patch(`/orders/${id}/cancel`);
  return response.data;
};

// Vendedor: lista pedidos que contenham seus produtos (pode aceitar page, pageSize, status, etc.)
export const getSellerOrders = async (params = {}) => {
  const response = await api.get('/orders/seller-orders', { params });
  return response.data; // pode ser um array (sem paginação) ou { data, pagination }
};

// ADMIN: métricas
export const getAdminMetrics = async (params = {}) => {
  const response = await api.get('/orders/metrics/admin', { params });
  return response.data;
};

// VENDEDOR: métricas do vendedor logado
export const getSellerMetrics = async (params = {}) => {
  const response = await api.get('/orders/metrics/seller', { params });
  return response.data;
};

// ADMIN: confirmar pagamento de um pedido
export const confirmPayment = async (orderId) => {
  const response = await api.post(`/orders/${orderId}/confirm-payment`);
  return response.data;
};

// VENDEDOR: cancelar pedido (somente se todos os itens forem do vendedor)
export const sellerCancelOrder = async (orderId) => {
  try {
    const response = await api.patch(`/orders/${orderId}/seller-cancel`);
    return response.data;
  } catch (err) {
    if (err?.response?.status === 404) {
      // Fallback para servidores que só aceitam POST
      const response = await api.post(`/orders/${orderId}/seller-cancel`);
      return response.data;
    }
    throw err;
  }
};


