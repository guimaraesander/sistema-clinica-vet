import { useEffect, useState, useCallback, useMemo } from 'react';
import { getProducts } from '../../services/productService';
import { CiFilter } from 'react-icons/ci';
import ProductListing from '../../components/ProductListing';
import CustomSelect from '../../components/CustomSelect';
import './ProductListingPage.css';
import Section from '../../components/Section';
import { useLocation } from 'react-router-dom';

const ProductListingPage = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({ categoriaMarca: {}, emEstoque: false });
  const [categoriasExpandida, setCategoriasExpandida] = useState({});
  const [sortBy, setSortBy] = useState('mais-relevantes');
  const PAGE_SIZE = 9;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sortParam = params.get('sort');
    if (sortParam === 'price_asc') setSortBy('menor-preco');
    else if (sortParam === 'price_desc') setSortBy('maior-preco');
    else if (sortParam === 'best_sellers') setSortBy('mais-vendidos');
  }, [location.search]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 460);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sortOptions = [
    { value: 'mais-relevantes', label: 'mais relevantes' },
    { value: 'menor-preco', label: 'menor preço' },
    { value: 'maior-preco', label: 'maior preço' },
    { value: 'mais-vendidos', label: 'mais vendidos' }
  ];

    const fetchProducts = useCallback(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(location.search);
        const q = params.get('q') || undefined;
        const data = await getProducts(q ? { q } : undefined);
        const adaptedProducts = data.map(product => ({
          id: product.id,
          name: product.title,
          description: product.description,
          price: product.price,
          priceDiscount: product.priceDiscount || 0,
          // MUDANÇA: Padroniza a categoria para maiúsculas logo na adaptação dos dados
          category: product.category?.name?.toUpperCase() || 'SEM CATEGORIA',
          brand: product.brand || 'Marca',
          image: product.images?.[0] || '/images/404.png',
          rating: product.rating || 4.0,
          inStock: product.stock > 0,
          tagValue: product.tagValue || (product.stock > 0 ? null : 'Fora de estoque'),
          sales: product.sales || 0 // Garante que a propriedade sales exista para a ordenação
        }));
        setProducts(adaptedProducts);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar produtos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 460;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCategoriaExpandida = categoria => setCategoriasExpandida(prev => ({ ...prev, [categoria]: !prev[categoria] }));

  // MUDANÇA: A lista de categorias desejadas já está em maiúsculas, o que é bom.
  const categoriasDesejadas = [
    'SMARTPHONE', 'NOTEBOOK', 'HEADPHONE', 'TABLET', 'SMART-TV', 'ACESSÓRIOS', 'CONSOLES', 'PROCESSADOR', 'PLACA DE VÍDEO', 'PLACA-MÃE', 'MEMÓRIA RAM', 'ARMAZENAMENTO', 'FONTE DE ENERGIA', 'RESFRIAMENTO', 'GABINETE', 'PC PORTÁTIL', 'MINI-PC', 'CONSOLE PORTÁTIL'
  ];

  // MUDANÇA: Não precisamos mais da lista de marcas, vamos gerá-la dinamicamente dos produtos.
  // Isso torna o código mais robusto, pois novas marcas no DB aparecerão automaticamente.

  // MUDANÇA: A lógica de filtragem e ordenação foi ajustada para ser case-insensitive.
  const applyFiltersAndSort = () => {
    let result = [...products];

    // Filtra pelas categorias desejadas
    result = result.filter(prod => categoriasDesejadas.includes(prod.category));

    const filtroCategoriaMarca = Object.entries(selectedFilters.categoriaMarca)
      .filter(([, marcas]) => marcas.length > 0);

    if (filtroCategoriaMarca.length > 0) {
      result = result.filter(prod =>
        filtroCategoriaMarca.some(([categoria, marcas]) =>
          // Compara a categoria do produto (já em maiúsculas) com a categoria do filtro
          prod.category === categoria && marcas.includes(prod.brand)
        )
      );
    }

    if (selectedFilters.emEstoque) {
      result = result.filter(prod => prod.inStock);
    }

    switch (sortBy) {
      case 'menor-preco': result.sort((a, b) => a.price - b.price); break;
      case 'maior-preco': result.sort((a, b) => b.price - a.price); break;
      case 'mais-vendidos': result.sort((a, b) => b.sales - a.sales); break;
    }

    return result;
  };

  const filteredProducts = applyFiltersAndSort();
  const selectedFiltersKey = useMemo(() => JSON.stringify(selectedFilters), [selectedFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFiltersKey, sortBy]);
  
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageItems = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // MUDANÇA: A lógica para gerar os filtros foi refeita para ser case-insensitive e mais eficiente.
  const filtrosPorCategoria = useMemo(() => {
    // Primeiro, filtramos os produtos que pertencem às categorias desejadas.
    const produtosRelevantes = products.filter(p => categoriasDesejadas.includes(p.category));

    return categoriasDesejadas.reduce((acc, categoria) => {
        // Para cada categoria, pegamos os produtos correspondentes.
        const produtosDaCategoria = produtosRelevantes.filter(p => p.category === categoria);
        
        // Se não houver produtos para esta categoria, pulamos.
        if (produtosDaCategoria.length === 0) return acc;
        
        // Criamos um mapa para contar as marcas e evitar duplicatas.
        const marcasMap = new Map();
        produtosDaCategoria.forEach(p => {
            // Se a marca ainda não foi contada, inicializa com 0.
            if (!marcasMap.has(p.brand)) {
                marcasMap.set(p.brand, 0);
            }
            // Se o filtro "Em Estoque" está ativo, só contamos produtos em estoque.
            // Se não, contamos todos.
            if (!selectedFilters.emEstoque || p.inStock) {
                marcasMap.set(p.brand, marcasMap.get(p.brand) + 1);
            }
        });

        // Convertemos o mapa para o formato { nome, quantidade } e removemos marcas com contagem 0.
        const marcasComQuantidade = Array.from(marcasMap.entries())
            .map(([nome, quantidade]) => ({ nome, quantidade }))
            .filter(marca => marca.quantidade > 0)
            .sort((a, b) => a.nome.localeCompare(b.nome)); // Opcional: ordenar marcas alfabeticamente
            
        if (marcasComQuantidade.length > 0) {
            acc[categoria] = marcasComQuantidade;
        }

        return acc;
    }, {});
  }, [products, selectedFilters.emEstoque]); // Recalcula apenas quando os produtos ou o filtro de estoque mudam.

  return (
    <div>
      {isMobile && isSidebarOpen && <div className='sidebar-overlay' onClick={toggleSidebar}></div>}
      <div className='listing-header'>
        <div className='results-info'>
          {(() => {
            const params = new URLSearchParams(location.search);
            const q = params.get('q');
            return <h2>{q ? `Resultados para "${q}"` : 'Todos os produtos'} - {filteredProducts.length} produtos</h2>;
          })()}
        </div>
        <div className='sort-container'>
          <CustomSelect value={sortBy} onChange={setSortBy} options={sortOptions} />
        </div>
        {isMobile && <div className='filter-icon-wrapper' onClick={toggleSidebar}><CiFilter size={24} color='white' /></div>}
      </div>
      <Section>
        <div className='content-container'>
          <aside className={`filters-sidebar ${isMobile && isSidebarOpen ? 'open' : ''} ${!isMobile ? 'desktop-visible' : ''}`}>
            <h3>Filtrar Categoria/ Marca</h3>
            <div className='filter-group'>
              <div className='filter-options'>
                {/* O restante do JSX continua o mesmo, pois a lógica de renderização já estava correta */}
                {Object.entries(filtrosPorCategoria).map(([categoria, marcas]) => (
                  <div key={categoria} className='categoria-filtro'>
                    <h5 onClick={() => toggleCategoriaExpandida(categoria)} style={{ cursor: 'pointer', marginTop: '10px' }}>
                      {categoria} {categoriasExpandida[categoria] ? '▲' : '▼'}
                    </h5>
                    {categoriasExpandida[categoria] && (
                      <div className="marcas-scroll">
                        {marcas.map(({ nome: marca, quantidade }) => {
                          const checked = selectedFilters.categoriaMarca[categoria]?.includes(marca) || false;
                          return (
                            <label key={marca} className='filter-option'>
                              <input
                                type='checkbox'
                                checked={checked}
                                onChange={e => {
                                  const isChecked = e.target.checked;
                                  setSelectedFilters(prev => {
                                    const atual = { ...prev.categoriaMarca };
                                    const listaAtual = atual[categoria] || [];
                                    const novaCategoriaMarca = {
                                      ...atual,
                                      [categoria]: isChecked
                                        ? [...listaAtual, marca]
                                        : listaAtual.filter(m => m !== marca)
                                    };
                                    if (novaCategoriaMarca[categoria].length === 0) delete novaCategoriaMarca[categoria];
                                    return { ...prev, categoriaMarca: novaCategoriaMarca };
                                  });
                                }}
                              />
                              <span>{marca} ({quantidade})</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className='filter-group'>
              <h4>Em Estoque</h4>
              <div className='filter-options'>
                <label className='filter-option'>
                  <input
                    type='checkbox'
                    checked={selectedFilters.emEstoque}
                    onChange={e => setSelectedFilters(prev => ({ ...prev, emEstoque: e.target.checked }))}
                  />
                  <span>Disponível</span>
                </label>
              </div>
            </div>
          </aside>
          <main className='products-grid'>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><p>Carregando produtos...</p></div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                <p>{error}</p>
                <button onClick={fetchProducts}>Tentar novamente</button>
              </div>
            ) : (
              <>
                <ProductListing isPageProducts products={pageItems} />
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => setCurrentPage(page)} disabled={currentPage === page} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: currentPage === page ? '#333' : '#fff', color: currentPage === page ? '#fff' : '#333', cursor: currentPage === page ? 'default' : 'pointer' }} aria-current={currentPage === page ? 'page' : undefined}>
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </Section>
    </div>
  );
};
export default ProductListingPage;