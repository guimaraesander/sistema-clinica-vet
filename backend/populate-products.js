import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function populateProducts() {
  try {
    console.log("🚀 Iniciando população do banco com produtos...");

    // Ler o arquivo products.json
    const jsonPath = path.resolve("seeds/products.json");
    const jsonData = fs.readFileSync(jsonPath, "utf8");
    const products = JSON.parse(jsonData);

    console.log(`📦 ${products.length} produtos encontrados no JSON`);

    // Primeiro, vamos garantir que existe pelo menos uma categoria
    let defaultCategory = await prisma.category.findFirst({
      where: { name: "Eletrônicos" }
    });

    if (!defaultCategory) {
      console.log("📁 Criando categoria padrão...");
      defaultCategory = await prisma.category.create({
        data: { name: "Eletrônicos" }
      });
    }

    // Vamos precisar de um usuário vendedor para associar os produtos
    let vendedor = await prisma.user.findFirst({
      where: { role: "vendedor" }
    });

    if (!vendedor) {
      console.log("👤 Criando usuário vendedor padrão...");
      vendedor = await prisma.user.create({
        data: {
          email: "vendedor@exemplo.com",
          name: "Vendedor Padrão",
          password: "$2a$12$hashedpassword", // Password hash fictício
          role: "vendedor"
        }
      });
    }

    // Mapear categorias do JSON para criar no banco se não existirem
    const categoriesMap = new Map();
    categoriesMap.set("default", defaultCategory.id);

    for (const product of products) {
      const categoryName = product.category || "Eletrônicos";
      
      if (!categoriesMap.has(categoryName)) {
        let category = await prisma.category.findFirst({
          where: { name: categoryName }
        });

        if (!category) {
          console.log(`📁 Criando categoria: ${categoryName}`);
          category = await prisma.category.create({
            data: { name: categoryName }
          });
        }
        categoriesMap.set(categoryName, category.id);
      }
    }

    // Inserir produtos no banco
    let count = 0;
    for (const productData of products) {
      try {
        const categoryId = categoriesMap.get(productData.category) || defaultCategory.id;
        
        // Verificar se o produto já existe (baseado no nome)
        const existingProduct = await prisma.product.findFirst({
          where: { title: productData.name }
        });

        if (existingProduct) {
          console.log(`⏭️ Produto já existe: ${productData.name}`);
          continue;
        }

        const newProduct = await prisma.product.create({
          data: {
            title: productData.name,
            description: productData.description || `Descrição do produto ${productData.name}`,
            price: productData.price, // Preço original
            priceDiscount: productData.priceDiscount || null, // Preço com desconto
            stock: productData.inStock ? 10 : 0, // Estoque padrão
            images: productData.image ? [productData.image] : ["/images/404.png"],
            brand: productData.brand || "Marca", // Marca do produto
            rating: productData.rating || 4.0, // Rating do produto
            tagValue: productData.tagValue || null, // Tag de desconto
            sellerId: vendedor.id,
            categoryId: categoryId
          }
        });

        count++;
        console.log(`✅ ${count}. Produto criado: ${newProduct.title} (ID: ${newProduct.id})`);

      } catch (error) {
        console.error(`❌ Erro ao criar produto ${productData.name}:`, error.message);
      }
    }

    console.log(`🎉 População concluída! ${count} produtos foram adicionados ao banco.`);

  } catch (error) {
    console.error("❌ Erro durante a população:", error);
  } finally {
    await prisma.$disconnect();
  }
}

populateProducts();