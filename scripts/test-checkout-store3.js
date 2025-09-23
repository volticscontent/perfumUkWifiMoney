/**
 * Script para testar criação de checkout com LOJA 3 (SADERSTORE)
 */

const fs = require('fs');
const path = require('path');

console.log('🛒 Testando criação de checkout com LOJA 3 (SADERSTORE)...\n');

// Simular dados de teste
const testCartItems = [
  {
    handle: "3-piece-premium-fragrance-collection-set-28",
    quantity: 1,
    price: 49.99
  },
  {
    handle: "3-piece-premium-fragrance-collection-set-29", 
    quantity: 2,
    price: 49.99
  }
];

async function testCheckout() {
  try {
    console.log('📦 Itens do carrinho de teste:');
    testCartItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.handle} (Qty: ${item.quantity}, Price: £${item.price})`);
    });
    
    console.log('\n🔧 Verificando configuração...');
    
    // 1. Verificar mapeamento de variantes
    const variantMappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
    const variantMapping = JSON.parse(fs.readFileSync(variantMappingPath, 'utf8'));
    
    console.log('✅ Mapeamento de variantes carregado');
    
    // 2. Verificar se os produtos de teste têm variant IDs
    const missingVariants = [];
    const validItems = [];
    
    testCartItems.forEach(item => {
      const variantId = variantMapping[item.handle];
      if (variantId) {
        validItems.push({
          ...item,
          variantId: variantId
        });
        console.log(`✅ ${item.handle}: ${variantId}`);
      } else {
        missingVariants.push(item.handle);
        console.log(`❌ ${item.handle}: Variant ID não encontrado`);
      }
    });
    
    if (missingVariants.length > 0) {
      console.log(`\n⚠️  ${missingVariants.length} produtos sem variant ID`);
      return;
    }
    
    console.log(`\n✅ Todos os ${validItems.length} produtos têm variant IDs válidos`);
    
    // 3. Simular requisição de checkout
    console.log('\n🌐 Simulando requisição de checkout...');
    
    const checkoutData = {
      items: validItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
      }))
    };
    
    console.log('📋 Dados do checkout:');
    console.log(JSON.stringify(checkoutData, null, 2));
    
    // 4. Verificar variáveis de ambiente
    console.log('\n🔧 Verificando variáveis de ambiente...');
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const hasDomain = envContent.includes('SHOPIFY_STORE_3_DOMAIN=ae888e.myshopify.com');
    const hasToken = envContent.includes('SHOPIFY_STORE_3_STOREFRONT_TOKEN=');
    
    console.log(`   - Domínio configurado: ${hasDomain ? '✅' : '❌'}`);
    console.log(`   - Token configurado: ${hasToken ? '✅' : '❌'}`);
    
    if (!hasToken || envContent.includes('your_storefront_token_here')) {
      console.log('\n⚠️  ATENÇÃO: Token Storefront não configurado!');
      console.log('   Para testar checkout real, configure um token válido no .env');
      console.log('   Consulte: docs/GERAR_TOKENS_STOREFRONT.md');
    }
    
    console.log('\n🎯 Teste de checkout concluído!');
    console.log('\n📝 Próximos passos para teste completo:');
    console.log('   1. Configurar token Storefront válido');
    console.log('   2. Fazer requisição real para /api/create-checkout');
    console.log('   3. Verificar resposta da API do Shopify');
    
  } catch (error) {
    console.error('❌ Erro no teste de checkout:', error.message);
  }
}

testCheckout();