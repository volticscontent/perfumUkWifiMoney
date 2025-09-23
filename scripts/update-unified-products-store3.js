/**
 * Script para atualizar produtos unificados para usar apenas LOJA 3 (SADERSTORE)
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Atualizando produtos unificados para LOJA 3 (SADERSTORE)...\n');

// Caminhos dos arquivos
const currentFile = path.join(__dirname, '../data/unified_products_en_gbp.json');
const backupFile = path.join(__dirname, '../data/unified_products_en_gbp.json.backup_before_cleanup');
const store3MappingFile = path.join(__dirname, '../data/shopify_variant_mapping_store3_only.json');

try {
  // 1. Ler o backup que contém dados de todas as lojas
  console.log('📖 Lendo backup com dados completos...');
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  
  // 2. Ler o mapeamento da loja 3
  console.log('📖 Lendo mapeamento da loja 3...');
  const store3Mapping = JSON.parse(fs.readFileSync(store3MappingFile, 'utf8'));
  
  // 3. Atualizar produtos para usar apenas loja 3
  console.log('🔧 Atualizando produtos...');
  let updatedProducts = 0;
  let skippedProducts = 0;
  
  const updatedData = {
    ...backupData,
    products: backupData.products.map(product => {
      // Verificar se o produto tem mapeamento para loja 3
      if (product.shopify_mapping && product.shopify_mapping['3']) {
        updatedProducts++;
        
        // Manter apenas o mapeamento da loja 3
        return {
          ...product,
          shopify_mapping: {
            "3": product.shopify_mapping['3']
          }
        };
      } else {
        skippedProducts++;
        console.log(`⚠️  Produto sem mapeamento loja 3: ${product.handle}`);
        
        // Tentar encontrar no mapeamento simplificado
        const variantId = store3Mapping[product.handle];
        if (variantId) {
          console.log(`✅ Encontrado no mapeamento: ${product.handle} -> ${variantId}`);
          
          return {
            ...product,
            shopify_mapping: {
              "3": {
                product_id: "unknown", // Será necessário obter via API
                handle: product.handle,
                domain: "ae888e.myshopify.com",
                store_name: "SADERSTORE (Store 3)",
                sku: product.sku,
                primary_variant_id: variantId
              }
            }
          };
        }
        
        // Se não encontrar, manter o produto mas sem shopify_mapping
        return {
          ...product,
          shopify_mapping: {}
        };
      }
    })
  };
  
  // 4. Salvar arquivo atualizado
  console.log('💾 Salvando arquivo atualizado...');
  fs.writeFileSync(currentFile, JSON.stringify(updatedData, null, 2));
  
  console.log('✅ Atualização concluída!');
  console.log(`📊 Estatísticas:`);
  console.log(`   - Produtos atualizados: ${updatedProducts}`);
  console.log(`   - Produtos sem mapeamento: ${skippedProducts}`);
  console.log(`   - Total de produtos: ${updatedData.products.length}`);
  
  console.log(`\n🎯 Arquivo unified_products_en_gbp.json atualizado para usar apenas LOJA 3!`);
  
} catch (error) {
  console.error('❌ Erro ao atualizar produtos:', error.message);
  process.exit(1);
}