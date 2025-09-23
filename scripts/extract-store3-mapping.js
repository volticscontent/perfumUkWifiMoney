/**
 * Script para extrair apenas os dados da LOJA 3 (SADERSTORE)
 * do backup completo de mapeamento
 */

const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const backupFile = path.join(__dirname, '../data/shopify_variant_mapping.json.backup_1758440559782');
const outputFile = path.join(__dirname, '../data/shopify_variant_mapping_store3_only.json');

console.log('🔄 Extraindo dados da LOJA 3 (SADERSTORE)...');

try {
  // Ler o arquivo de backup
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  
  // Objeto para armazenar apenas dados da loja 3
  const store3Mapping = {};
  
  let totalProducts = 0;
  let store3Products = 0;
  
  // Iterar sobre todos os produtos
  for (const [productHandle, storeData] of Object.entries(backupData)) {
    totalProducts++;
    
    // Verificar se existe dados para a loja 3
    if (storeData['3']) {
      store3Products++;
      
      // Extrair apenas os dados da loja 3
      store3Mapping[productHandle] = {
        product_id: storeData['3'].product_id,
        title: storeData['3'].title,
        variant_ids: storeData['3'].variant_ids,
        primary_variant_id: storeData['3'].primary_variant_id,
        domain: 'ae888e.myshopify.com',
        store_name: 'SADERSTORE (Store 3)'
      };
    }
  }
  
  // Salvar o arquivo apenas com dados da loja 3
  fs.writeFileSync(outputFile, JSON.stringify(store3Mapping, null, 2));
  
  console.log('✅ Extração concluída!');
  console.log(`📊 Estatísticas:`);
  console.log(`   - Total de produtos no backup: ${totalProducts}`);
  console.log(`   - Produtos da loja 3 extraídos: ${store3Products}`);
  console.log(`   - Arquivo salvo em: ${outputFile}`);
  
  // Mostrar alguns exemplos
  const examples = Object.entries(store3Mapping).slice(0, 3);
  console.log(`\n🔍 Exemplos de produtos da loja 3:`);
  examples.forEach(([handle, data]) => {
    console.log(`   - ${handle}: ${data.product_id} (${data.primary_variant_id})`);
  });
  
} catch (error) {
  console.error('❌ Erro ao extrair dados:', error.message);
  process.exit(1);
}