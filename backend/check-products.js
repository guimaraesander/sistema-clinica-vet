import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log("🔍 Verificando produtos no banco...");
    
    const produtos = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        price: true
      },
      take: 10 // Apenas os primeiros 10
    });

    console.log(`📦 Total de produtos encontrados: ${produtos.length}`);
    
    if (produtos.length > 0) {
      console.log("\n📋 Produtos disponíveis:");
      produtos.forEach((produto, index) => {
        console.log(`${index + 1}. ID: ${produto.id} | Nome: ${produto.title} | Preço: R$ ${produto.price}`);
      });
    } else {
      console.log("❌ Nenhum produto encontrado no banco de dados");
    }

  } catch (error) {
    console.error("❌ Erro ao verificar produtos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();