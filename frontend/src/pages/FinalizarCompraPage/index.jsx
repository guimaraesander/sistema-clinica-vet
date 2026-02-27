import React, { useState } from 'react';
import styles from './Confirmacompra.module.css';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../services/orderService';
import { useNavigate } from 'react-router-dom';

// Validador de CPF
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf.charAt(10));
};

const InformacoesPessoais = ({ cpf, setCpf, cpfErro, setCpfErro, formData, setFormData }) => {
  const handleCpfChange = (e) => {
    setCpf(e.target.value);
    if (cpfErro) setCpfErro('');
  };

  const handleCpfBlur = () => {
    if (!validarCPF(cpf)) {
      setCpfErro('CPF inválido. Verifique os dígitos.');
    } else {
      setCpfErro('');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section className={styles.formSection}>
      <h4>Informações Pessoais</h4>

      <label>Nome Completo *</label>
      <input
        type="text"
        name="nome"
        placeholder="Insira seu nome"
        value={formData.nome}
        onChange={handleChange}
        required
      />

      <label>CPF *</label>
      <input
        type="text"
        name="cpf"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={handleCpfChange}
        onBlur={handleCpfBlur}
        className={cpfErro ? styles.erroInput : ''}
        required
      />
      {cpfErro && <p className={styles.erroMensagem}>{cpfErro}</p>}

      <label>Rua *</label>
      <input
        type="text"
        name="rua"
        placeholder="Rua Exemplo"
        value={formData.rua}
        onChange={handleChange}
        required
      />

      <label>Número *</label>
      <input
        type="text"
        name="numero"
        placeholder="123"
        value={formData.numero}
        onChange={handleChange}
        required
      />

      <label>Bairro *</label>
      <input
        type="text"
        name="bairro"
        placeholder="Bairro"
        value={formData.bairro}
        onChange={handleChange}
        required
      />

      <label>Cidade *</label>
      <input
        type="text"
        name="cidade"
        placeholder="Cidade"
        value={formData.cidade}
        onChange={handleChange}
        required
      />

      <label>Estado *</label>
      <input
        type="text"
        name="estado"
        placeholder="Estado"
        value={formData.estado}
        onChange={handleChange}
        required
      />

      <label>CEP *</label>
      <input
        type="text"
        name="cep"
        placeholder="00000-000"
        value={formData.cep}
        onChange={handleChange}
        required
      />
    </section>
  );
};

const InformacoesPagamento = ({ formData, setFormData, metodo, setMetodo }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section className={styles.formSection}>
      <h4>Informações de Pagamento</h4>

      <label>Método de Pagamento *</label>
      <select name="metodoPagamento" value={metodo} onChange={e => setMetodo(e.target.value)} required>
        <option value="cartao">Cartão de Crédito</option>
        <option value="pix">Pix</option>
      </select>

      {metodo === 'cartao' && (
        <>
          <label>Número do Cartão *</label>
          <input
            type="text"
            name="numeroCartao"
            placeholder="0000 0000 0000 0000"
            value={formData.numeroCartao}
            onChange={handleChange}
            required
          />

          <label>Nome no Cartão *</label>
          <input
            type="text"
            name="nomeCartao"
            placeholder="Nome impresso no cartão"
            value={formData.nomeCartao}
            onChange={handleChange}
            required
          />

          <label>Validade (MM/AA) *</label>
          <input
            type="text"
            name="validade"
            placeholder="MM/AA"
            value={formData.validade}
            onChange={handleChange}
            required
          />

          <label>CVV *</label>
          <input
            type="text"
            name="cvv"
            placeholder="123"
            value={formData.cvv}
            onChange={handleChange}
            required
          />
        </>
      )}
      {metodo === 'pix' && (
        <div style={{marginTop: '16px'}}>
          <p>Pagamento instantâneo via Pix.</p>
          <p>Use a chave Pix abaixo:</p>
          <input type="text" value="fazopixbb@tecnobits.com" readOnly style={{width: '100%', marginBottom: '8px'}} />
        </div>
      )}
    </section>
  );
};

const ResumoPedido = () => {
  const { cartItems, getCartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <aside className={styles.orderSummary}>
        <h4>RESUMO</h4>
        <p>Seu carrinho está vazio.</p>
      </aside>
    );
  }

  const subtotal = getCartTotal();
  const SHIPPING_COST = 25.0; // ajuste conforme necessário
  const DISCOUNT_PERCENTAGE = 0.0; // ajuste conforme necessário
  const shippingCost = SHIPPING_COST;
  const discount = subtotal * DISCOUNT_PERCENTAGE;
  const total = subtotal + shippingCost - discount;

  const formatCurrency = (value) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <aside className={styles.orderSummary}>
      <h4>RESUMO DO PEDIDO</h4>

      {cartItems.map((item) => (
        <div key={item.id} className={styles.summaryLine}>
          <span>{item.name} x{item.quantity}</span>
          <span>{formatCurrency(item.price * item.quantity)}</span>
        </div>
      ))}

      <hr />

      <div className={styles.summaryLine}>
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div className={styles.summaryLine}>
        <span>Frete</span>
        <span>{formatCurrency(shippingCost)}</span>
      </div>

      <div className={styles.summaryLine}>
        <span>Desconto</span>
        <span>- {formatCurrency(discount)}</span>
      </div>

      <div className={styles.summaryTotal}>
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </aside>
  );
};

