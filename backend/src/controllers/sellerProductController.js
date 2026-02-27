import { criarProdutoVendedorService, listarMeusProdutosService, atualizarProdutoService, listarPedidosDoVendedorService } from '../services/sellerService.js';

// Criar produto reaproveitando o codigo do gaabe

export const criarProdutoVendedor = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }
    const produto = await criarProdutoVendedorService(req.body, req.user.id);
    res.status(201).json(produto);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto", details: error.message });
  }
};

//  Listar produtos do vendedor
 
export const listarMeusProdutos = async (req, res) => {
  try {
    const produtos = await listarMeusProdutosService(req.user.id);
    res.json(produtos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar produtos", details: error.message });
  }
};

//  Atualizar produto/estoque do vendedor
 
export const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const atualizado = await atualizarProdutoService(id, req.user.id, req.body);
    res.json(atualizado);
  } catch (error) {
    if (error.message === 'Produto não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Acesso negado') {
      return res.status(403).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar produto", details: error.message });
  }
};


//  Histórico de pedidos dos produtos do vendedor
 
export const listarPedidosDoVendedor = async (req, res) => {
  try {
    const pedidos = await listarPedidosDoVendedorService(req.user.id);
    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar pedidos", details: error.message });
  }
};