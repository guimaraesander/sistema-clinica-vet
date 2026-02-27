import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './style.css';
import { ButtonShop } from '../../components/Buttons/ButtonComponents';
import { useCart } from '../../contexts/CartContext';
import { getOrderById } from '../../services/orderService';

const BuySuccessPage = () => {
  const { clearCart } = useCart();
  const { state } = useLocation();
  const [orderDetails, setOrderDetails] = useState(state?.order || null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Redireciona caso a navegação não tenha state
  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);


  // Quando navegamos a partir do checkout com integração ao backend,
  // passamos { state: { order: created } }.
  const order = orderDetails || {};
  const orderItems = useMemo(() => {
    if (Array.isArray(order?.items) && order.items.length > 0) return order.items;
    return Array.isArray(state?.cartItems) ? state.cartItems : [];
  }, [order?.items, state?.cartItems]);

  // Buscar detalhes do pedido (com produtos) se necessário
  useEffect(() => {
    const needProducts = Array.isArray(orderDetails?.items) && orderDetails.items.length > 0 && !orderDetails.items[0]?.product;
    if (orderDetails?.id && needProducts) {
      (async () => {
        try {
          setLoadingOrder(true);
          const full = await getOrderById(orderDetails.id);
          setOrderDetails(full);
        } catch (err) {
          console.error('Erro ao carregar pedido completo:', err?.response?.data || err);
          setError(err?.response?.data?.details || err?.message || '');
        } finally {
          setLoadingOrder(false);
        }
      })();
    }
  }, [orderDetails?.id, orderDetails?.items]);

  // Dados pessoais: preferir dados do pedido (buyer), com fallback ao state
  const buyer = order?.buyer || {};
  const nome = buyer.name || state.nome || undefined;
  const email = buyer.email || state.email || undefined;
  const phone = buyer.phone || state.phone || undefined;
  const cpf = order?.cpf || state.cpf || undefined; // Preferir CPF salvo no pedido; fallback ao state
  // Endereço: preferir string completa do pedido
  const enderecoEntrega = order.enderecoEntrega;
  const cidade = order.cidade || state.cidade;
  const estado = order.estado || state.estado;
  const cep = order.cep || state.cep;
  // Pagamento: mostrar método; dados de cartão só se vierem do state (nunca do backend)
  const metodoPagamento = order.metodoPagamento;
  const nomeCartao = state.nomeCartao;
  const numeroCartao = state.numeroCartao;
  const validade = state.validade;
  // Totais: usar do pedido; shipping/discount apenas se o state informar
  const subtotalCalc = useMemo(() => {
    if (typeof state?.subtotal === 'number') return state.subtotal;
    // calcular com base nos itens quando possível
    if (Array.isArray(orderItems) && orderItems.length > 0) {
      return orderItems.reduce((acc, it) => acc + Number(it.price || it.product?.price || 0) * (it.quantity || 1), 0);
    }
    return typeof order?.total === 'number' ? order.total : 0;
  }, [state?.subtotal, orderItems, order?.total]);
  const shippingCost = state.shippingCost;
  const discount = state.discount;
  const total = typeof state?.total === 'number' ? state.total : (typeof order?.total === 'number' ? order.total : subtotalCalc);

  const mascararCartao = (num) => {
    if (!num || num.length < 4) return 'Não informado';
    return `**** **** **** ${num.slice(-4)}`;
  };

  const formatCurrency = (value) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="container-main">
      <div className="container">
        {!state && (
          <p style={{ padding: 16 }}>Redirecionando...</p>
        )}
        {loadingOrder && (
          <p style={{ padding: 16 }}>Carregando detalhes do pedido...</p>
        )}
        {error && (
          <p style={{ padding: 16, color: 'red' }}>Erro ao carregar pedido: {error}</p>
        )}
        <div className="content-icon-title">
          <div className="content-icon">
            <img src="/images/confete.png" alt="Confete de festa" />
          </div>
          <div className="content-title">
            <h2>
              Compra realizada <br /> com sucesso!
            </h2>
            <p className="subtext" style={{ textAlign: 'center', marginTop: 10 }}>
              Obrigado por comprar conosco! Abaixo estão os detalhes do seu pedido.
            </p>
          </div>
        </div>

        <div className="linha-divisor"></div>

        <section className="section-info">
          <h2>Informações Pessoais</h2>
          {nome && (
            <p>
              <span>Nome:</span>
              <strong>{nome}</strong>
            </p>
          )}
          {email && (
            <p>
              <span>E-mail:</span>
              <strong>{email}</strong>
            </p>
          )}
          {phone && (
            <p>
              <span>Telefone:</span>
              <strong>{phone}</strong>
            </p>
          )}
          {cpf && (
            <p>
              <span>CPF:</span>
              <strong>{cpf}</strong>
            </p>
          )}
        </section>

        <div className="linha-divisor"></div>

        <section className="section-info">
          <h2>Endereço de Entrega</h2>
          {enderecoEntrega && (
            <p>
              <span>Endereço:</span>
              <strong>{enderecoEntrega}</strong>
            </p>
          )}
          {(cidade || estado) && (
            <p>
              <span>Cidade/Estado:</span>
              <strong>
                {cidade} {cidade && estado ? ' - ' : ''} {estado}
              </strong>
            </p>
          )}
          {cep && (
            <p>
              <span>CEP:</span>
              <strong>{cep}</strong>
            </p>
          )}
        </section>

        <div className="linha-divisor"></div>

        <section className="section-payment">
          <h2>Informações de Pagamento</h2>
          {metodoPagamento && (
            <p>
              <span>Forma de pagamento:</span>
              <strong>{metodoPagamento}</strong>
            </p>
          )}
          {nomeCartao && (
            <p>
              <span>Nome no cartão:</span>
              <strong>{nomeCartao}</strong>
            </p>
          )}
          {numeroCartao && (
            <p>
              <span>Número do cartão:</span>
              <strong>{mascararCartao(numeroCartao)}</strong>
            </p>
          )}
          {validade && (
            <p>
              <span>Validade:</span>
              <strong>{validade}</strong>
            </p>
          )}
        </section>

        <div className="linha-divisor"></div>

        <section className="section-resumo">
          <h2>Resumo da Compra</h2>
          {orderItems.map((item, idx) => {
            const key = item.id || item.productId || idx;
            const name = item.product?.title || item.name || 'Produto';
            const image = (item.product?.images && item.product.images[0]) || item.image || '/images/placeholder.png';
            const price = Number(item.price ?? item.product?.price ?? 0);
            const quantity = item.quantity || 1;
            return (
              <div key={key} className="container-imagem-texto">
                <div className="lado-esquerdo">
                  <img src={image} alt={name} />
                </div>
                <div className="lado-direito">
                  <p>{name}</p>
                  <p>Quantidade: {quantity}</p>
                  <p>Preço unitário: {formatCurrency(price)}</p>
                  <p>Subtotal: {formatCurrency(price * quantity)}</p>
                </div>
              </div>
            );
          })}

          <div className="container-total-valor">
            <div className="total-valor">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotalCalc)}</span>
            </div>
            {typeof shippingCost === 'number' && (
              <div className="total-valor">
                <span>Frete:</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
            )}
            {typeof discount === 'number' && (
              <div className="total-valor">
                <span>Desconto:</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="total-valor" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        <div className="linha-divisor"></div>

        <div className="content-print">
          <button className="print-button" onClick={() => window.print()}>
            🧾 Imprimir recibo
          </button>
        </div>

        <div style={{ marginTop: 20, width: '100%', maxWidth: 778, display: 'flex', justifyContent: 'center', gap: 12 }}>
          {order?.id && (
            <ButtonShop onClick={() => navigate(`/orders/${order.id}`)}>Ver detalhes do pedido</ButtonShop>
          )}
          <ButtonShop onClick={() => navigate('/')}>Voltar para Home</ButtonShop>
        </div>
      </div>
    </div>
  );
};

export default BuySuccessPage;
