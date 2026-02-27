import api from './api';

export const getProducts = async (params = {}) => {
  const response = await api.get('/products', { params: params || {} });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Cria um novo produto (vendedor/admin autenticado)
// payload: { title, description, price, stock, images: string[], categoryId }
export const createProduct = async (payload) => {
  const response = await api.post('/products', payload);
  return response.data;
};


