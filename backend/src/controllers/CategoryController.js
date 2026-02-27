import categoryService from "../services/categoryService.js";

// Criar categoria
export const criarCategoria = async (req, res) => {
  try {
    const { name } = req.body;

    const categoria = await categoryService.create({ name });

    res.status(201).json(categoria);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Listar todas as categorias
export const listarCategorias = async (req, res) => {
  try {
    const categorias = await categoryService.listAll();
    res.json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
};

// Buscar categoria por ID
export const buscarCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await categoryService.getById(id);

    res.json(categoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar categoria" });
  }
};

// Atualizar categoria
export const atualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const categoria = await categoryService.update(id, { name });

    res.json(categoria);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Deletar categoria
export const deletarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    await categoryService.remove(id);

    res.json({ message: "Categoria deletada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Listar todos os produtos de uma categoria
export const listarProdutosDaCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await categoryService.getById(id);
    res.json(categoria.products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos da categoria" });
  }
};