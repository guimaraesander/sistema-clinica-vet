import cartService from "../services/cartService.js";

/**
 * Buscar carrinho do usuário logado
 */
export const buscarCarrinho = async (req, res) => {
  try {
    const carrinho = await cartService.getUserCart(req.user.id);

    if (!carrinho) {
      return res.json({ items: [] }); // carrinho vazio
    }

    res.json(carrinho);
  } catch (error) {
    const status = error?.statusCode || 500;
    const code = error?.code || "internal_error";
    console.error("[buscarCarrinho] erro:", { status, code, message: error?.message });
    res.status(status).json({ error: "Erro ao buscar carrinho", details: error.message, code });
  }
};

/**
 * Adicionar item ao carrinho
 */
export const adicionarItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    await cartService.addItem(req.user.id, { productId, quantity });
    const updated = await cartService.getUserCart(req.user.id);
    res.status(201).json(updated);
  } catch (error) {
    const status = error?.statusCode || 500;
    const code = error?.code || "internal_error";
    console.error("[adicionarItem] erro:", { status, code, message: error?.message });
    res.status(status).json({ error: "Erro ao adicionar item", details: error.message, code });
  }
};

/**
 * Atualizar quantidade de um item
 */
export const atualizarItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (quantity === 0) {
      await cartService.removeItem(req.user.id, itemId);
      return res.json({ message: "Item removido do carrinho com sucesso." });
    }
    const updated = await cartService.updateItem(req.user.id, itemId, quantity);
    res.json(updated);
  } catch (error) {
    const status = error?.statusCode || 500;
    const code = error?.code || "internal_error";
    console.error("[atualizarItem] erro:", { status, code, message: error?.message });
    res.status(status).json({ error: "Erro ao atualizar item", details: error.message, code });
  }
};


/**
 * Remover item do carrinho
 */
export const removerItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await cartService.removeItem(req.user.id, itemId);
    res.json({ message: "Item removido com sucesso" });
  } catch (error) {
    const status = error?.statusCode || 500;
    const code = error?.code || "internal_error";
    console.error("[removerItem] erro:", { status, code, message: error?.message });
    res.status(status).json({ error: "Erro ao remover item", details: error.message, code });
  }
};
