import { listProductsService } from "../services/productService.js";

export async function listProducts(req, res, next) {
  try {
    const { search } = req.query;

    const produtos = await listProductsService({ search });

    return res.status(200).json({
      success: true,
      count: produtos.length,
      data: produtos,
    });
  } catch (error) {
    next(error);
  }
}