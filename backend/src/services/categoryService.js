import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class CategoryService {
  async create({ name }) {
    if (!name) throw new Error("O campo 'name' é obrigatório");
    return prisma.category.create({ data: { name } });
  }

  async listAll() {
    return prisma.category.findMany({ include: { products: true } });
  }

  async getById(id) {
    const category = await prisma.category.findUnique({ where: { id: String(id) }, include: { products: true } });
    if (!category) throw new Error("Categoria não encontrada");
    return category;
  }

  async update(id, { name }) {
    return prisma.category.update({ where: { id: String(id) }, data: { name } });
  }

  async remove(id) {
    return prisma.category.delete({ where: { id: String(id) } });
  }
}

export default new CategoryService();
