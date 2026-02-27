import ProductCard from '../ProductCard';
import './ProductListing.css';

const ProductListing = ({ products, isPageProducts, $isPageProducts }) => {
  const pageFlag = typeof isPageProducts !== 'undefined' ? isPageProducts : $isPageProducts;
  return (
    <div className={`product-listing-container ${pageFlag ? 'is-page-products' : ''}`}>
      <div className='content-limit'>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductListing;
