import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './PedidosClientePage.module.css';
import StatusTag from '../../components/StatusTag';
import { getOrdersByUser } from '../../services/orderService';

// Usa o componente StatusTag compartilhado

// Componente reutilizável: pode ser página completa ou embed (resumo)
const PedidosClientePage = ({ embed = false, limit = 5 }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrdersByUser(); // Array de pedidos do usuário
        // Ordenar por data desc
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(embed ? sorted.slice(0, limit) : sorted);
      } catch (err) {
        const msg = err?.response?.data?.details || err?.message || 'Erro ao carregar pedidos.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [embed, limit]);

  const formatCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

  return (
    <div className={styles.ordersContainer}>
      {!embed && <h1 className={styles.title}>Meus Pedidos</h1>}

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : orders.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div className={styles.ordersList}>
          <div className={styles.orderHeader}>
            <span>Nº Pedido</span>
            <span>Data</span>
            <span>Total</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderItem}>
              <span className={styles.orderId}>#{order.id}</span>
              <span className={styles.orderDate}>{fmtDate(order.createdAt)}</span>
              <span className={styles.orderTotal}>{formatCurrency(order.total)}</span>
              <StatusTag status={order.status} />
              <Link to={`/orders/${order.id}`} className={styles.detailsLink}>Ver detalhes</Link>
            </div>
          ))}
        </div>
      )}

      {!embed && (
        <Link to="/cliente/dashboard" className={styles.backLink}>&larr; Voltar para o painel</Link>
      )}
    </div>
  );
};

export default PedidosClientePage;
