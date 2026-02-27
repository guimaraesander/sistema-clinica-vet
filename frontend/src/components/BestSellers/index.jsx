import React, { useEffect, useState } from 'react';
import BestSellerCard from './BestSellerCard';
import './BestSellers.css';
import { getProducts } from '../../services/productService';

const BestSellers = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        // Critério: rating >= 4.5 ou tem desconto
  const featuredIds = window.__featuredProductIds || [];
  const best = data.filter(p => ((p.rating && p.rating >= 4.5) || (p.priceDiscount && p.priceDiscount < p.price)) && !featuredIds.includes(p.id));
  setProducts(best.length > 0 ? best.slice(0, 3) : data.filter(p => !featuredIds.includes(p.id)).slice(0, 3));
      } catch (err) {
        setError('Erro ao buscar campeões de vendas.');
      } finally {
        setLoading(false);
      }
    };
    fetchBestSellers();
  }, []);

  if (loading) {
    return <div className="best-sellers-container"><p>Carregando...</p></div>;
  }
  if (error) {
    return <div className="best-sellers-container"><p>{error}</p></div>;
  }
  if (!products || products.length === 0) {
    return <div className="best-sellers-container"><p>Nenhum campeão de vendas encontrado.</p></div>;
  }

  return (
    <div className="best-sellers-container">
      <div className="best-sellers-grid">
        {products.map((product, index) => (
          <BestSellerCard 
            key={product.id} 
            product={product} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default BestSellers;
