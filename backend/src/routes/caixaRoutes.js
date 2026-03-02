import { Router } from "express";
import {
  abrirCaixa,
  obterCaixaAtual,
  fecharCaixa,
  obterResumoCaixa,
} from "../controllers/caixaController.js";

const router = Router();

router.post("/open", abrirCaixa);
router.get("/current", obterCaixaAtual);
router.post("/close", fecharCaixa);
router.get("/:caixaId/resumo", obterResumoCaixa);

export default router;