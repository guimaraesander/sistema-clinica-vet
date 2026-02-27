import { priceUtils } from '../utils/priceUtils';
import productsData from './products.json';

// Configurações para produtos campeões de vendas
export const bestSellersConfig = {
  // Quantidade máxima de produtos a exibir
  maxProducts: 3,
  
  // Categorias priorizadas para campeões de vendas (ordem de prioridade)
  priorityCategories: [
    'smartphone',
    'notebook', 
    'headphone',
    'processor',
    'tablet',
    'smart-tv',
    'graphics-card'
  ],
  
  // Critério de filtro para produtos em destaque
  filterCriteria: (product) => {
    // Validação de segurança
    if (!product || !priceUtils.isValidPrice(product.price)) {
      return false;
    }
    
    // Produtos em estoque
    if (!product.inStock) {
      return false;
    }
    
    // Produtos com rating mínimo ou com desconto
    const hasGoodRating = product.rating && product.rating >= 4.0;
    const hasDiscount = product.priceDiscount && product.priceDiscount < product.price;
    
    return hasGoodRating || hasDiscount;
  },
  
  // Configurações de exibição
  displayConfig: {
    showDiscount: true,
    showRating: true,
    showStock: false,
    highlightBestSeller: true
  },

  // Função para obter produtos campeões de vendas
  get products() {
    // Filtra produtos válidos
    const validProducts = productsData.filter(this.filterCriteria);
    
    // Agrupa por categoria prioritária
    const categorizedProducts = {};
    this.priorityCategories.forEach(category => {
      categorizedProducts[category] = validProducts.filter(p => p.category === category);
    });
    
    // Seleciona os melhores produtos de cada categoria
    const selectedProducts = [];
    
    for (const category of this.priorityCategories) {
      const categoryProducts = categorizedProducts[category];
      if (categoryProducts && categoryProducts.length > 0) {
        // Ordena por rating e desconto
        const sortedProducts = categoryProducts.sort((a, b) => {
          const aScore = (a.rating || 0) + (a.priceDiscount ? 0.5 : 0);
          const bScore = (b.rating || 0) + (b.priceDiscount ? 0.5 : 0);
          return bScore - aScore;
        });
        
        selectedProducts.push(sortedProducts[0]);
        
        if (selectedProducts.length >= this.maxProducts) {
          break;
        }
      }
    }
    
    // Se não tiver produtos suficientes, adiciona outros produtos de alta qualidade
    if (selectedProducts.length < this.maxProducts) {
      const remainingProducts = validProducts
        .filter(p => !selectedProducts.find(sp => sp.id === p.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      selectedProducts.push(...remainingProducts.slice(0, this.maxProducts - selectedProducts.length));
    }
    
    return selectedProducts.slice(0, this.maxProducts);
  }
};
