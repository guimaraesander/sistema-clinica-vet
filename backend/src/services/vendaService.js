import prisma from "../config/prisma.js";

function getModel(client, possibleNames = []) {
  for (const name of possibleNames) {
    if (client?.[name]) return client[name];
  }
  return null;
}

function mapVendaItemResponse(item) {
  return {
    id: item.id,
    produtoId: item.produtoId,
    codigo: item.produto?.codigo ?? null,
    nome: item.descricaoCache ?? item.produto?.nome ?? null,
    quantidade: item.qtd,
    precoUnitario: Number(item.precoUnit),
    descontoItem: Number(item.descontoItem),
    subtotal: Number(item.subtotal),
  };
}

function mapVendaResponse(venda) {
  return {
    id: venda.id,
    status: venda.status,
    data: venda.data,
    caixaId: venda.caixaId,
    usuarioId: venda.usuarioId,
    clienteId: venda.clienteId ?? null,
    totalBruto: Number(venda.totalBruto),
    descontoTotal: Number(venda.descontoTotal),
    totalLiquido: Number(venda.totalLiquido),
    pagoNoAto: Number(venda.pagoNoAto),
    fiadoValor: Number(venda.fiadoValor),
    canceladaEm: venda.canceladaEm,
    canceladaMotivo: venda.canceladaMotivo,
    usuario: venda.usuario
      ? {
          id: venda.usuario.id,
          nome: venda.usuario.nome,
          email: venda.usuario.email,
          perfil: venda.usuario.perfil,
        }
      : null,
    cliente: venda.cliente
      ? {
          id: venda.cliente.id,
          nome: venda.cliente.nome,
          cpf: venda.cliente.cpf,
          telefone: venda.cliente.telefone,
        }
      : null,
    itens: Array.isArray(venda.itens) ? venda.itens.map(mapVendaItemResponse) : [],
  };
}

