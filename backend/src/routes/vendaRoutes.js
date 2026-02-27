import { Router } from "express";
import {
  criarVenda,
  listarVendas,
  obterVendaPorId,
} from "../controllers/vendaController.js";

const router = Router();

router.get("/", listarVendas);
router.get("/:id", obterVendaPorId);
router.post("/", criarVenda);

export default router;