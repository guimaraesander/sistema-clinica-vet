import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

function toMoney(value) {
  return Number(value || 0);
}

function roundMoney(value) {
  return Number(toMoney(value).toFixed(2));
}

export async function obterCaixaAtualService() {
  const caixa = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
    include: {
      usuarioAbertura: {
        select: { id: true, nome: true, perfil: true, email: true },
      },
    },
  });

  if (!caixa) return null;

  return {
    id: caixa.id,
    status: caixa.status,
    abertoEm: caixa.abertoEm,
    fechadoEm: caixa.fechadoEm,
    valorInicial: toMoney(caixa.valorInicial),
    usuarioAbertura: caixa.usuarioAbertura,
  };
}

export async function abrirCaixaService({ usuarioId, valorInicial }) {
  if (!usuarioId) {
    throw new AppError("usuarioId é obrigatório.", 400, "bad_request");
  }

  if (valorInicial === undefined || valorInicial === null) {
    throw new AppError("valorInicial é obrigatório.", 400, "bad_request");
  }

  const valorInicialNumero = Number(valorInicial);

  if (Number.isNaN(valorInicialNumero) || valorInicialNumero < 0) {
    throw new AppError("valorInicial deve ser um número maior ou igual a zero.", 400, "bad_request");
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, ativo: true },
    select: { id: true, nome: true, perfil: true, email: true },
  });

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", 404, "not_found");
  }

  const jaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    select: { id: true },
  });

  if (jaAberto) {
    throw new AppError("Já existe um caixa aberto.", 409, "conflict");
  }

  const caixa = await prisma.caixa.create({
    data: {
      usuarioAberturaId: usuarioId,
      valorInicial: valorInicialNumero,
      status: "ABERTO",
    },
    include: {
      usuarioAbertura: {
        select: { id: true, nome: true, perfil: true, email: true },
      },
    },
  });

  return {
    id: caixa.id,
    status: caixa.status,
    abertoEm: caixa.abertoEm,
    fechadoEm: caixa.fechadoEm,
    valorInicial: toMoney(caixa.valorInicial),
    usuarioAbertura: caixa.usuarioAbertura,
  };
}

export async function obterResumoCaixaService({ caixaId }) {
  if (!caixaId) {
    throw new AppError("caixaId é obrigatório.", 400, "bad_request");
  }

  const caixa = await prisma.caixa.findUnique({
    where: { id: caixaId },
    select: {
      id: true,
      status: true,
      abertoEm: true,
      fechadoEm: true,
      valorInicial: true,
    },
  });

  if (!caixa) {
    throw new AppError("Caixa não encontrado.", 404, "not_found");
  }

  const vendasAgg = await prisma.venda.aggregate({
    where: { caixaId },
    _count: { id: true },
    _sum: {
      totalBruto: true,
      descontoTotal: true,
      totalLiquido: true,
      pagoNoAto: true,
      fiadoValor: true,
    },
  });

  const pagamentosAgg = await prisma.pagamento.aggregate({
    where: { caixaId },
    _count: { id: true },
    _sum: {
      valor: true,
    },
  });

  const pagamentosPorForma = await prisma.pagamento.groupBy({
    by: ["forma"],
    where: { caixaId },
    _sum: { valor: true },
    _count: { _all: true },
  });

  const pagamentos = {
    quantidade: pagamentosAgg._count.id || 0,
    total: toMoney(pagamentosAgg._sum.valor),
    porForma: pagamentosPorForma.reduce((acc, item) => {
      acc[item.forma] = {
        quantidade: item._count._all || 0,
        total: toMoney(item._sum.valor),
      };
      return acc;
    }, {}),
  };

  return {
    caixa: {
      id: caixa.id,
      status: caixa.status,
      abertoEm: caixa.abertoEm,
      fechadoEm: caixa.fechadoEm,
      valorInicial: toMoney(caixa.valorInicial),
    },
    vendas: {
      quantidade: vendasAgg._count.id || 0,
      totalBruto: toMoney(vendasAgg._sum.totalBruto),
      descontoTotal: toMoney(vendasAgg._sum.descontoTotal),
      totalLiquido: toMoney(vendasAgg._sum.totalLiquido),
      pagoNoAto: toMoney(vendasAgg._sum.pagoNoAto),
      fiadoValor: toMoney(vendasAgg._sum.fiadoValor),
    },
    pagamentos,
  };
}

