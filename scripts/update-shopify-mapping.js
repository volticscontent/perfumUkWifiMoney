const fs = require('fs');
const path = require('path');

// Carregar dados
const mappingPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping.json');
const variantReportPath = path.join(__dirname, '..', 'reports', 'variant-ids-report.json');

console.log('🔄 Carregando arquivos...');

// Ler arquivo de mapeamento atual
const currentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Ler relatório de variant IDs válidos
const variantReport = JSON.parse(fs.readFileSync(variantReportPath, 'utf8'));

console.log(`📊 Mapeamento atual tem ${Object.keys(currentMapping).length} produtos`);
console.log(`✅ Encontrados ${variantReport.variants.length} variant IDs válidos`);

// Criar backup do arquivo original
const backupPath = mappingPath + '.backup_' + Date.now();
fs.writeFileSync(backupPath, JSON.stringify(currentMapping, null, 2));
console.log(`💾 Backup criado: ${path.basename(backupPath)}`);

// Mapear variant IDs válidos por handle
const validVariantsByHandle = {};
variantReport.variants.forEach(variant => {
  validVariantsByHandle[variant.productHandle] = variant.variantId;
});

console.log('🔍 Variant IDs válidos por handle:');
Object.entries(validVariantsByHandle).forEach(([handle, variantId]) => {
  console.log(`  ${handle}: ${variantId}`);
});

// Atualizar mapeamento
let updatedCount = 0;
let notFoundCount = 0;

Object.keys(currentMapping).forEach(productKey => {
  const productData = currentMapping[productKey];
  
  // Verificar se temos um variant ID válido para este produto
  const matchingHandle = Object.keys(validVariantsByHandle).find(handle => 
    handle.includes(productKey) || productKey.includes(handle.replace('3-piece-premium-fragrance-collection-set-', ''))
  );
  
  if (matchingHandle) {
    const validVariantId = validVariantsByHandle[matchingHandle];
    
    // Atualizar todos os variants deste produto
    Object.keys(productData).forEach(variantKey => {
      if (productData[variantKey].variant_ids) {
        console.log(`🔄 Atualizando ${productKey}.${variantKey}: ${productData[variantKey].variant_ids[0]} → ${validVariantId}`);
        productData[variantKey].variant_ids = [validVariantId];
        productData[variantKey].primary_variant_id = validVariantId;
        updatedCount++;
      }
    });
  } else {
    console.log(`⚠️  Não encontrado variant válido para: ${productKey}`);
    notFoundCount++;
  }
});

// Salvar arquivo atualizado
fs.writeFileSync(mappingPath, JSON.stringify(currentMapping, null, 2));

console.log('\n📈 Resumo da atualização:');
console.log(`✅ Produtos atualizados: ${updatedCount}`);
console.log(`⚠️  Produtos não encontrados: ${notFoundCount}`);
console.log(`💾 Arquivo salvo: ${mappingPath}`);

// Criar relatório de atualização
const updateReport = {
  timestamp: new Date().toISOString(),
  backup_file: path.basename(backupPath),
  updated_count: updatedCount,
  not_found_count: notFoundCount,
  valid_variants_used: validVariantsByHandle,
  summary: `Atualizados ${updatedCount} variant IDs com dados válidos da loja`
};

const reportPath = path.join(__dirname, '..', 'reports', 'mapping-update-report.json');
fs.writeFileSync(reportPath, JSON.stringify(updateReport, null, 2));
console.log(`📊 Relatório salvo: ${path.basename(reportPath)}`);

console.log('\n🎉 Atualização do mapeamento concluída!');