export async function criarVendaService({ usuarioId, itens }) {
  if (!usuarioId) {
    const err = new Error("usuarioId é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(itens) || itens.length === 0) {
    const err = new Error("itens é obrigatório e deve conter pelo menos 1 item.");
    err.statusCode = 400;
    throw err;
  }

  for (const item of itens) {
    if (!item.produtoId) {
      const err = new Error("Cada item deve ter produtoId.");
      err.statusCode = 400;
      throw err;
    }

    const qtd = Number(item.quantidade);
    if (Number.isNaN(qtd) || qtd <= 0) {
      const err = new Error("Quantidade deve ser maior que zero.");
      err.statusCode = 400;
      throw err;
    }
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, perfil: true, ativo: true },
  });

  if (!usuario) {
    const err = new Error("Usuário não encontrado.");
    err.statusCode = 404;
    throw err;
  }

  if (!usuario.ativo) {
    const err = new Error("Usuário está inativo.");
    err.statusCode = 400;
    throw err;
  }

  const caixaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
  });

  if (!caixaAberto) {
    const err = new Error("Não existe caixa aberto para registrar venda.");
    err.statusCode = 409;
    throw err;
  }

  const produtoIds = [...new Set(itens.map((i) => i.produtoId))];

  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
    include: { estoqueSaldo: true },
  });

  if (produtos.length !== produtoIds.length) {
    const encontrados = new Set(produtos.map((p) => p.id));
    const faltando = produtoIds.filter((id) => !encontrados.has(id));

    const err = new Error(`Produto(s) não encontrado(s): ${faltando.join(", ")}`);
    err.statusCode = 404;
    throw err;
  }

  const produtoMap = new Map(produtos.map((p) => [p.id, p]));

  const itensConsolidadosMap = new Map();
  for (const item of itens) {
    const qtd = Number(item.quantidade);
    const atual = itensConsolidadosMap.get(item.produtoId) || 0;
    itensConsolidadosMap.set(item.produtoId, atual + qtd);
  }

  const itensConsolidados = [...itensConsolidadosMap.entries()].map(
    ([produtoId, quantidade]) => ({
      produtoId,
      quantidade,
    })
  );

  let totalVenda = 0;

  const itensParaCriar = itensConsolidados.map((item) => {
    const produto = produtoMap.get(item.produtoId);
    const estoqueAtual = produto?.estoqueSaldo?.quantidade ?? 0;

    if (estoqueAtual < item.quantidade) {
      const err = new Error(
        `Estoque insuficiente para "${produto.nome}". Disponível: ${estoqueAtual}, solicitado: ${item.quantidade}.`
      );
      err.statusCode = 409;
      throw err;
    }

    const precoUnitario = Number(produto.precoVenda);
    const subtotal = precoUnitario * item.quantidade;
    totalVenda += subtotal;

    return {
      produtoId: produto.id,
      quantidade: item.quantidade,
      precoUnitario,
      subtotal,
      produtoNome: produto.nome,
      produtoCodigo: produto.codigo,
    };
  });

  const resultado = await prisma.$transaction(async (tx) => {
    const venda = await tx.venda.create({
      data: {
        usuarioId,
        caixaId: caixaAberto.id,
        totalBruto: totalVenda,
        descontoTotal: 0,
        totalLiquido: totalVenda,
        pagoNoAto: 0,
        fiadoValor: 0,
      },
    });

    const itemVendaModel = getModel(tx, ["vendaItem", "itemVenda"]);
    if (!itemVendaModel) {
      const err = new Error(
        "Model de item de venda não encontrado no Prisma Client. Esperado: vendaItem ou itemVenda."
      );
      err.statusCode = 500;
      throw err;
    }

    const estoqueMovModel = getModel(tx, ["estoqueMov", "movimentoEstoque"]);

    for (const item of itensParaCriar) {
      await itemVendaModel.create({
        data: {
          vendaId: venda.id,
          produtoId: item.produtoId,
          descricaoCache: item.produtoNome,
          qtd: item.quantidade,
          precoUnit: item.precoUnitario,
          descontoItem: 0,
          subtotal: item.subtotal,
        },
      });

      await tx.estoqueSaldo.update({
        where: { produtoId: item.produtoId },
        data: {
          quantidade: {
            decrement: item.quantidade,
          },
        },
      });

      if (estoqueMovModel) {
        await estoqueMovModel.create({
          data: {
            produtoId: item.produtoId,
            tipo: "SAIDA",
            origem: "VENDA",
            qtd: item.quantidade,
            refVendaId: venda.id,
            usuarioId,
            obs: `Saída por venda ${venda.id}`,
          },
        });
      }
    }

    return venda;
  });

  return {
    id: resultado.id,
    status: resultado.status,
    caixaId: caixaAberto.id,
    usuarioId,
    totalBruto: Number(totalVenda),
    totalLiquido: Number(totalVenda),
    itens: itensParaCriar.map((i) => ({
      produtoId: i.produtoId,
      codigo: i.produtoCodigo,
      nome: i.produtoNome,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      subtotal: i.subtotal,
    })),
  };
}

export async function listarVendasService() {
  const vendas = await prisma.venda.findMany({
    orderBy: { data: "desc" },
    include: {
      usuario: {
        select: { id: true, nome: true, email: true, perfil: true },
      },
      cliente: {
        select: { id: true, nome: true, cpf: true, telefone: true },
      },
      itens: {
        include: {
          produto: {
            select: { id: true, codigo: true, nome: true },
          },
        },
      },
    },
  });

  return vendas.map(mapVendaResponse);
}

export async function obterVendaPorIdService(id) {
  if (!id) {
    const err = new Error("id da venda é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  const venda = await prisma.venda.findUnique({
    where: { id },
    include: {
      usuario: {
        select: { id: true, nome: true, email: true, perfil: true },
      },
      cliente: {
        select: { id: true, nome: true, cpf: true, telefone: true },
      },
      itens: {
        include: {
          produto: {
            select: { id: true, codigo: true, nome: true },
          },
        },
      },
      pagamentos: true,
      caixa: {
        select: { id: true, status: true, abertoEm: true, fechadoEm: true },
      },
    },
  });

  if (!venda) {
    const err = new Error("Venda não encontrada.");
    err.statusCode = 404;
    throw err;
  }

  const base = mapVendaResponse(venda);

  return {
    ...base,
    caixa: venda.caixa
      ? {
          id: venda.caixa.id,
          status: venda.caixa.status,
          abertoEm: venda.caixa.abertoEm,
          fechadoEm: venda.caixa.fechadoEm,
        }
      : null,
    pagamentos: (venda.pagamentos || []).map((p) => ({
      id: p.id,
      forma: p.forma,
      valor: Number(p.valor),
      data: p.data,
      usuarioId: p.usuarioId,
    })),
  };
}