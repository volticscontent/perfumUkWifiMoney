const fs = require('fs');
const path = require('path');

// Ler o arquivo store2-valid-products-mapping.json
const store2MappingPath = path.join(__dirname, 'data', 'store2-valid-products-mapping.json');
const store2Data = JSON.parse(fs.readFileSync(store2MappingPath, 'utf8'));

// Converter para o formato simples handle -> variant_id
const simpleMapping = {};

Object.keys(store2Data).forEach(handle => {
  const product = store2Data[handle];
  simpleMapping[handle] = product.variant_id.toString();
});

// Escrever o novo arquivo shopify_variant_mapping.json
const outputPath = path.join(__dirname, 'public', 'data', 'shopify_variant_mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(simpleMapping, null, 2));

console.log('✅ shopify_variant_mapping.json atualizado com IDs da loja 2');
console.log(`📊 ${Object.keys(simpleMapping).length} produtos convertidos`);

// Mostrar alguns exemplos
console.log('\n📋 Exemplos de conversão:');
Object.keys(simpleMapping).slice(0, 5).forEach(handle => {
  console.log(`  ${handle}: ${simpleMapping[handle]}`);
});