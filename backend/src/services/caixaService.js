import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

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

  if (valorInicial === undefined || valorInicial === null) {
    throw new AppError("valorInicial é obrigatório.", 400, "request_error");
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, ativo: true },
    select: { id: true, nome: true, perfil: true, email: true },
  });

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", 404, "request_error");
  }

  const jaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    select: { id: true },
  });

  if (jaAberto) {
    throw new AppError("Já existe um caixa aberto.", 409, "request_error");
  }

  const caixa = await prisma.caixa.create({
    data: {
      usuarioAberturaId: usuarioId,
      valorInicial: Number(valorInicial),
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
    valorInicial: Number(caixa.valorInicial),
    usuarioAbertura: caixa.usuarioAbertura,
  };
}

export async function obterResumoCaixaService({ caixaId }) {
  if (!caixaId) {
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
    },
  });

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
      totalBruto: Number(vendasAgg._sum.totalBruto || 0),
      descontoTotal: Number(vendasAgg._sum.descontoTotal || 0),
      totalLiquido: Number(vendasAgg._sum.totalLiquido || 0),
    },
  };
}

export async function fecharCaixaService({ usuarioFechamentoId }) {
  if (!usuarioFechamentoId) {
    throw new AppError("usuarioFechamentoId é obrigatório.", 400, "request_error");
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
    select: { id: true },
  });

  if (!caixaAberto) {
    throw new AppError("Nenhum caixa aberto no momento.", 409, "request_error");
  }

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
  };
}