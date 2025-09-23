/**
 * Script para testar a configuração da LOJA 3 (SADERSTORE)
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testando configuração da LOJA 3 (SADERSTORE)...\n');

// 1. Verificar se o arquivo shopifyStores.ts existe
const shopifyStoresPath = path.join(__dirname, '../lib/shopifyStores.ts');
console.log('📁 Verificando shopifyStores.ts...');
if (fs.existsSync(shopifyStoresPath)) {
  console.log('✅ Arquivo shopifyStores.ts existe');
  const content = fs.readFileSync(shopifyStoresPath, 'utf8');
  if (content.includes('ae888e.myshopify.com')) {
    console.log('✅ Domínio da loja 3 configurado corretamente');
  } else {
    console.log('❌ Domínio da loja 3 não encontrado');
  }
} else {
  console.log('❌ Arquivo shopifyStores.ts não existe');
}

// 2. Verificar mapeamento de variantes
const variantMappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
console.log('\n📁 Verificando mapeamento de variantes...');
if (fs.existsSync(variantMappingPath)) {
  console.log('✅ Arquivo de mapeamento existe');
  try {
    const mapping = JSON.parse(fs.readFileSync(variantMappingPath, 'utf8'));
    const productCount = Object.keys(mapping).length;
    console.log(`✅ ${productCount} produtos mapeados para a loja 3`);
    
    // Mostrar alguns exemplos
    const examples = Object.entries(mapping).slice(0, 3);
    console.log('\n🔍 Exemplos de produtos:');
    examples.forEach(([handle, variantId]) => {
      console.log(`   - ${handle}: ${variantId}`);
    });
  } catch (error) {
    console.log('❌ Erro ao ler mapeamento:', error.message);
  }
} else {
  console.log('❌ Arquivo de mapeamento não existe');
}

// 3. Verificar variáveis de ambiente
console.log('\n🔧 Verificando variáveis de ambiente...');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env existe');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('SHOPIFY_STORE_3_DOMAIN')) {
    console.log('✅ SHOPIFY_STORE_3_DOMAIN configurado');
  } else {
    console.log('❌ SHOPIFY_STORE_3_DOMAIN não encontrado');
  }
  
  if (envContent.includes('SHOPIFY_STORE_3_STOREFRONT_TOKEN')) {
    console.log('✅ SHOPIFY_STORE_3_STOREFRONT_TOKEN configurado');
  } else {
    console.log('❌ SHOPIFY_STORE_3_STOREFRONT_TOKEN não encontrado');
  }
} else {
  console.log('❌ Arquivo .env não existe');
}

// 4. Verificar arquivos de checkout
console.log('\n🛒 Verificando arquivos de checkout...');
const checkoutFiles = [
  '../lib/simpleCheckout.ts',
  '../lib/clientCheckout.ts',
  '../pages/api/create-checkout.ts'
];

checkoutFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('ae888e.myshopify.com') || content.includes('SHOPIFY_STORE_3')) {
      console.log(`✅ ${path.basename(file)} configurado para loja 3`);
    } else {
      console.log(`⚠️  ${path.basename(file)} pode não estar configurado para loja 3`);
    }
  } else {
    console.log(`❌ ${path.basename(file)} não existe`);
  }
});

console.log('\n🎯 Teste de configuração concluído!');
console.log('\n📝 Próximos passos:');
console.log('   1. Configurar token Storefront válido no .env');
console.log('   2. Testar criação de checkout');
console.log('   3. Verificar funcionamento no navegador');