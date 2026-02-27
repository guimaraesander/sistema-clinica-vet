import api from './api';

// Faz upload de imagem de produto
// Retorna { path, filename }
export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post('/upload/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
