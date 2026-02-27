import './FeaturedProducts.css';
import { ButtonSecundary } from '../Buttons/ButtonComponents';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts } from '../../services/productService';

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        // Filtra produtos em destaque (exemplo: por campo destacado, categoria, etc)
  const destacados = data.filter(p => p.featured || p.isFeatured || p.category === 'Destaque');
  setProducts(destacados.length > 0 ? destacados : data.slice(0, 3)); // fallback: 3 primeiros
  window.__featuredProductIds = (destacados.length > 0 ? destacados : data.slice(0, 3)).map(p => p.id);
      } catch (err) {
        setError('Erro ao buscar produtos em destaque.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleViewProduct = (product) => {
    if (product.id) {
      navigate(`/produtos/${product.id}`);
    } else {
      navigate('/404');
    }
  };

  if (loading) {
    return <section className='featured-products'><p>Carregando...</p></section>;
  }
  if (error) {
    return <section className='featured-products'><p>{error}</p></section>;
  }
  if (!products || products.length === 0) {
    return <section className='featured-products'><p>Nenhum produto em destaque.</p></section>;
  }

  return (
    <section className='featured-products'>
      {products.map((product, index) => (
        <div className='featured-card' key={index}>
          <div className='featured-card-info'>
            <div className='featured-card-tag'>
              {product.discount && (
                <>
                  <span>{product.discount}%</span>
                  <span>OFF</span>
                </>
              )}
              {!product.discount && <span>{product.tag || (typeof product.category === 'object' ? product.category?.name : product.category)}</span>}
            </div>

            <h3>{product.title || product.name}</h3>
            <ButtonSecundary onClick={() => handleViewProduct(product)}>
              {product.buttonText || 'Ver mais'}
            </ButtonSecundary>
          </div>

          <div className='featured-card-image'>
            <img src={product.image || (product.images?.[0] ?? '/images/404.png')} alt={product.title || product.name} />
          </div>
        </div>
      ))}
    </section>
  );
};

export default FeaturedProducts;
