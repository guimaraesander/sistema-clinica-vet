import { Router } from "express";
import { listProducts } from "../controllers/ProductController.js";

const router = Router();

// GET /api/products?search=racao
router.get("/", listProducts);

export default router;