async function calcularConferenciaCaixa({ caixaId, valorInicial }) {
  // Pagamentos em DINHEIRO entram no esperado do caixa físico
  const pagamentosDinheiroAgg = await prisma.pagamento.aggregate({
    where: {
      caixaId,
      forma: "DINHEIRO",
    },
    _sum: {
      valor: true,
    },
  });

  // Movimentos de caixa (se já existirem lançamentos)
  const caixaMovsAgg = await prisma.caixaMov.groupBy({
    by: ["tipo"],
    where: { caixaId },
    _sum: { valor: true },
  });

  let totalSangria = 0;
  let totalSuprimento = 0;

  for (const mov of caixaMovsAgg) {
    if (mov.tipo === "SANGRIA") totalSangria = toMoney(mov._sum.valor);
    if (mov.tipo === "SUPRIMENTO") totalSuprimento = toMoney(mov._sum.valor);
  }

  const totalDinheiroRecebido = toMoney(pagamentosDinheiroAgg._sum.valor);

  const valorEsperado = roundMoney(
    toMoney(valorInicial) + totalDinheiroRecebido + totalSuprimento - totalSangria
  );

  return {
    valorEsperado,
    componentes: {
      valorInicial: toMoney(valorInicial),
      totalDinheiroRecebido,
      totalSuprimento,
      totalSangria,
    },
  };
}

export async function fecharCaixaService({ usuarioFechamentoId, valorInformado }) {
  if (!usuarioFechamentoId) {
    throw new AppError("usuarioFechamentoId é obrigatório.", 400, "bad_request");
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioFechamentoId, ativo: true },
    select: { id: true, nome: true, perfil: true, email: true },
  });

  if (!usuario) {
    throw new AppError("Usuário de fechamento não encontrado.", 404, "not_found");
  }

  const caixaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
    include: {
      usuarioAbertura: {
        select: { id: true, nome: true, perfil: true, email: true },
      },
    },
  });

  if (!caixaAberto) {
    throw new AppError("Nenhum caixa aberto no momento.", 409, "conflict");
  }

  // valorInformado é opcional por enquanto
  let valorInformadoNumero = null;
  if (valorInformado !== undefined && valorInformado !== null && valorInformado !== "") {
    valorInformadoNumero = Number(valorInformado);

    if (Number.isNaN(valorInformadoNumero) || valorInformadoNumero < 0) {
      throw new AppError("valorInformado deve ser um número maior ou igual a zero.", 400, "bad_request");
    }

    valorInformadoNumero = roundMoney(valorInformadoNumero);
  }

  // Calcula conferência ANTES de fechar (mais seguro para pegar dados do caixa aberto)
  const conferenciaBase = await calcularConferenciaCaixa({
    caixaId: caixaAberto.id,
    valorInicial: caixaAberto.valorInicial,
  });

  const valorEsperado = conferenciaBase.valorEsperado;

  const diferenca =
    valorInformadoNumero === null ? null : roundMoney(valorInformadoNumero - valorEsperado);

  const houveDivergencia =
    valorInformadoNumero === null ? false : Math.abs(diferenca) > 0.009;

  const fechado = await prisma.caixa.update({
    where: { id: caixaAberto.id },
    data: {
      status: "FECHADO",
      fechadoEm: new Date(),
      usuarioFechamentoId,
    },
    include: {
      usuarioAbertura: {
        select: { id: true, nome: true, perfil: true, email: true },
      },
      usuarioFechamento: {
        select: { id: true, nome: true, perfil: true, email: true },
      },
    },
  });

  const resumo = await obterResumoCaixaService({ caixaId: fechado.id });

  return {
    id: fechado.id,
    status: fechado.status,
    abertoEm: fechado.abertoEm,
    fechadoEm: fechado.fechadoEm,
    valorInicial: toMoney(fechado.valorInicial),
    usuarioAbertura: fechado.usuarioAbertura,
    usuarioFechamento: fechado.usuarioFechamento,
    resumo,
    conferencia: {
      valorEsperado,
      valorInformado: valorInformadoNumero,
      diferenca,
      houveDivergencia,
      componentes: conferenciaBase.componentes,
    },
  };
}