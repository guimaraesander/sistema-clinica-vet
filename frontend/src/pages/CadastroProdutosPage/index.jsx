/*Página de cadastro dos produtos*/
import React, { useEffect, useState } from 'react';
import styles from './CadastroProdutosPage.module.css';
import { useNavigate } from 'react-router-dom';
import { uploadProductImage } from '../../services/uploadService';
import { createProduct } from '../../services/productService';
import { getCategories, createCategory } from '../../services/categoryService';
import { useAuth } from '../../contexts/AuthContext';

const CadastroProdutosPage = () => {
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: '', 
  });
  const [productImage, setProductImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const list = await getCategories();
        setCategories(list || []);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProductImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productData.title || !productData.price || !productImage) {
      setError('Por favor, preencha título, preço e selecione uma imagem.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1) Upload da imagem
      const up = await uploadProductImage(productImage);
      const imagePath = up?.path ? up.path : up?.filename ? `/uploads/products/${up.filename}` : '';

      // 2) Monta payload para API de produto
      const payload = {
        title: productData.title,
        description: productData.description || '',
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock || '0', 10),
        images: imagePath ? [imagePath] : [],
        categoryId: productData.category ? String(productData.category) : undefined,
      };

      const created = await createProduct(payload);
      alert('Produto cadastrado com sucesso!');
      navigate('/vendedor/dashboard', { state: { sellerTab: 'produtos', flash: 'Produto cadastrado com sucesso!' } });
    } catch (err) {
      console.error('Erro ao cadastrar produto:', err?.response?.data || err);
      const msg = err?.response?.data?.error || err?.message || 'Falha ao cadastrar produto';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <h1 className={styles.title}>Cadastrar Novo Produto</h1>
      <form className={styles.uploadForm} onSubmit={handleSubmit}>
        
        <div className={styles.formGroup}>
          <label htmlFor="title">Título do Produto *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={productData.title}
            onChange={handleChange}
            placeholder="Ex: Monitor Gamer UltraWide 29''"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Descrição *</label>
          <textarea
            id="description"
            name="description"
            value={productData.description}
            onChange={handleChange}
            rows="6"
            placeholder="Descreva os detalhes e especificações do produto"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="price">Preço (R$) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={productData.price}
              onChange={handleChange}
              placeholder="Ex: 1299.99"
              step="0.01"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="stock">Quantidade em Estoque *</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={productData.stock}
              onChange={handleChange}
              placeholder="Ex: 50"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category">Categoria *</label>
          {categories.length > 0 ? (
            <select
              id="category"
              name="category"
              value={productData.category}
              onChange={handleChange}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div>
              <p style={{ marginBottom: 8 }}>Nenhuma categoria encontrada.</p>
              {isAdmin ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Nova categoria"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={creatingCategory || !newCategoryName.trim()}
                    onClick={async () => {
                      try {
                        setCreatingCategory(true);
                        const created = await createCategory(newCategoryName.trim());
                        setCategories((prev) => [...prev, created]);
                        setProductData((prev) => ({ ...prev, category: created.id }));
                        setNewCategoryName('');
                      } catch (err) {
                        alert('Erro ao criar categoria. Verifique suas permissões.');
                      } finally {
                        setCreatingCategory(false);
                      }
                    }}
                  >
                    {creatingCategory ? 'Criando...' : 'Criar Categoria'}
                  </button>
                </div>
              ) : (
                <p>Peça a um administrador para cadastrar categorias.</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="image">Foto do Produto *</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
          />
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}

        {/* --- ÁREA DOS BOTÕES ATUALIZADA --- */}
        <div className={styles.actions}>
            <button 
                type="button" 
                className={styles.backButton} 
                onClick={() => navigate('/vendedor/dashboard')}
            >
                Voltar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CadastroProdutosPage;

