import api from './api';

export const getCategories = async () => {
  const res = await api.get('/categories');
  return res.data;
};

export const getCategoryById = async (id) => {
  const res = await api.get(`/categories/${id}`);
  return res.data;
};

export const createCategory = async (name) => {
  const res = await api.post('/categories', { name });
  return res.data;
};
