import { Router } from "express";
import { abrirCaixa, obterCaixaAtual, fecharCaixa } from "../controllers/caixaController.js";

const router = Router();

// POST /api/caixa/open
router.post("/open", abrirCaixa);

// GET /api/caixa/current
router.get("/current", obterCaixaAtual);

// POST /api/caixa/close
router.post("/close", fecharCaixa);

export default router;