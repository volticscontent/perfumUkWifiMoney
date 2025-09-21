async function testRealCheckout() {
  console.log('🧪 Testando Lógica de Checkout...\n');

  // Teste com dados reais que seriam enviados pelo frontend
  const testData = {
    items: [
      {
        handle: '3-piece-premium-fragrance-collection-set-28',
        quantity: 1
      }
    ]
  };

  console.log('📦 Dados de teste (formato frontend):', JSON.stringify(testData, null, 2));

  try {
    // Primeiro, vamos simular o que o frontend deveria fazer:
    // 1. Converter handle para shopifyId usando o mapeamento
    
    const fs = require('fs');
    const path = require('path');
    
    const mappingPath = path.join(process.cwd(), 'data', 'shopify_variant_mapping_complete.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    
    const convertedItems = testData.items.map(item => {
      const productMapping = mapping[item.handle];
      
      if (!productMapping) {
        throw new Error(`Produto não encontrado no mapeamento: ${item.handle}`);
      }

      if (!productMapping.primary_variant_id) {
        throw new Error(`Primary variant ID não encontrado para: ${item.handle}`);
      }

      return {
        shopifyId: productMapping.primary_variant_id,
        quantity: item.quantity
      };
    });

    console.log('✅ Itens convertidos (formato API):', JSON.stringify(convertedItems, null, 2));

    // Simular a lógica da API create-checkout
    console.log('\n🔄 Simulando lógica da API create-checkout...');
    
    const lineItems = convertedItems.map(item => ({
      merchandiseId: `gid://shopify/ProductVariant/${item.shopifyId}`,
      quantity: item.quantity
    }));

    console.log('✅ Line items para Shopify:', JSON.stringify(lineItems, null, 2));

    // Verificar se os tokens estão configurados
    console.log('\n🔑 Verificando configuração...');
    console.log('Domain:', process.env.SHOPIFY_STORE_1_DOMAIN || 'ton-store-1656.myshopify.com');
    console.log('Token configurado:', process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN ? 'SIM' : 'NÃO');

    if (!process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN) {
      console.log('⚠️  Token do Shopify não configurado nas variáveis de ambiente');
      console.log('   Verifique se SHOPIFY_STORE_1_STOREFRONT_TOKEN está definido');
    }

    console.log('\n✅ Lógica de conversão está funcionando corretamente!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testRealCheckout().catch(console.error);