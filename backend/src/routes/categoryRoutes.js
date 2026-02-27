import express from "express";
import * as CategoryController from "../controllers/CategoryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rotas públicas
router.get("/", CategoryController.listarCategorias);
router.get("/:id", CategoryController.buscarCategoriaPorId);
router.get("/:id/products", CategoryController.listarProdutosDaCategoria);

// Rotas protegidas (apenas admin pode gerenciar categorias)
router.post("/", protect, authorize("admin"), CategoryController.criarCategoria);
router.put("/:id", protect, authorize("admin"), CategoryController.atualizarCategoria);
router.delete("/:id", protect, authorize("admin"), CategoryController.deletarCategoria);

export default router;
