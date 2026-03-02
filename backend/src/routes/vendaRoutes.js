import { Router } from "express";
import {
  criarVenda,
  listarVendas,
  obterVendaPorId,
  registrarPagamentoVenda,
} from "../controllers/vendaController.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  criarVendaSchema,
  registrarPagamentoVendaSchema,
} from "../validators/pdvSchemas.js";

const router = Router();

router.get("/", listarVendas);
router.get("/:id", obterVendaPorId);
router.post("/", validate(criarVendaSchema), criarVenda);
router.post(
  "/:id/pagamentos",
  validate(registrarPagamentoVendaSchema),
  registrarPagamentoVenda
);

export default router;
