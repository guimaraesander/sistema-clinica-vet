import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

function toNumber(value) {
  return Number(value || 0);
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function normalizeMoneyInput(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    throw new AppError(`${fieldName} é obrigatório.`, 400, "request_error");
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(`${fieldName} deve ser numérico.`, 400, "request_error");
  }

  if (parsed < 0) {
    throw new AppError(`${fieldName} não pode ser negativo.`, 400, "request_error");
  }

  return roundMoney(parsed);
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
    valorInicial: Number(caixa.valorInicial),
    usuarioAbertura: caixa.usuarioAbertura,
  };
}

export async function abrirCaixaService({ usuarioId, valorInicial }) {
  if (!usuarioId) {
    throw new AppError("usuarioId é obrigatório.", 400, "request_error");
  }

  const valorInicialNormalizado = normalizeMoneyInput(valorInicial, "valorInicial");

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, ativo: true },
    select: { id: true, nome: true, perfil: true, email: true },
  });

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", 404, "request_error");
  }

  const caixa = await prisma.$transaction(
    async (tx) => {
      const jaAberto = await tx.caixa.findFirst({
        where: { status: "ABERTO" },
        select: { id: true },
      });

      if (jaAberto) {
        throw new AppError("Já existe um caixa aberto.", 409, "request_error");
      }

      return tx.caixa.create({
        data: {
          usuarioAberturaId: usuarioId,
          valorInicial: valorInicialNormalizado,
          status: "ABERTO",
        },
        include: {
          usuarioAbertura: {
            select: { id: true, nome: true, perfil: true, email: true },
          },
        },
      });
    },
    {
      isolationLevel: "Serializable",
    }
  );

  return {
    id: caixa.id,
    status: caixa.status,
    abertoEm: caixa.abertoEm,
    fechadoEm: caixa.fechadoEm,
    valorInicial: Number(caixa.valorInicial),
    usuarioAbertura: caixa.usuarioAbertura,
  };
}

export async function obterResumoCaixaService({ caixaId }) {
  if (!caixaId || !String(caixaId).trim()) {
    throw new AppError("caixaId é obrigatório.", 400, "request_error");
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
    throw new AppError("Caixa não encontrado.", 404, "request_error");
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
    _sum: { valor: true },
  });

  const pagamentosPorForma = await prisma.pagamento.groupBy({
    by: ["forma"],
    where: { caixaId },
    _sum: { valor: true },
  });

  const porForma = pagamentosPorForma.reduce((acc, item) => {
    acc[item.forma] = roundMoney(item._sum.valor);
    return acc;
  }, {});

  return {
    caixa: {
      id: caixa.id,
      status: caixa.status,
      abertoEm: caixa.abertoEm,
      fechadoEm: caixa.fechadoEm,
      valorInicial: Number(caixa.valorInicial),
    },
    vendas: {
      quantidade: vendasAgg._count.id || 0,
      totalBruto: roundMoney(vendasAgg._sum.totalBruto),
      descontoTotal: roundMoney(vendasAgg._sum.descontoTotal),
      totalLiquido: roundMoney(vendasAgg._sum.totalLiquido),
      pagoNoAto: roundMoney(vendasAgg._sum.pagoNoAto),
      fiadoValor: roundMoney(vendasAgg._sum.fiadoValor),
    },
    pagamentos: {
      quantidade: pagamentosAgg._count.id || 0,
      total: roundMoney(pagamentosAgg._sum.valor),
      porForma,
    },
  };
}

async function calcularConferenciaCaixa({ caixaId, valorInicial, valorInformado }) {
  const pagamentosDinheiroAgg = await prisma.pagamento.aggregate({
    where: {
      caixaId,
      forma: "DINHEIRO",
    },
    _sum: { valor: true },
  });

  const suprimentoAgg = await prisma.caixaMov.aggregate({
    where: {
      caixaId,
      tipo: "SUPRIMENTO",
    },
    _sum: { valor: true },
  });

  const sangriaAgg = await prisma.caixaMov.aggregate({
    where: {
      caixaId,
      tipo: "SANGRIA",
    },
    _sum: { valor: true },
  });

  const totalDinheiroRecebido = roundMoney(pagamentosDinheiroAgg._sum.valor);
  const totalSuprimento = roundMoney(suprimentoAgg._sum.valor);
  const totalSangria = roundMoney(sangriaAgg._sum.valor);

  const valorEsperado = roundMoney(
    Number(valorInicial) + totalDinheiroRecebido + totalSuprimento - totalSangria
  );

  const valorInformadoNormalizado =
    valorInformado === undefined || valorInformado === null
      ? null
      : roundMoney(Number(valorInformado));

  const diferenca =
    valorInformadoNormalizado === null
      ? null
      : roundMoney(valorInformadoNormalizado - valorEsperado);

  const houveDivergencia =
    valorInformadoNormalizado === null ? false : diferenca !== 0;

  return {
    valorEsperado,
    valorInformado: valorInformadoNormalizado,
    diferenca,
    houveDivergencia,
    componentes: {
      valorInicial: roundMoney(valorInicial),
      totalDinheiroRecebido,
      totalSuprimento,
      totalSangria,
    },
  };
}

export async function fecharCaixaService({ usuarioFechamentoId, valorInformado }) {
  if (!usuarioFechamentoId) {
    throw new AppError("usuarioFechamentoId é obrigatório.", 400, "request_error");
  }

  if (
    valorInformado !== undefined &&
    valorInformado !== null &&
    Number.isNaN(Number(valorInformado))
  ) {
    throw new AppError("valorInformado deve ser numérico.", 400, "request_error");
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioFechamentoId, ativo: true },
    select: { id: true, nome: true, perfil: true, email: true },
  });

  if (!usuario) {
    throw new AppError("Usuário de fechamento não encontrado.", 404, "request_error");
  }

  const caixaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
    select: {
      id: true,
      valorInicial: true,
    },
  });

  if (!caixaAberto) {
    throw new AppError("Nenhum caixa aberto no momento.", 409, "conflict");
  }

  // Conferência antes de fechar (para usar dados do caixa aberto)
  const conferencia = await calcularConferenciaCaixa({
    caixaId: caixaAberto.id,
    valorInicial: caixaAberto.valorInicial,
    valorInformado,
  });

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
    valorInicial: Number(fechado.valorInicial),
    usuarioAbertura: fechado.usuarioAbertura,
    usuarioFechamento: fechado.usuarioFechamento,
    resumo,
    conferencia,
  };
}
