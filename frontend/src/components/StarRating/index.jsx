import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import "./StarRating.css"; // Importa o CSS externo

function StarRating({ rating }) {
  const numericRating = Math.min(Math.max(Number(rating) || 0, 0), 5);
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="star-rating-container">
      <div className="star-icons">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={"full" + i} />
        ))}
        {hasHalfStar && <FaStarHalfAlt key="half" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={"empty" + i} />
        ))}
      </div>
      <span className="star-rating-score">{numericRating.toFixed(1)}</span>
    </div>
  );
}

export default StarRating;