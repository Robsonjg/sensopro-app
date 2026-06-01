import { createExperimento, createAmostra, createAtributo, ativarExperimento, desativarExperimento, listExperimentos } from "../server/db";

const OWNER_ID = 1; // Assumindo que o usuário admin tem ID 1

async function seedCarnes() {
  console.log("🥩 Iniciando seed de Análise de Carnes...");

  try {
    // Desativar experimentos anteriores
    const exps = await listExperimentos();
    for (const exp of exps) {
      if (exp.ativo) {
        await desativarExperimento(exp.id);
      }
    }

    // Criar experimento
    const expId = await createExperimento({
      titulo: "Análise Sensorial de Carnes",
      descricao:
        "Avaliação sensorial de diferentes tipos de carnes. Sinta o aroma, prove e avalie cada amostra.",
      slug: "analise-sensorial-de-carnes",
      criadoPor: OWNER_ID,
    });
    console.log(`✓ Experimento criado: ID ${expId}`);

    // Criar amostras
    const amostras = [
      { codigo: "CAR001", nome: "Carne Bovina - Alcatra", descricao: "Corte premium de carne bovina" },
      { codigo: "CAR002", nome: "Carne Suína - Lombo", descricao: "Corte nobre de carne suína" },
      { codigo: "CAR003", nome: "Carne de Frango - Peito", descricao: "Peito de frango de qualidade" },
      { codigo: "CAR004", nome: "Carne de Cordeiro - Costela", descricao: "Costela macia de cordeiro" },
    ];

    for (let i = 0; i < amostras.length; i++) {
      await createAmostra({
        experimentoId: expId,
        codigo: amostras[i].codigo,
        nome: amostras[i].nome,
        descricao: amostras[i].descricao,
        ordem: i,
      });
    }
    console.log(`✓ ${amostras.length} amostras criadas`);

    // Criar atributos
    const atributos = [
      {
        nome: "Aroma",
        descricao: "Intensidade e qualidade do aroma",
        labelMin: "Fraco",
        labelMax: "Intenso",
      },
      {
        nome: "Cor",
        descricao: "Aparência visual da carne",
        labelMin: "Pálida",
        labelMax: "Vibrante",
      },
      {
        nome: "Textura",
        descricao: "Maciez e fibra da carne",
        labelMin: "Dura",
        labelMax: "Macia",
      },
      {
        nome: "Suculência",
        descricao: "Umidade e suculência",
        labelMin: "Seca",
        labelMax: "Suculenta",
      },
      {
        nome: "Sabor",
        descricao: "Intensidade e qualidade do sabor",
        labelMin: "Suave",
        labelMax: "Intenso",
      },
      {
        nome: "Maciez",
        descricao: "Facilidade de mastigação",
        labelMin: "Difícil",
        labelMax: "Fácil",
      },
    ];

    for (let i = 0; i < atributos.length; i++) {
      await createAtributo({
        experimentoId: expId,
        nome: atributos[i].nome,
        descricao: atributos[i].descricao,
        labelMin: atributos[i].labelMin,
        labelMax: atributos[i].labelMax,
        ordem: i,
      });
    }
    console.log(`✓ ${atributos.length} atributos criados`);

    // Ativar experimento
    await ativarExperimento(expId);
    console.log(`✓ Experimento ativado!`);

    console.log("\n✅ Seed concluído com sucesso!");
    console.log(`\n📋 Experimento ID: ${expId}`);
    console.log("🔗 Link de avaliação: /avaliar/analise-sensorial-de-carnes");
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  }
}

await seedCarnes();
process.exit(0);
