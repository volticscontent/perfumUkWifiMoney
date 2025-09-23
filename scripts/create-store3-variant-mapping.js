/**
 * Script para criar mapeamento simplificado handle -> variant_id
 * apenas para a LOJA 3 (SADERSTORE)
 */

const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const store3File = path.join(__dirname, '../data/shopify_variant_mapping_store3_only.json');
const outputFile = path.join(__dirname, '../data/shopify_variant_mapping_store3_simple.json');

console.log('🔄 Criando mapeamento simplificado para LOJA 3...');

try {
  // Ler os dados da loja 3
  const store3Data = JSON.parse(fs.readFileSync(store3File, 'utf8'));
  
  // Objeto para mapeamento simplificado
  const simpleMapping = {};
  
  let processedProducts = 0;
  
  // Iterar sobre todos os produtos da loja 3
  for (const [productHandle, productData] of Object.entries(store3Data)) {
    processedProducts++;
    
    // Usar o primary_variant_id como valor principal
    simpleMapping[productHandle] = productData.primary_variant_id;
  }
  
  // Salvar o mapeamento simplificado
  fs.writeFileSync(outputFile, JSON.stringify(simpleMapping, null, 2));
  
  console.log('✅ Mapeamento simplificado criado!');
  console.log(`📊 Estatísticas:`);
  console.log(`   - Produtos processados: ${processedProducts}`);
  console.log(`   - Arquivo salvo em: ${outputFile}`);
  
  // Mostrar alguns exemplos
  const examples = Object.entries(simpleMapping).slice(0, 5);
  console.log(`\n🔍 Exemplos de mapeamento simplificado:`);
  examples.forEach(([handle, variantId]) => {
    console.log(`   - ${handle}: ${variantId}`);
  });
  
  console.log(`\n🎯 Este arquivo pode ser usado como shopify_variant_mapping.json`);
  console.log(`   para usar apenas a loja 3 (SADERSTORE)`);
  
} catch (error) {
  console.error('❌ Erro ao criar mapeamento:', error.message);
  process.exit(1);
}