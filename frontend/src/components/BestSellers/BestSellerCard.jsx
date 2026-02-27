import './BestSellerCard.css';
import { priceUtils } from '../../utils/priceUtils';
import { useNavigate } from 'react-router-dom';

const BestSellerCard = ({ product, index }) => {
  const navigate = useNavigate();
  
  const {
    id,
    title,
    image,
    price,
    priceDiscount,
    rating,
    brand
  } = product;
  const displayName = title && title.trim() ? title : 'Produto sem nome';

  // Formatação de preços
  const originalPrice = priceUtils.formatPrice(price);
  const discountPrice = priceDiscount ? priceUtils.formatPrice(priceDiscount) : null;
  const discountPercentage = priceDiscount 
    ? Math.round(((price - priceDiscount) / price) * 100)
    : 0;

  // Badge de posição para os 3 primeiros
  const getBadgePosition = () => {
    if (index === 0) return { text: '1º', class: 'gold' };
    if (index === 1) return { text: '2º', class: 'silver' };
    if (index === 2) return { text: '3º', class: 'bronze' };
    return null;
  };

  const badge = getBadgePosition();

  const handleCardClick = () => {
    // Navegar para página do produto específico usando React Router
    navigate(`/produtos/${id}`);
  };

  return (
    <div className="best-seller-card" onClick={handleCardClick}>
      {/* Badge de posição */}
      {badge && (
        <div className={`position-badge ${badge.class}`}>
          <span>{badge.text}</span>
        </div>
      )}

      {/* Badge de desconto em vermelho */}
      {discountPercentage > 0 && (
        <div className="discount-badge">
          <span>{discountPercentage}% OFF</span>
        </div>
      )}

      {/* Imagem do produto */}
      <div className="best-seller-image">
        <img 
          src={image || (product.images?.[0] ?? '/images/404.png')} 
          alt={displayName}
          onError={(e) => {
            e.target.src = '/images/placeholder-product.png';
          }}
        />
      </div>

      {/* Informações do produto */}
      <div className="best-seller-info">
        <div className="product-brand">
          <span>{brand}</span>
        </div>
        <h3 className="product-name">{displayName}</h3>
        {/* Rating */}
        {rating && (
          <div className="product-rating">
            <div className="stars">
              {Array.from({ length: 5 }, (_, i) => (
                <span 
                  key={i} 
                  className={`star ${i < Math.floor(rating) ? 'filled' : ''}`}
                >
                  ⭐
                </span>
              ))}
            </div>
            <span className="rating-value">({rating})</span>
          </div>
        )}

        {/* Preços */}
        <div className="product-prices">
          {discountPrice ? (
            <>
              <span className="original-price">{originalPrice}</span>
              <span className="discount-price">{discountPrice}</span>
            </>
          ) : (
            <span className="current-price">{originalPrice}</span>
          )}
        </div>
        {/* Botão de ação */}
        <button 
          className="best-seller-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          Ver Produto
        </button>
      </div>
    </div>
  );
};

export default BestSellerCard;
