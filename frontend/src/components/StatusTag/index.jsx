import React from 'react';
import styles from './StatusTag.module.css';

// Mapa consolidado de status -> { label, cls }
// Aceita tanto enums (UPPER_SNAKE_CASE) quanto rótulos PT-BR diversos
const mapStatus = (raw) => {
  if (!raw) return { label: '—', className: styles.tag };
  const s = String(raw).trim();
  const upper = s.toUpperCase();
  const lower = s.toLowerCase();

  // Pedidos (enums)
  if (upper.includes('AGUARDANDO_PAGAMENTO')) return { label: 'Aguardando pagamento', className: `${styles.tag} ${styles.tagAwaiting}` };
  if (upper.includes('PAGAMENTO_CONFIRMADO')) return { label: 'Pagamento confirmado', className: `${styles.tag} ${styles.tagPaid}` };
  if (upper.includes('EM_PREPARACAO')) return { label: 'Em preparação', className: `${styles.tag} ${styles.tagPreparing}` };
  if (upper.includes('ENVIADO')) return { label: 'Enviado', className: `${styles.tag} ${styles.tagShipped}` };
  if (upper.includes('ENTREGUE')) return { label: 'Entregue', className: `${styles.tag} ${styles.tagDelivered}` };
  if (upper.includes('CANCELADO')) return { label: 'Cancelado', className: `${styles.tag} ${styles.tagCanceled}` };
  if (upper.includes('DEVOLVIDO')) return { label: 'Devolvido', className: `${styles.tag} ${styles.tagReturned}` };

  // Rótulos livres comuns (vendedor, etc.)
  if (lower.includes('pending') || lower.includes('pendente')) return { label: 'Pendente', className: `${styles.tag} ${styles.tagAwaiting}` };
  if (lower.includes('active') || lower.includes('ativo') || lower.includes('aprovado')) return { label: 'Ativo', className: `${styles.tag} ${styles.tagDelivered}` };
  if (lower.includes('rejected') || lower.includes('rejeitado')) return { label: 'Rejeitado', className: `${styles.tag} ${styles.tagCanceled}` };

  // Fallback mantém o texto original
  return { label: s, className: styles.tag };
};

const StatusTag = ({ status, className = '' }) => {
  const t = mapStatus(status);
  return <span className={`${t.className} ${className}`.trim()}>{t.label}</span>;
};

export default StatusTag;
