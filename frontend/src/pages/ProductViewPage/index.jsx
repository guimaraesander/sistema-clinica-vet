import './ProductViewPage.css';
import { useParams } from "react-router-dom";
import { ButtonPrimary } from '../../components/Buttons/ButtonComponents';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaBoltLightning, FaPix, FaTruck, FaCalendarDays } from 'react-icons/fa6';
import { InputDefault } from '../../components/Input';
import React, { useState, useEffect } from 'react';
import { getProductById } from '../../services/productService';
import StarRating from '../../components/StarRating';

function ProductViewPage() {
  const { id } = useParams();
  const { addToCart } = useCart(); // Mover para o início, antes dos outros hooks
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cep, setCep] = useState('');
  const [shippingMessage, setShippingMessage] = useState("");

  // Buscar produto do backend
  useEffect(() => {
    const fetchProduct = async () => {
      try {
          const data = await getProductById(id);
        
        // Adaptar os dados do backend para o formato esperado pelo frontend
        const adaptedProduct = {
          id: data.id,
          name: data.title,
          description: data.description,
          price: data.price,
          priceDiscount: data.priceDiscount || 0,
          category: data.category?.name || 'Sem categoria',
          brand: data.brand || 'Marca',
          image: data.images?.[0] || '/images/404.png',
          rating: data.rating || 4.0,
          inStock: data.stock > 0,
          tagValue: data.tagValue || (data.stock > 0 ? null : 'Fora de estoque')
        };
        
        setProduct(adaptedProduct);
        setError(null);
      } catch (err) {
        console.error('❌ Erro ao buscar produto:', err);
        setError('Erro ao carregar produto. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Mostrar loading
  if (loading) {
    return <div className="loading">Carregando produto...</div>;
  }

  // Mostrar erro
  if (error) {
    return <div className="error">{error}</div>;
  }

  // Produto não encontrado
  if (!product) {
    return <div className="not-found">Produto não encontrado.</div>;
  }

  const descontoPercentual = product.priceDiscount && product.priceDiscount > 0
    ? `${Math.round(((product.price - product.priceDiscount) / product.price) * 100)}%`
    : "0%";

  const handleAddToCart = () => {
    addToCart({
      ...product,
      price: product.priceDiscount > 0 ? product.priceDiscount : product.price,
      imageUrl: product.image,
      quantity: 1,
    });
  };

  const comprarAgora = () => {
    handleAddToCart(); // Adiciona ao carrinho antes de navegar
    navigate('/shopping-cart');
  }

  const parcela = (product.price / 10).toFixed(2);

  const calculateShipping = async (currentCep) => {
    if (currentCep.replace(/\D/g, '').length === 8) {
        // ... (lógica de cálculo de frete inalterada)
        if (currentCep.startsWith('01000')) {
          setShippingMessage("Entrega em 2 dias - R$ 10,50");
        } else if (currentCep.startsWith('20000')) {
          setShippingMessage("Entrega em 4 dias - R$ 15,75");
        } else {
          setShippingMessage("Entrega em 7 dias - R$ 25,00");
        }
    } else {
        setShippingMessage("CEP inválido. Por favor, insira um CEP válido.");
    }
  };

  const handleCepChange = (event) => {
    const newCep = event.target.value;
    setCep(newCep);
    if (newCep.replace(/\D/g, '').length === 8) {
      calculateShipping(newCep);
    }
  };

  const handleCalculateShippingClick = () => {
    calculateShipping(cep);
  };

  if (!product) {
    return <h2>Produto não encontrado.</h2>;
  }

  return (
    <div className="principal">
      <div className="titulo">
        <p className='textotitulo'>
          {product.category}
          <span className='pasta'>{'>'}</span>
          {product.brand}
        </p>
      </div>

      <div className='conteudo'>
        <div className='esquerda'>
          <img src={product.image} alt={product.name} className='imagem-produto' />
        </div>

        {/* --- SEÇÃO DE DADOS DO PRODUTO REFEITA --- */}
        <div className='product-info-container'>
            {/* Cabeçalho com título e meta dados */}
            <div className='product-header'>
                <h1 className='product-title'>{product.description}</h1>
                <div className='product-meta'>
                    <StarRating rating={product.rating || 0} />
                    <span><FaBoltLightning />Pronta entrega</span>
                    <span><FaCalendarDays />12 meses de garantia</span>
                </div>
            </div>

            {/* Seção de Preços */}
            <div className='price-section'>
                <div className='price-values'>
                    <span className='old-price'>R$ {product.price.toFixed(2)}</span>
                    <span className='current-price'>R$ {product.priceDiscount}</span>
                </div>
                <div className='discount-badge'>{descontoPercentual} OFF</div>
            </div>

            {/* Opções de Pagamento */}
            <div className='payment-options'>
                <div className='payment-option'>
                    <FaPix className='pix-icon' />
                    <span>À vista no PIX com <strong>{descontoPercentual} de desconto</strong></span>
                </div>
                <div className='payment-option'>
                    <FaCreditCard className='card-icon' />
                    <span>Em até <strong>10x de R$ {parcela}</strong> sem juros</span>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className='action-buttons'>
                <ButtonPrimary className='comprar-agora' onClick={comprarAgora}>
                    COMPRAR AGORA
                </ButtonPrimary>
                <ButtonPrimary className='add-carrinho' onClick={handleAddToCart}>
                    ADICIONAR AO CARRINHO
                </ButtonPrimary>
            </div>

            {/* Calculadora de Frete */}
            <div className='shipping-calculator'>
                <h4><FaTruck /> Consulte o frete e prazo de entrega</h4>
                <div className="shipping-input-group">
                    <InputDefault 
                        placeholder="Insira seu CEP"
                        value={cep}
                        onChange={handleCepChange}
                        maxLength={9}
                    />
                    <ButtonPrimary className='botao-ok' onClick={handleCalculateShippingClick}>
                        OK
                    </ButtonPrimary>
                </div>
                {shippingMessage && <p className='shipping-result'>{shippingMessage}</p>}
            </div>
        </div>
      </div>
    </div>
  );
}

export default ProductViewPage;
