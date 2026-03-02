import Joi from "joi";

const FORMAS_PAGAMENTO = ["DINHEIRO", "CARTAO", "PIX", "TRANSFERENCIA"];

export const abrirCaixaSchema = Joi.object({
  usuarioId: Joi.string().trim().required(),
  valorInicial: Joi.number().min(0).required(),
});

export const fecharCaixaSchema = Joi.object({
  usuarioFechamentoId: Joi.string().trim().required(),
  valorInformado: Joi.number().min(0).optional(),
});

export const criarVendaSchema = Joi.object({
  usuarioId: Joi.string().trim().required(),
  itens: Joi.array()
    .items(
      Joi.object({
        produtoId: Joi.string().trim().required(),
        quantidade: Joi.number().integer().positive().required(),
      })
    )
    .min(1)
    .required(),
});

export const registrarPagamentoVendaSchema = Joi.object({
  usuarioId: Joi.string().trim().required(),
  forma: Joi.string()
    .trim()
    .uppercase()
    .valid(...FORMAS_PAGAMENTO)
    .required(),
  valor: Joi.number().positive().required(),
});

