import {
  criarVendaService,
  listarVendasService,
  obterVendaPorIdService,
  registrarPagamentoVendaService,
} from "../services/vendaService.js";

export async function criarVenda(req, res, next) {
  try {
    const { usuarioId, itens } = req.body;

    const venda = await criarVendaService({ usuarioId, itens });

    return res.status(201).json({
      success: true,
      message: "Venda criada com sucesso.",
      data: venda,
    });
  } catch (error) {
    next(error);
  }
}

export async function listarVendas(req, res, next) {
  try {
    const vendas = await listarVendasService();

    return res.status(200).json({
      success: true,
      message: "Vendas listadas com sucesso.",
      count: vendas.length,
      data: vendas,
    });
  } catch (error) {
    next(error);
  }
}

export async function obterVendaPorId(req, res, next) {
  try {
    const { id } = req.params;

    const venda = await obterVendaPorIdService(id);

    return res.status(200).json({
      success: true,
      message: "Venda obtida com sucesso.",
      data: venda,
    });
  } catch (error) {
    next(error);
  }
}

export async function registrarPagamentoVenda(req, res, next) {
  try {
    const { id } = req.params;
    const { usuarioId, forma, valor } = req.body;

    const resultado = await registrarPagamentoVendaService({
      vendaId: id,
      usuarioId,
      forma,
      valor,
    });

    return res.status(201).json({
      success: true,
      message: "Pagamento registrado com sucesso.",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}