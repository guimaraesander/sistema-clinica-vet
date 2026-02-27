import express from "express";
import {
  criarPedido,
  atualizarStatusPedido,
  listarMeusPedidos,
  listarTodosPedidos,
  listarPedidosDoVendedor,
  cancelarPedido,
  obterPedidoPorId,
  confirmarPagamento,
  obterMetricasAdmin,
  obterMetricasVendedor,
  cancelarPedidoVendedor
} from "../controllers/OrderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { createOrderSchema } from "../validators/orderSchemas.js";
import { listOrdersQuery, listSellerOrdersQuery } from "../validators/orderQuerySchemas.js";

const router = express.Router();

router.use(protect);  // todas rotas exigem usuário autenticado

// Usuário vê seus pedidos
router.get("/", listarMeusPedidos);

// Vendedor vê pedidos que contenham seus produtos (com paginação e filtros)
router.get("/seller-orders", authorize("vendedor", "admin"), validate(listSellerOrdersQuery), listarPedidosDoVendedor);

// Admin vê todos pedidos (rota distinta para não conflitar com listarMeusPedidos)
router.get("/all", authorize("admin"), listarTodosPedidos);

// Métricas
router.get("/metrics/admin", authorize("admin"), obterMetricasAdmin);
router.get("/metrics/seller", authorize("vendedor", "admin"), obterMetricasVendedor);
// Alias para evitar qualquer conflito de matching
router.get("/seller/metrics", authorize("vendedor", "admin"), obterMetricasVendedor);

// Criar pedido
router.post("/", criarPedido);

// Cancelar pedido (cliente proprietário ou admin)
router.patch("/:id/cancel", cancelarPedido); // vini 
router.delete("/:id/cancel", cancelarPedido);

// Cancelar pedido (vendedor) — só se todos os itens forem dele
router.patch("/:id/seller-cancel", authorize("vendedor"), cancelarPedidoVendedor);
router.post("/:id/seller-cancel", authorize("vendedor"), cancelarPedidoVendedor);

// Admin atualiza pedido parcialmente (status)
router.patch("/:id", authorize("admin"), atualizarStatusPedido); // PATCH indica atualização parcial

// Confirmar pagamento (admin)
router.post("/:id/confirm-payment", authorize("admin"), confirmarPagamento);

// Usuário (ou admin) vê um pedido específico (deve vir por último para não capturar rotas específicas)
router.get("/:id", obterPedidoPorId);

export default router;
