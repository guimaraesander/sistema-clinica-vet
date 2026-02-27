import api from './api';

export const getSellerProducts = async (sellerId) => {
  const response = await api.get(`/products/seller/${sellerId}`);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};


