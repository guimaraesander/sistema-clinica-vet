import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed da clínica...");

  // --- Usuários (senhas temporárias) ---
  const senhaAdmin = await bcrypt.hash("Admin123", 10);
  const senhaCaixa = await bcrypt.hash("Caixa123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@clinicavet.local" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@clinicavet.local",
      senhaHash: senhaAdmin,
      perfil: "ADMIN",
      ativo: true,
    },
  });

  const caixa = await prisma.usuario.upsert({
    where: { email: "caixa@clinicavet.local" },
    update: {},
    create: {
      nome: "Operador de Caixa",
      email: "caixa@clinicavet.local",
      senhaHash: senhaCaixa,
      perfil: "CAIXA",
      ativo: true,
    },
  });

  console.log("✅ Usuários criados:", {
    admin: admin.email,
    caixa: caixa.email,
  });

  // --- Produtos de teste ---
  const produtosSeed = [
    {
      codigo: "7891000000011",
      nome: "Ração Premium Cães 1kg",
      categoria: "Ração",
      precoVenda: "35.90",
      custo: "24.00",
      estoqueMin: 5,
      quantidadeInicial: 20,
    },
    {
      codigo: "7891000000012",
      nome: "Ração Gatos Castrados 1kg",
      categoria: "Ração",
      precoVenda: "39.90",
      custo: "27.50",
      estoqueMin: 5,
      quantidadeInicial: 15,
    },
    {
      codigo: "7891000000013",
      nome: "Shampoo Veterinário 500ml",
      categoria: "Higiene",
      precoVenda: "28.50",
      custo: "16.90",
      estoqueMin: 3,
      quantidadeInicial: 10,
    },
    {
      codigo: "7891000000014",
      nome: "Antipulgas Spot-On",
      categoria: "Medicamentos",
      precoVenda: "54.90",
      custo: "39.00",
      estoqueMin: 2,
      quantidadeInicial: 8,
    },
    {
      codigo: "7891000000015",
      nome: "Petisco Dental",
      categoria: "Petiscos",
      precoVenda: "18.90",
      custo: "9.80",
      estoqueMin: 4,
      quantidadeInicial: 25,
    },
  ];

  for (const p of produtosSeed) {
    const produto = await prisma.produto.upsert({
      where: { codigo: p.codigo },
      update: {
        nome: p.nome,
        categoria: p.categoria,
        precoVenda: p.precoVenda,
        custo: p.custo,
        estoqueMin: p.estoqueMin,
        ativo: true,
      },
      create: {
        codigo: p.codigo,
        nome: p.nome,
        categoria: p.categoria,
        precoVenda: p.precoVenda,
        custo: p.custo,
        estoqueMin: p.estoqueMin,
        ativo: true,
      },
    });

    // Cria/garante saldo inicial (sem sobrescrever se já existir)
    await prisma.estoqueSaldo.upsert({
      where: { produtoId: produto.id },
      update: {},
      create: {
        produtoId: produto.id,
        quantidade: p.quantidadeInicial,
      },
    });

    // Registra movimentação inicial (uma vez por produto)
    const existeMov = await prisma.estoqueMov.findFirst({
      where: {
        produtoId: produto.id,
        origem: "MANUAL",
        obs: "Seed inicial",
      },
    });

    if (!existeMov) {
      await prisma.estoqueMov.create({
        data: {
          produtoId: produto.id,
          tipo: "ENTRADA",
          origem: "MANUAL",
          qtd: p.quantidadeInicial,
          usuarioId: admin.id,
          obs: "Seed inicial",
        },
      });
    }
  }

  console.log("✅ Produtos e estoque inicial criados.");

  console.log("\n🔑 Usuários de teste:");
  console.log("ADMIN  -> admin@clinicavet.local / Admin123");
  console.log("CAIXA  -> caixa@clinicavet.local / Caixa123");
}

main()
  .then(async () => {
    console.log("🌱 Seed finalizado com sucesso.");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro no seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });