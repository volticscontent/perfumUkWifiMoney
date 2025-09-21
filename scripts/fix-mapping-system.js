const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo o sistema de mapeamento...\n');

// Caminhos dos arquivos
const productsPath = path.join(__dirname, '../data/unified_products_en_gbp.json');
const mappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
const newMappingPath = path.join(__dirname, '../data/shopify_variant_mapping_fixed.json');

try {
  // Carregar dados
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const products = productsData.products || productsData;
  const oldMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

  console.log(`📊 Total de produtos: ${products.length}`);
  console.log(`📊 Mapeamentos antigos: ${Object.keys(oldMapping).length}\n`);

  // Criar novo mapeamento baseado nos handles dos produtos
  const newMapping = {};
  const mappedProducts = [];
  const unmappedProducts = [];

  console.log('🔍 Analisando produtos e tentando mapear...\n');

  products.forEach((product, index) => {
    const productHandle = product.handle;
    
    // Tentar encontrar um variant ID correspondente no mapeamento antigo
    // Procurar por handles similares ou exatos
    let variantId = null;
    
    // 1. Procurar por handle exato
    if (oldMapping[productHandle]) {
      variantId = oldMapping[productHandle];
    }
    
    // 2. Procurar por ID numérico (caso antigo)
    if (!variantId && oldMapping[product.id]) {
      variantId = oldMapping[product.id];
    }
    
    // 3. Procurar por handles similares (sem sufixos numéricos)
    if (!variantId) {
      const baseHandle = productHandle.replace(/-\d+$/, ''); // Remove números do final
      for (const [key, value] of Object.entries(oldMapping)) {
        if (key.includes(baseHandle) || baseHandle.includes(key.replace(/-\d+$/, ''))) {
          variantId = value;
          break;
        }
      }
    }

    if (variantId) {
      newMapping[productHandle] = variantId;
      mappedProducts.push({
        id: product.id,
        handle: productHandle,
        name: product.title,
        variantId: variantId
      });
      console.log(`✅ ${index + 1}. Mapeado: ${productHandle} -> ${variantId}`);
    } else {
      unmappedProducts.push({
        id: product.id,
        handle: productHandle,
        name: product.title
      });
      console.log(`❌ ${index + 1}. NÃO mapeado: ${productHandle}`);
    }
  });

  console.log(`\n📈 Resultados:`);
  console.log(`✅ Produtos mapeados: ${mappedProducts.length}`);
  console.log(`❌ Produtos não mapeados: ${unmappedProducts.length}`);

  // Salvar novo mapeamento
  fs.writeFileSync(newMappingPath, JSON.stringify(newMapping, null, 2));
  console.log(`\n💾 Novo mapeamento salvo em: ${newMappingPath}`);

  // Criar backup do mapeamento antigo
  const backupPath = path.join(__dirname, '../data/shopify_variant_mapping_backup_' + Date.now() + '.json');
  fs.writeFileSync(backupPath, JSON.stringify(oldMapping, null, 2));
  console.log(`💾 Backup do mapeamento antigo salvo em: ${backupPath}`);

  // Substituir o mapeamento antigo pelo novo
  fs.writeFileSync(mappingPath, JSON.stringify(newMapping, null, 2));
  console.log(`✅ Mapeamento principal atualizado!`);

  // Gerar relatório detalhado
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalProducts: products.length,
      mappedProducts: mappedProducts.length,
      unmappedProducts: unmappedProducts.length,
      oldMappingCount: Object.keys(oldMapping).length,
      newMappingCount: Object.keys(newMapping).length
    },
    mappedProducts,
    unmappedProducts,
    newMapping
  };

  const reportPath = path.join(__dirname, '../reports/mapping-fix-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Relatório detalhado salvo em: ${reportPath}`);

  if (unmappedProducts.length > 0) {
    console.log(`\n⚠️  ATENÇÃO: ${unmappedProducts.length} produtos ainda precisam ser mapeados manualmente:`);
    unmappedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.handle} - ${product.name}`);
    });
    console.log('\n💡 Estes produtos precisarão de variant IDs do Shopify para funcionar o checkout.');
  }

  console.log('\n🎉 Sistema de mapeamento corrigido com sucesso!');

} catch (error) {
  console.error('❌ Erro ao corrigir mapeamento:', error.message);
  console.error(error.stack);
}