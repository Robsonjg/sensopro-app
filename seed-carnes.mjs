import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';
import bcrypt from 'bcrypt';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local manualmente
config({ path: join(__dirname, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('📁 Diretório:', __dirname);
console.log('🔍 DATABASE_URL carregada?', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

async function seedCarnes() {
  console.log("\n🥩 Iniciando seed de Análise de Carnes...\n");

  try {
    // Verificar se já existe admin
    let admins = await sql`SELECT id FROM admins LIMIT 1`;
    let adminId;
    
    if (admins.length === 0) {
      console.log("📝 Criando admin padrão...");
      const hash = await bcrypt.hash('admin123', 10);
      const newAdmin = await sql`
        INSERT INTO admins (email, "senhaHash", nome, ativo)
        VALUES ('admin@exemplo.com', ${hash}, 'Administrador', true)
        RETURNING id
      `;
      adminId = newAdmin[0].id;
      console.log(`✅ Admin criado com ID: ${adminId}`);
      console.log(`   Email: admin@exemplo.com`);
      console.log(`   Senha: admin123`);
    } else {
      adminId = admins[0].id;
      console.log(`✅ Admin existente com ID: ${adminId}`);
    }

    // Desativar experimentos anteriores
    console.log("\n🔄 Desativando experimentos antigos...");
    await sql`UPDATE experimentos SET ativo = false WHERE ativo = true`;
    console.log("✅ Experimentos antigos desativados");

    // Verificar se o experimento já existe
    const existingExp = await sql`
      SELECT id FROM experimentos WHERE slug = 'analise-sensorial-de-carnes'
    `;
    
    let expId;
    if (existingExp.length > 0) {
      expId = existingExp[0].id;
      console.log(`\n📋 Experimento já existe, ID: ${expId}`);
      console.log("🔄 Recriando dados do experimento...");
      // Limpar dados antigos
      await sql`DELETE FROM respostas WHERE sessao_id IN (SELECT id FROM sessoes WHERE experimento_id = ${expId})`;
      await sql`DELETE FROM sessoes WHERE experimento_id = ${expId}`;
      await sql`DELETE FROM amostras WHERE experimento_id = ${expId}`;
      await sql`DELETE FROM atributos WHERE experimento_id = ${expId}`;
      await sql`DELETE FROM experimentos WHERE id = ${expId}`;
    }

    // Criar experimento - USANDO O NOME CORRETO DA COLUNA (adminId)
    console.log("\n📝 Criando experimento...");
    const newExp = await sql`
      INSERT INTO experimentos ("adminId", titulo, descricao, slug, ativo, "criadoPor", criadoEm)
      VALUES (
        ${adminId},
        'Análise Sensorial de Carnes',
        'Avaliação sensorial de diferentes tipos de carnes. Sinta o aroma, prove e avalie cada amostra.',
        'analise-sensorial-de-carnes',
        true,
        ${adminId},
        NOW()
      )
      RETURNING id
    `;
    expId = newExp[0].id;
    console.log(`✓ Experimento criado: ID ${expId}`);

    // Criar amostras - USANDO O NOME CORRETO DA COLUNA (experimentoId)
    console.log("\n🍖 Criando amostras...");
    const amostras = [
      { codigo: "CAR001", nome: "Carne Bovina - Alcatra", descricao: "Corte premium de carne bovina", ordem: 0 },
      { codigo: "CAR002", nome: "Carne Suína - Lombo", descricao: "Corte nobre de carne suína", ordem: 1 },
      { codigo: "CAR003", nome: "Carne de Frango - Peito", descricao: "Peito de frango de qualidade", ordem: 2 },
      { codigo: "CAR004", nome: "Carne de Cordeiro - Costela", descricao: "Costela macia de cordeiro", ordem: 3 },
    ];

    for (const amostra of amostras) {
      await sql`
        INSERT INTO amostras ("experimentoId", codigo, nome, descricao, ordem, "criadoEm")
        VALUES (${expId}, ${amostra.codigo}, ${amostra.nome}, ${amostra.descricao}, ${amostra.ordem}, NOW())
      `;
      console.log(`   ✓ ${amostra.nome} (${amostra.codigo})`);
    }
    console.log(`✓ Total: ${amostras.length} amostras criadas`);

    // Criar atributos - USANDO O NOME CORRETO DA COLUNA (experimentoId)
    console.log("\n📊 Criando atributos...");
    const atributos = [
      { nome: "Aroma", descricao: "Intensidade e qualidade do aroma", labelMin: "Fraco", labelMax: "Intenso", ordem: 0 },
      { nome: "Cor", descricao: "Aparência visual da carne", labelMin: "Pálida", labelMax: "Vibrante", ordem: 1 },
      { nome: "Textura", descricao: "Maciez e fibra da carne", labelMin: "Dura", labelMax: "Macia", ordem: 2 },
      { nome: "Suculência", descricao: "Umidade e suculência", labelMin: "Seca", labelMax: "Suculenta", ordem: 3 },
      { nome: "Sabor", descricao: "Intensidade e qualidade do sabor", labelMin: "Suave", labelMax: "Intenso", ordem: 4 },
      { nome: "Maciez", descricao: "Facilidade de mastigação", labelMin: "Difícil", labelMax: "Fácil", ordem: 5 },
    ];

    for (const atributo of atributos) {
      await sql`
        INSERT INTO atributos ("experimentoId", nome, descricao, "labelMin", "labelMax", ordem, "criadoEm")
        VALUES (${expId}, ${atributo.nome}, ${atributo.descricao}, ${atributo.labelMin}, ${atributo.labelMax}, ${atributo.ordem}, NOW())
      `;
      console.log(`   ✓ ${atributo.nome} (${atributo.labelMin} → ${atributo.labelMax})`);
    }
    console.log(`✓ Total: ${atributos.length} atributos criados`);

    // Ativar experimento
    await sql`UPDATE experimentos SET ativo = true WHERE id = ${expId}`;
    console.log(`✓ Experimento ativado!`);

    console.log("\n✅ Seed concluído com sucesso!");
    console.log(`\n📋 Experimento ID: ${expId}`);
    console.log("🔗 Link de avaliação: http://localhost:3000/avaliar/analise-sensorial-de-carnes");
    
    // Mostrar resumo
    const amostrasCount = await sql`SELECT COUNT(*) FROM amostras WHERE "experimentoId" = ${expId}`;
    const atributosCount = await sql`SELECT COUNT(*) FROM atributos WHERE "experimentoId" = ${expId}`;
    console.log(`\n📊 Resumo do experimento:`);
    console.log(`   - ${amostrasCount[0].count} amostras`);
    console.log(`   - ${atributosCount[0].count} atributos`);
    console.log(`   - Status: Ativo`);
    
  } catch (error) {
    console.error("\n❌ Erro ao executar seed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Executar o seed
seedCarnes()
  .then(() => {
    console.log("\n🎉 Seed finalizado! Pressione Ctrl+C para sair.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });