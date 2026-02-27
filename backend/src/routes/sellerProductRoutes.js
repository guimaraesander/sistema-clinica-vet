import { Router } from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import * as sellerProductController from "../controllers/sellerProductController.js";

const router = Router();

// Rotas protegidas por login + role vendedor
router.use(protect);
router.use(authorize("vendedor"));

// Criar produto
router.post("/products", sellerProductController.criarProdutoVendedor);

// Listar produtos do vendedor
router.get("/products", sellerProductController.listarMeusProdutos);

// Atualizar produto/estoque
router.patch("/products/:id", sellerProductController.atualizarProduto);

// Histórico de pedidos dos produtos do vendedor
router.get("/orders", sellerProductController.listarPedidosDoVendedor);

export default router;