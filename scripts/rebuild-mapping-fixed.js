const fs = require('fs');
const path = require('path');

// Carregar dados
const unifiedProductsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
const variantsCompletePath = path.join(__dirname, '..', 'data', 'shopify_variants_complete.json');
const mappingPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping.json');

console.log('🔄 Carregando arquivos...');

const unifiedProducts = JSON.parse(fs.readFileSync(unifiedProductsPath, 'utf8'));
const variantsComplete = JSON.parse(fs.readFileSync(variantsCompletePath, 'utf8'));

console.log(`📊 Produtos unificados: ${unifiedProducts.products.length}`);
console.log(`📊 Variants completos: ${variantsComplete.total_variants}`);

// Criar mapeamento simples handle -> variant_id
const simpleMapping = {};

// Para cada produto unificado, encontrar o variant ID correspondente
unifiedProducts.products.forEach(product => {
  if (product.handle && product.handle.startsWith('3-piece-premium-fragrance-collection-set-')) {
    // Procurar variant correspondente
    const matchingVariant = variantsComplete.variants.find(variant => {
      // Tentar match por productTitle primeiro
      if (variant.productTitle === product.handle) {
        return true;
      }
      // Tentar match por productHandle
      if (variant.productHandle === product.handle) {
        return true;
      }
      // Tentar match por número do produto
      const productNumber = product.handle.replace('3-piece-premium-fragrance-collection-set-', '');
      const variantTitleNumber = variant.productTitle ? variant.productTitle.replace('3-piece-premium-fragrance-collection-set-', '') : '';
      const variantHandleNumber = variant.productHandle ? variant.productHandle.replace('3-piece-premium-fragrance-collection-set-', '') : '';
      
      return productNumber === variantTitleNumber || productNumber === variantHandleNumber;
    });
    
    if (matchingVariant) {
      simpleMapping[product.handle] = matchingVariant.variantId;
      console.log(`✅ ${product.handle} -> ${matchingVariant.variantId}`);
    } else {
      console.log(`❌ Não encontrado variant para: ${product.handle}`);
    }
  }
});

console.log(`\n📈 Mapeamento criado com ${Object.keys(simpleMapping).length} produtos`);

// Criar backup do arquivo atual
const backupPath = mappingPath + '.backup_' + Date.now();
if (fs.existsSync(mappingPath)) {
  fs.writeFileSync(backupPath, fs.readFileSync(mappingPath));
  console.log(`💾 Backup criado: ${path.basename(backupPath)}`);
}

// Salvar novo mapeamento
fs.writeFileSync(mappingPath, JSON.stringify(simpleMapping, null, 2));
console.log(`💾 Novo mapeamento salvo: ${mappingPath}`);

console.log('\n🎉 Reconstrução do mapeamento concluída!');