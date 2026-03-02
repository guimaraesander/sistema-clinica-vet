import { Router } from "express";
import {
  criarVenda,
  listarVendas,
  obterVendaPorId,
  registrarPagamentoVenda,
} from "../controllers/vendaController.js";

const router = Router();

router.get("/", listarVendas);
router.get("/:id", obterVendaPorId);
router.post("/", criarVenda);
router.post("/:id/pagamentos", registrarPagamentoVenda);

export default router;