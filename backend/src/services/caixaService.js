import prisma from "../config/prisma.js";

export async function abrirCaixaService({ usuarioId, valorInicial }) {
  const valor = Number(valorInicial);

  if (!usuarioId) {
    const err = new Error("usuarioId é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (Number.isNaN(valor) || valor < 0) {
    const err = new Error("valorInicial deve ser um número maior ou igual a 0.");
    err.statusCode = 400;
    throw err;
  }

  // Verifica se já existe caixa aberto
  const caixaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
  });

  if (caixaAberto) {
    const err = new Error("Já existe um caixa aberto.");
    err.statusCode = 409;
    throw err;
  }

  // Confirma usuário
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

  const caixa = await prisma.caixa.create({
    data: {
      usuarioAberturaId: usuarioId,
      valorInicial: valor,
      status: "ABERTO",
    },
    include: {
      usuarioAbertura: {
        select: { id: true, nome: true, perfil: true },
      },
    },
  });

  return {
    id: caixa.id,
    status: caixa.status,
    abertoEm: caixa.abertoEm,
    valorInicial: Number(caixa.valorInicial),
    usuarioAbertura: caixa.usuarioAbertura,
  };
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

  if (!caixa) {
    return null;
  }

  return {
    id: caixa.id,
    status: caixa.status,
    abertoEm: caixa.abertoEm,
    fechadoEm: caixa.fechadoEm,
    valorInicial: Number(caixa.valorInicial),
    usuarioAbertura: caixa.usuarioAbertura,
  };
}

export async function fecharCaixaService({ usuarioFechamentoId }) {
  if (!usuarioFechamentoId) {
    const err = new Error("usuarioFechamentoId é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  const caixaAberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
  });

  if (!caixaAberto) {
    const err = new Error("Não existe caixa aberto para fechamento.");
    err.statusCode = 409;
    throw err;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioFechamentoId },
    select: { id: true, nome: true, perfil: true, ativo: true },
  });

  if (!usuario) {
    const err = new Error("Usuário de fechamento não encontrado.");
    err.statusCode = 404;
    throw err;
  }

  if (!usuario.ativo) {
    const err = new Error("Usuário de fechamento está inativo.");
    err.statusCode = 400;
    throw err;
  }

  const caixaFechado = await prisma.caixa.update({
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

  return {
    id: caixaFechado.id,
    status: caixaFechado.status,
    abertoEm: caixaFechado.abertoEm,
    fechadoEm: caixaFechado.fechadoEm,
    valorInicial: Number(caixaFechado.valorInicial),
    usuarioAbertura: caixaFechado.usuarioAbertura,
    usuarioFechamento: caixaFechado.usuarioFechamento,
  };
}