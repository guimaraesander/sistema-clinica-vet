import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

function getModel(client, possibleNames = []) {
  for (const name of possibleNames) {
    if (client?.[name]) return client[name];
  }
  return null;
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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
    throw new AppError("usuarioId é obrigatório.", 400, "request_error");
  }

  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError(
      "itens é obrigatório e deve conter pelo menos 1 item.",
      400,
      "request_error"
    );
  }

  for (const item of itens) {
    if (!item.produtoId) {
      throw new AppError("Cada item deve ter produtoId.", 400, "request_error");
    }

    const qtd = Number(item.quantidade);
    if (Number.isNaN(qtd) || qtd <= 0) {
      throw new AppError("Quantidade deve ser maior que zero.", 400, "request_error");
    }
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, perfil: true, ativo: true },
  });

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", 404, "request_error");
  }

  if (!usuario.ativo) {
    throw new AppError("Usuário está inativo.", 400, "request_error");
  }

  const caixaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
  });

  if (!caixaAberto) {
    throw new AppError(
      "Não existe caixa aberto para registrar venda.",
      409,
      "request_error"
    );
  }

  const produtoIds = [...new Set(itens.map((i) => i.produtoId))];

  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
    include: { estoqueSaldo: true },
  });

  if (produtos.length !== produtoIds.length) {
    const encontrados = new Set(produtos.map((p) => p.id));
    const faltando = produtoIds.filter((id) => !encontrados.has(id));

    throw new AppError(
      `Produto(s) não encontrado(s): ${faltando.join(", ")}`,
      404,
      "request_error"
    );
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
      throw new AppError(
        `Estoque insuficiente para "${produto.nome}". Disponível: ${estoqueAtual}, solicitado: ${item.quantidade}.`,
        409,
        "request_error"
      );
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
        fiadoValor: totalVenda,
        status: "PENDENTE",
      },
    });

    const itemVendaModel = getModel(tx, ["vendaItem", "itemVenda"]);
    if (!itemVendaModel) {
      throw new AppError(
        "Model de item de venda não encontrado no Prisma Client. Esperado: vendaItem ou itemVenda.",
        500,
        "internal_error"
      );
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
    pagoNoAto: Number(resultado.pagoNoAto),
    fiadoValor: Number(resultado.fiadoValor),
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
    throw new AppError("id da venda é obrigatório.", 400, "request_error");
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
    throw new AppError("Venda não encontrada.", 404, "request_error");
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

export async function registrarPagamentoVendaService({
  vendaId,
  usuarioId,
  forma,
  valor,
}) {
  if (!vendaId) {
    throw new AppError("vendaId é obrigatório.", 400, "request_error");
  }

  if (!usuarioId) {
    throw new AppError("usuarioId é obrigatório.", 400, "request_error");
  }

  if (!forma) {
    throw new AppError("forma é obrigatória.", 400, "request_error");
  }

  const formaNormalizada = String(forma).toUpperCase();
  const formasValidas = ["DINHEIRO", "CARTAO", "PIX", "TRANSFERENCIA"];

  if (!formasValidas.includes(formaNormalizada)) {
    throw new AppError(
      `Forma de pagamento inválida. Use: ${formasValidas.join(", ")}.`,
      400,
      "request_error"
    );
  }

  const valorNumero = Number(valor);
  if (Number.isNaN(valorNumero) || valorNumero <= 0) {
    throw new AppError(
      "valor deve ser um número maior que zero.",
      400,
      "request_error"
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, ativo: true },
  });

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", 404, "request_error");
  }

  if (!usuario.ativo) {
    throw new AppError("Usuário está inativo.", 400, "request_error");
  }

  const caixaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
    select: { id: true, status: true, abertoEm: true },
  });

  if (!caixaAberto) {
    throw new AppError(
      "Não existe caixa aberto para registrar pagamento.",
      409,
      "request_error"
    );
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUnique({
      where: { id: vendaId },
      select: {
        id: true,
        status: true,
        totalLiquido: true,
        pagoNoAto: true,
        fiadoValor: true,
        canceladaEm: true,
      },
    });

    if (!venda) {
      throw new AppError("Venda não encontrada.", 404, "request_error");
    }

    if (venda.status === "CANCELADA" || venda.canceladaEm) {
      throw new AppError(
        "Não é possível registrar pagamento em venda cancelada.",
        409,
        "request_error"
      );
    }

    const totalLiquido = Number(venda.totalLiquido);
    const pagoAtual = Number(venda.pagoNoAto);
    const restanteAtual = round2(totalLiquido - pagoAtual);

    if (restanteAtual <= 0) {
      throw new AppError(
        "Venda já está totalmente paga.",
        409,
        "request_error"
      );
    }

    if (valorNumero > restanteAtual) {
      throw new AppError(
        `Valor do pagamento excede o saldo restante da venda (restante: ${restanteAtual.toFixed(2)}).`,
        409,
        "request_error"
      );
    }

    const pagamento = await tx.pagamento.create({
      data: {
        caixaId: caixaAberto.id,
        vendaId,
        forma: formaNormalizada,
        valor: valorNumero,
        usuarioId,
      },
    });

    const novoPagoNoAto = round2(pagoAtual + valorNumero);
    const novoFiado = round2(totalLiquido - novoPagoNoAto);
    const novoStatus = novoFiado <= 0 ? "FINALIZADA" : "PENDENTE";

    const vendaAtualizada = await tx.venda.update({
      where: { id: vendaId },
      data: {
        pagoNoAto: novoPagoNoAto,
        fiadoValor: novoFiado < 0 ? 0 : novoFiado,
        status: novoStatus,
      },
      select: {
        id: true,
        status: true,
        totalLiquido: true,
        pagoNoAto: true,
        fiadoValor: true,
      },
    });

    return {
      pagamento,
      venda: vendaAtualizada,
      caixa: caixaAberto,
    };
  });

  return {
    vendaId: resultado.venda.id,
    statusVenda: resultado.venda.status,
    caixaId: resultado.caixa.id,
    pagamento: {
      id: resultado.pagamento.id,
      forma: resultado.pagamento.forma,
      valor: Number(resultado.pagamento.valor),
      data: resultado.pagamento.data,
      usuarioId: resultado.pagamento.usuarioId,
    },
    totaisVenda: {
      totalLiquido: Number(resultado.venda.totalLiquido),
      pagoNoAto: Number(resultado.venda.pagoNoAto),
      fiadoValor: Number(resultado.venda.fiadoValor),
    },
  };
}