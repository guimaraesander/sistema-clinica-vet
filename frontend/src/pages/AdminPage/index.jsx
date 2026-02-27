import React, { useState, useEffect } from 'react';
import { 
  getPendingSellers,
  getAdminCustomers,
  getAdminProducts,
  getAdminOrders,
  getAdminSellers,
} from '../../services/adminService';
import { getAdminMetrics, confirmPayment, cancelOrder } from '../../services/orderService';
import StatusTag from '../../components/StatusTag';
import styles from './AdminPage.module.css';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';

const AdminPage = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [pendingSellers, setPendingSellers] = useState([]);
  const [customers, setCustomers] = useState({ total: 0, items: [] });
  const [products, setProducts] = useState({ total: 0, items: [] });
  const [orders, setOrders] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sellers, setSellers] = useState([]);
  const [filters, setFilters] = useState({ buyerId: '', sellerId: '', stockStatus: 'all' });
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchPendingSellersData = async () => {
      try {
        const [pendings, customersData, productsData, ordersData, sellersData, metricsData] = await Promise.all([
          getPendingSellers(),
          getAdminCustomers({ page: 1, pageSize: 10 }),
          getAdminProducts({ page: 1, pageSize: 10 }),
          getAdminOrders({ page: 1, pageSize: 10 }),
          getAdminSellers({ status: 'active' }),
          getAdminMetrics(),
        ]);
        setPendingSellers(pendings);
        setCustomers(customersData);
        setProducts(productsData);
        setOrders(ordersData);
        setSellers(sellersData);
        setMetrics(metricsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingSellersData();
  }, []);

  const applyOrderFilters = async () => {
    setLoading(true);
    try {
      const ordersData = await getAdminOrders({ page: 1, pageSize: 10, buyerId: filters.buyerId || undefined });
      setOrders(ordersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reloadOrders = async () => {
    try {
      const ordersData = await getAdminOrders({ page: 1, pageSize: 10, buyerId: filters.buyerId || undefined });
      setOrders(ordersData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await confirmPayment(orderId);
      await reloadOrders();
    } catch (err) {
      alert(err?.response?.data?.message || 'Falha ao confirmar pagamento');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await cancelOrder(orderId);
      await reloadOrders();
    } catch (err) {
      alert(err?.response?.data?.message || 'Falha ao cancelar pedido');
    }
  };

  const applyProductFilters = async () => {
    setLoading(true);
    try {
      const productsData = await getAdminProducts({ page: 1, pageSize: 10, sellerId: filters.sellerId || undefined, stockStatus: filters.stockStatus });
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (sellerId) => {
    navigate(`/admin/seller/${sellerId}`);
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.title}>Painel do Administrador</h1>

      {/* Abas simples */}
      <div className={styles.tabs}>
        <button className={activeTab === 'overview' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('overview')}>Visão Geral</button>
        <button className={activeTab === 'customers' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('customers')}>Clientes</button>
        <button className={activeTab === 'products' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('products')}>Produtos</button>
        <button className={activeTab === 'orders' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('orders')}>Vendas</button>
      </div>

      {activeTab === 'overview' && (
        <>
              {metrics && (
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Pedidos</div>
                <div className={styles.metricValue}>{metrics.totalPedidos ?? 0}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Itens vendidos</div>
                <div className={styles.metricValue}>{metrics.totalItens ?? 0}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Faturamento</div>
                <div className={styles.metricValue}>R$ {(metrics.faturamentoTotal ?? 0).toFixed(2)}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Status</div>
                    <div className={styles.metricValueSmall}>
                      {Object.entries(metrics.statusBreakdown || {}).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <StatusTag status={k} />
                          <span>× {v}</span>
                        </div>
                      ))}
                    </div>
              </div>
            </div>
          )}
          <h2 className={styles.subtitle}>Vendedores com Cadastro Pendente</h2>
          <div className={styles.pendingList}>
            {pendingSellers.length === 0 ? (
              <div className={styles.emptyState}>
                Não há vendedores pendentes de aprovação.
              </div>
            ) : (
              pendingSellers.map(seller => (
                <div key={seller.id} className={styles.sellerCard}>
                  <div className={styles.sellerInfo}>
                    <span className={styles.sellerName}>{seller.name}</span>
                    <span className={styles.sellerDate}>
                      Data do cadastro: {new Date(seller.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.sellerActions}>
                    <button 
                      className={styles.detailsButton} 
                      onClick={() => handleViewDetails(seller.id)}
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'customers' && (
        <>
          <h2 className={styles.subtitle}>Clientes</h2>
          <div className={styles.pendingList}>
            {customers.items.length === 0 ? (
              <div className={styles.emptyState}>Nenhum cliente encontrado.</div>
            ) : (
              customers.items.map((c) => (
                <div key={c.id} className={styles.sellerCard}>
                  <div className={styles.sellerInfo}>
                    <span className={styles.sellerName}>{c.name} — {c.email}</span>
                    <span className={styles.sellerDate}>
                      Pedidos: {c.ordersCount} • Total gasto: R$ {c.totalSpent?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <>
          <h2 className={styles.subtitle}>Produtos</h2>
          <div className={styles.filtersRow}>
            <select value={filters.sellerId} onChange={(e) => setFilters(f => ({ ...f, sellerId: e.target.value }))}>
              <option value="">Todos os vendedores</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select value={filters.stockStatus} onChange={(e) => setFilters(f => ({ ...f, stockStatus: e.target.value }))}>
              <option value="all">Estoque - Todos</option>
              <option value="out">Sem estoque</option>
              <option value="low">Estoque baixo (até 5)</option>
              <option value="in">Com estoque</option>
            </select>
            <button className={styles.detailsButton} onClick={applyProductFilters}>Aplicar</button>
          </div>
          <div className={styles.pendingList}>
            {products.items.length === 0 ? (
              <div className={styles.emptyState}>Nenhum produto encontrado.</div>
            ) : (
              products.items.map((p) => (
                <div key={p.id} className={styles.sellerCard}>
                  <div className={styles.sellerInfo}>
                    <span className={styles.sellerName}>{p.title}</span>
                    <span className={styles.sellerDate}>
                      Preço: R$ {p.price?.toFixed(2)} • Estoque: {p.stock} • Vendedor: {p.seller?.name}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <>
          <h2 className={styles.subtitle}>Vendas</h2>
          <div className={styles.filtersRow}>
            <select value={filters.buyerId} onChange={(e) => setFilters(f => ({ ...f, buyerId: e.target.value }))}>
              <option value="">Todos os clientes</option>
              {customers.items.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
              ))}
            </select>
            <button className={styles.detailsButton} onClick={applyOrderFilters}>Aplicar</button>
          </div>
          <div className={styles.pendingList}>
            {orders.items.length === 0 ? (
              <div className={styles.emptyState}>Nenhuma venda encontrada.</div>
            ) : (
              orders.items.map((o) => (
                <div key={o.id} className={styles.sellerCard}>
                  <div className={styles.sellerInfo}>
                    <span className={styles.sellerName}>Pedido #{o.id.slice(0,8)} — R$ {o.total?.toFixed(2)}</span>
                    <span className={styles.sellerDate}>
                      {new Date(o.createdAt).toLocaleString()} • Itens: {o.itemsCount} • Cliente: {o.buyer?.name} • Status: <StatusTag status={o.status} />
                    </span>
                  </div>
                  <div className={styles.actionsRow}>
                    <button
                      className={styles.successButton}
                      disabled={o.status !== 'AGUARDANDO_PAGAMENTO'}
                      onClick={() => handleConfirmPayment(o.id)}
                      title={o.status !== 'AGUARDANDO_PAGAMENTO' ? 'Ação disponível apenas para pedidos aguardando pagamento' : ''}
                    >
                      Confirmar pagamento
                    </button>
                    <button
                      className={styles.dangerButton}
                      disabled={o.status === 'CANCELADO' || o.status === 'ENTREGUE'}
                      onClick={() => handleCancelOrder(o.id)}
                      title={(o.status === 'CANCELADO' || o.status === 'ENTREGUE') ? 'Ação indisponível para este status' : ''}
                    >
                      Cancelar pedido
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;