const Confirmacompra = () => {
  const [cpf, setCpf] = useState('');
  const [cpfErro, setCpfErro] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('cartao');
  const [formData, setFormData] = useState({
    nome: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    numeroCartao: '',
    nomeCartao: '',
    validade: '',
    cvv: ''
  });

  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // CPF
    if (!validarCPF(cpf)) {
      setCpfErro('CPF inválido. Corrija para continuar.');
      return;
    }

    // Validações específicas conforme método de pagamento
    if (metodoPagamento === 'cartao') {
      // Número do cartão (16 dígitos)
      const cardNumber = formData.numeroCartao.replace(/\s/g, '');
      if (!/^\d{16}$/.test(cardNumber)) {
        alert('Número do cartão inválido. Deve conter 16 dígitos.');
        return;
      }

      // Nome no cartão
      if (!/^[a-zA-ZÀ-ú]+\s+[a-zA-ZÀ-ú]+/.test(formData.nomeCartao.trim())) {
        alert('Nome no cartão inválido. Deve conter nome e sobrenome.');
        return;
      }

      // Validade MM/AA e não expirada
      const validade = formData.validade.trim();
      if (!/^\d{2}\/\d{2}$/.test(validade)) {
        alert('Validade inválida. Use o formato MM/AA.');
        return;
      }

      const [mes, ano] = validade.split('/').map(Number);
      const dataAtual = new Date();
      const anoAtual = Number(String(dataAtual.getFullYear()).slice(2));
      const mesAtual = dataAtual.getMonth() + 1;

      if (mes < 1 || mes > 12 || ano < anoAtual || (ano === anoAtual && mes < mesAtual)) {
        alert('Cartão vencido. Informe uma validade futura.');
        return;
      }

      // CVV
      if (!/^\d{3}$/.test(formData.cvv)) {
        alert('CVV inválido. Deve conter 3 dígitos.');
        return;
      }
    }

    if (cartItems.length === 0) {
      alert('Seu carrinho está vazio. Adicione produtos antes de finalizar.');
      return;
    }

  // Preparar dados locais (se necessário no futuro)

    // Mapear método de pagamento para enum esperado pelo backend (PaymentMethod)
    const metodoPagamentoEnum = metodoPagamento === 'pix' ? 'PIX' : 'CARTAO_CREDITO';

    // Estimativa simples de entrega: +5 dias corridos
    const dataEntregaPrevista = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // Montar payload para backend (orderService.createOrderFromCart)
    const payload = {
      cep: formData.cep,
      cidade: formData.cidade,
      enderecoEntrega: `${formData.rua}, ${formData.numero} - ${formData.bairro}`,
      complemento: '',
      estado: formData.estado,
      cpf,
      metodoPagamento: metodoPagamentoEnum,
      dataEntregaPrevista,
    };

    try {
      setSubmitError('');
      setSubmitting(true);
      const created = await createOrder(payload);
      // Opcional: limpar carrinho após criar pedido
      clearCart();
      navigate('/success', { state: { order: created } });
    } catch (err) {
      console.error('Erro ao criar pedido:', err?.response?.data || err);
      const details = err?.response?.data?.details || err?.message || '';
      setSubmitError(`Não foi possível registrar o pedido. ${details}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.container}>
      <h3>Finalizar Compra</h3>

      <div className={styles.mainContent}>
        <form className={styles.formsColumn} onSubmit={handleSubmit}>
          <InformacoesPessoais
            cpf={cpf}
            setCpf={setCpf}
            cpfErro={cpfErro}
            setCpfErro={setCpfErro}
            formData={formData}
            setFormData={setFormData}
          />
          <InformacoesPagamento
            formData={formData}
            setFormData={setFormData}
            metodo={metodoPagamento}
            setMetodo={setMetodoPagamento}
          />

          {submitError && (
            <div className={styles.erroMensagem} role="alert" style={{ marginTop: 8 }}>
              {submitError}
            </div>
          )}
          <button type="submit" className={styles.summaryButton} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar Dados'}
          </button>
        </form>

        <div className={styles.summaryColumn}>
          <ResumoPedido />
        </div>
      </div>
    </main>
  );
};

export default Confirmacompra;
