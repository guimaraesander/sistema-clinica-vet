import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import 'dotenv/config';

const prisma = new PrismaClient();

const BUYER_ID = 'GR99VD';
const SELLER_ID = 'cmfpu0jz00000ejmb53usybj5';

async function pickProductsWithStock(sellerId, min = 2, max = 4) {
  // Busca produtos do vendedor com estoque > 0
  const products = await prisma.product.findMany({
    where: { sellerId: String(sellerId), stock: { gt: 0 } },
    orderBy: { updatedAt: 'desc' }
  });

  if (products.length === 0) return [];

  // Seleciona de 2 a 4 itens (ou menos se não houver)
  const desired = Math.max(1, Math.min(products.length, Math.floor(Math.random() * (max - min + 1)) + min));
  // Embaralha simples
  const shuffled = products.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, desired);
}

function buildAddressPayload() {
  const samples = [
    {
      cep: '01310-930',
      cidade: 'São Paulo',
      estado: 'SP',
      enderecoEntrega: 'Av. Paulista, 1000',
      complemento: 'Apto 121'
    },
    {
      cep: '20040-010',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      enderecoEntrega: 'Rua da Quitanda, 50',
      complemento: 'Sala 301'
    },
    {
      cep: '30130-010',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      enderecoEntrega: 'Praça Sete, 1',
      complemento: 'Cobertura'
    }
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}

function pickPaymentMethod() {
  const methods = ['PIX', 'CARTAO_CREDITO', 'BOLETO'];
  return methods[Math.floor(Math.random() * methods.length)];
}

async function createSingleOrder(buyerId, sellerId) {
  const products = await pickProductsWithStock(sellerId);
  if (!products.length) {
    console.log('Nenhum produto com estoque encontrado para o vendedor. Pulando criação de pedido.');
    return null;
  }

  // Monta itens com quantidades válidas
  const items = products.map((p) => {
    const maxQty = Math.max(1, Math.min(3, p.stock));
    const qty = Math.max(1, Math.floor(Math.random() * maxQty) + 1);
    return { productId: p.id, quantity: qty, price: Number(p.price) };
  });

  // Data de entrega prevista (3 a 7 dias a partir de hoje)
  const etaDays = Math.floor(Math.random() * 5) + 3;
  const dataEntregaPrevista = new Date(Date.now() + etaDays * 24 * 60 * 60 * 1000);

  const { cep, cidade, estado, enderecoEntrega, complemento } = buildAddressPayload();
  const metodoPagamento = pickPaymentMethod();

  // Calcular total
  const total = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
  const orderId = nanoid();

  const result = await prisma.$transaction(async (tx) => {
    // Pré-checagem e recálculo de preços/estoque atuais para consistência
    const finalItems = [];
    let totalAtual = 0;
    for (const it of items) {
      const p = await tx.product.findUnique({ where: { id: String(it.productId) }, select: { price: true, stock: true } });
      if (!p || p.stock < it.quantity) {
        throw new Error('Estoque insuficiente para um ou mais itens ao criar pedido');
      }
      const priceNow = Number(p.price);
      totalAtual += priceNow * it.quantity;
      finalItems.push({ productId: it.productId, quantity: it.quantity, price: priceNow });
    }

    const createdOrder = await tx.order.create({
      data: {
        id: orderId,
        buyerId: String(buyerId),
        total: totalAtual,
        cep,
        cidade,
        enderecoEntrega,
        complemento,
        dataEntregaPrevista,
        estado,
        metodoPagamento,
        items: { create: finalItems }
      },
      include: { items: true }
    });

    // Decrementa estoque
    for (const it of finalItems) {
      await tx.product.update({
        where: { id: String(it.productId) },
        data: { stock: { decrement: it.quantity } }
      });
    }

    return createdOrder;
  });

  return result;
}

async function main() {
  console.log('=== Seed: Criar pedidos de teste ===');
  console.log(`Buyer (cliente): ${BUYER_ID} | Seller (vendedor): ${SELLER_ID}`);

  const buyer = await prisma.user.findUnique({ where: { id: String(BUYER_ID) } });
  if (!buyer) {
    console.error(`Cliente com id '${BUYER_ID}' não encontrado. Abortando.`);
    return;
  }
  const seller = await prisma.user.findUnique({ where: { id: String(SELLER_ID) } });
  if (!seller) {
    console.error(`Vendedor com id '${SELLER_ID}' não encontrado. Abortando.`);
    return;
  }

  // Confere se existem produtos do vendedor com estoque
  const productCount = await prisma.product.count({ where: { sellerId: String(SELLER_ID), stock: { gt: 0 } } });
  if (productCount === 0) {
    console.warn('Nenhum produto com estoque > 0 para o vendedor. Considere rodar o seed de produtos primeiro.');
  }

  const results = [];
  // Tenta criar de 2 a 3 pedidos
  const numOrders = Math.floor(Math.random() * 2) + 2; // 2 ou 3
  for (let i = 0; i < numOrders; i++) {
    try {
      const order = await createSingleOrder(BUYER_ID, SELLER_ID);
      if (order) {
        results.push(order);
        console.log(`Pedido criado: ${order.id} | Itens: ${order.items.length} | Total: R$ ${Number(order.total).toFixed(2)}`);
      }
    } catch (err) {
      console.error('Falha ao criar um pedido:', err.message || err);
    }
  }

  console.log('=== Resumo ===');
  console.log(`Pedidos criados: ${results.length}`);
  for (const o of results) {
    console.log(`- ${o.id} • ${o.items.length} itens • total R$ ${Number(o.total).toFixed(2)} • criado em ${o.createdAt}`);
  }
}

main()
  .catch((e) => {
    console.error('Erro geral no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
