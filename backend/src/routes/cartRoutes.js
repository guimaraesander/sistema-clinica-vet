import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  buscarCarrinho,
  adicionarItem,
  atualizarItem,
  removerItem,
} from "../controllers/CartController.js";

const router = express.Router();

// Todas as rotas exigem login
router.use(protect);

// GET /api/cart → Buscar carrinho do usuário logado
router.get("/", buscarCarrinho);

// POST /api/cart → Adicionar item ou somar quantidade
router.post("/", adicionarItem);

// PATCH /api/cart/:itemId → Atualizar quantidade de um item específico
router.patch("/:itemId", atualizarItem);

// DELETE /api/cart/:itemId → Remover item específico do carrinho
router.delete("/:itemId", removerItem);

export default router;

