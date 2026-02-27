import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './DetalhesPedidoClientePage.module.css'; 
import { FaBox, FaCreditCard, FaMapPin, FaRegCalendarAlt } from 'react-icons/fa';
import StatusTag from '../../components/StatusTag';
import { getOrderById, cancelOrder, confirmPayment } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';

const DetalhesPedidoClientePage = () => {
    const { id } = useParams();
    const { isAdmin } = useAuth();
        const [order, setOrder] = useState(null);
        const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState(null);

        useEffect(() => {
            const fetchOrder = async () => {
                try {
                    setLoading(true);
                    const data = await getOrderById(id);
                    setOrder(data);
                } catch (err) {
                    const msg = err?.response?.data?.details || 'Não foi possível carregar o pedido.';
                    setError(msg);
                } finally {
                    setLoading(false);
                }
            };
            fetchOrder();
        }, [id]);

        if (loading) {
            return (
                <div className={styles.container}>
                    <h1 className={styles.title}>Carregando pedido...</h1>
                </div>
            );
        }

        if (error || !order) {
            return (
                <div className={styles.container}>
                    <h1 className={styles.title}>Pedido não encontrado</h1>
                    <p className={styles.error}>{error}</p>
                    <Link to="/cliente/dashboard" className={styles.backLink}>&larr; Voltar para seus pedidos</Link>
                </div>
            );
        }

    const canCancel = order && [
        'AGUARDANDO_PAGAMENTO',
        'PAGAMENTO_CONFIRMADO',
        'EM_PREPARACAO'
    ].includes(order.status);

    const onCancel = async () => {
        try {
            setCancelError(null);
            setCancelLoading(true);
            const res = await cancelOrder(order.id);
            // backend retorna { message, pedido }
            if (res?.pedido) setOrder(res.pedido);
        } catch (err) {
            const msg = err?.response?.data?.details || 'Não foi possível cancelar o pedido.';
            setCancelError(msg);
        } finally {
            setCancelLoading(false);
        }
    };

    const onConfirmPayment = async () => {
        try {
            const updated = await confirmPayment(order.id);
            setOrder(updated);
        } catch (err) {
            const msg = err?.response?.data?.details || 'Não foi possível confirmar o pagamento.';
            alert(msg);
        }
    };

    // Usa o componente StatusTag compartilhado

    return (
        <div className={styles.container}>
            <Link to="/cliente/dashboard" className={styles.backLink}>&larr; Voltar para a lista</Link>
            <h1 className={styles.title}>Detalhes do Pedido #{order.id}</h1>

            {/*Resumo do Pedido */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <FaRegCalendarAlt className={styles.icon} />
                    <strong>Data do Pedido</strong>
                    <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className={styles.summaryCard}>
                    <FaMapPin className={styles.icon} />
                    <strong>Endereço de Entrega</strong>
                    <span>{order.enderecoEntrega} - {order.cidade}/{order.estado} - {order.cep}</span>
                </div>
                <div className={styles.summaryCard}>
                    <FaCreditCard className={styles.icon} />
                    <strong>Forma de Pagamento</strong>
                    <span>{order.metodoPagamento}</span>
                </div>
                <div className={styles.summaryCard}>
                    <FaBox className={styles.icon} />
                    <strong>Status do Pedido</strong>
                    <StatusTag status={order.status} />
                </div>
            </div>

            {cancelError && (
                <div className={styles.errorBox}>{cancelError}</div>
            )}

            {canCancel && (
                <button
                    className={styles.cancelButton}
                    onClick={onCancel}
                    disabled={cancelLoading}
                    title="Cancelar este pedido"
                >
                    {cancelLoading ? 'Cancelando...' : 'Cancelar pedido'}
                </button>
            )}

            {/* Ação de admin: confirmar pagamento */}
            {isAdmin && order.status === 'AGUARDANDO_PAGAMENTO' && (
                <button
                    className={styles.cancelButton}
                    onClick={onConfirmPayment}
                    title="Confirmar pagamento"
                    style={{ background: '#007b55' }}
                >
                    Confirmar Pagamento
                </button>
            )}

            {/* Itens do Pedido */}
            <div className={styles.itemsSection}>
                <h2 className={styles.sectionTitle}>Itens do Pedido</h2>
                <div className={styles.itemsList}>
                                        {order.items.map(item => {
                                            const name = item.product?.title || 'Produto';
                                            const img = item.product?.images?.[0] || '/images/placeholder.png';
                                            return (
                                                <div key={item.id} className={styles.itemCard}>
                                                    <img src={img} alt={name} className={styles.itemImage} />
                                                    <div className={styles.itemDetails}>
                                                        <span className={styles.itemName}>{name}</span>
                                                        <span className={styles.itemQuantity}>Quantidade: {item.quantity}</span>
                                                    </div>
                                                    <span className={styles.itemPrice}>R$ {Number(item.price).toFixed(2)}</span>
                                                </div>
                                            );
                                        })}
                </div>
                <div className={styles.totalSection}>
                    <span>Total do Pedido:</span>
                                        <span className={styles.totalPrice}>R$ {Number(order.total).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};


export default DetalhesPedidoClientePage;