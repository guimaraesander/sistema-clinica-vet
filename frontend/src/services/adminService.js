import api from './api';

export const getPendingSellers = async () => {
  const response = await api.get('/admin/pending-sellers');
  return response.data;
};

export const getSellerDetails = async (sellerId) => {
  const response = await api.get(`/admin/sellers/${sellerId}`);
  return response.data;
};

export const updateSellerStatus = async (sellerId, status) => {
  const response = await api.put(`/admin/sellers/${sellerId}/status`, { status });
  return response.data;
};

export const getAdminCustomers = async (params = {}) => {
  const response = await api.get('/admin/customers', { params });
  return response.data; // { total, items: [{ id, name, email, createdAt, ordersCount, totalSpent }] }
};

export const getAdminCustomerDetails = async (customerId) => {
  const response = await api.get(`/admin/customers/${customerId}`);
  return response.data; // { user, stats, orders }
};

export const getAdminProducts = async (params = {}) => {
  const response = await api.get('/admin/products', { params });
  return response.data; // { total, items: [...] }
};

export const getAdminOrders = async (params = {}) => {
  const response = await api.get('/admin/orders', { params });
  return response.data; // { total, items: [...] }
};

export const getAdminSellers = async (params = {}) => {
  const response = await api.get('/admin/sellers', { params });
  return response.data; // [ { id, name, email, cnpj, status } ]
};
