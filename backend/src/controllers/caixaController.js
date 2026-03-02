import {
  abrirCaixaService,
  obterCaixaAtualService,
  fecharCaixaService,
  obterResumoCaixaService,
} from "../services/caixaService.js";

export async function abrirCaixa(req, res, next) {
  try {
    const { usuarioId, valorInicial } = req.body;

    const caixa = await abrirCaixaService({ usuarioId, valorInicial });

    return res.status(201).json({
      success: true,
      message: "Caixa aberto com sucesso.",
      data: caixa,
    });
  } catch (error) {
    next(error);
  }
}

export async function obterCaixaAtual(req, res, next) {
  try {
    const caixa = await obterCaixaAtualService();

    if (!caixa) {
      return res.status(200).json({
        success: true,
        message: "Nenhum caixa aberto no momento.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Caixa atual obtido com sucesso.",
      data: caixa,
    });
  } catch (error) {
    next(error);
  }
}

export async function fecharCaixa(req, res, next) {
  try {
    const { usuarioFechamentoId, valorInformado } = req.body;

    const caixaFechado = await fecharCaixaService({
      usuarioFechamentoId,
      valorInformado,
    });

    return res.status(200).json({
      success: true,
      message: "Caixa fechado com sucesso.",
      data: caixaFechado,
    });
  } catch (error) {
    next(error);
  }
}

export async function obterResumoCaixa(req, res, next) {
  try {
    const { caixaId } = req.params;

    const resumo = await obterResumoCaixaService({ caixaId });

    return res.status(200).json({
      success: true,
      message: "Resumo do caixa obtido com sucesso.",
      data: resumo,
    });
  } catch (error) {
    next(error);
  }
}