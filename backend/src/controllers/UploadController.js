export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });
    // Monta URL pública com base na rota estática /uploads
    const relativePath = `/uploads/products/${req.file.filename}`;
    return res.status(201).json({ path: relativePath, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
};
