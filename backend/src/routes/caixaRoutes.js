import { Router } from "express";
import {
  abrirCaixa,
  obterCaixaAtual,
  fecharCaixa,
  obterResumoCaixa,
} from "../controllers/caixaController.js";
import { validate } from "../middleware/validateMiddleware.js";
import { abrirCaixaSchema, fecharCaixaSchema } from "../validators/pdvSchemas.js";

const router = Router();

router.post("/open", validate(abrirCaixaSchema), abrirCaixa);
router.get("/current", obterCaixaAtual);
router.post("/close", validate(fecharCaixaSchema), fecharCaixa);
router.get("/:caixaId/resumo", obterResumoCaixa);

export default router;
