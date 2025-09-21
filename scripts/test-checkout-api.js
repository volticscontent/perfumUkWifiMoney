const fs = require('fs');
const path = require('path');

async function testCheckoutAPI() {
  console.log('🧪 Testando API de Checkout...\n');

  // Teste 1: Verificar se o mapeamento está sendo carregado
  console.log('📋 Teste 1: Verificando carregamento do mapeamento...');
  
  try {
    const mappingPath = path.join(process.cwd(), 'data', 'shopify_variant_mapping_complete.json');
    
    if (!fs.existsSync(mappingPath)) {
      console.error('❌ Arquivo de mapeamento não encontrado:', mappingPath);
      return;
    }

    const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
    const mapping = JSON.parse(mappingContent);
    
    console.log(`✅ Mapeamento carregado: ${Object.keys(mapping).length} produtos`);
    
    // Verificar produto específico
    const testProduct = '3-piece-premium-fragrance-collection-set-28';
    if (mapping[testProduct]) {
      console.log(`✅ Produto teste encontrado: ${testProduct}`);
      console.log(`   - Product ID: ${mapping[testProduct].product_id}`);
      console.log(`   - Primary Variant ID: ${mapping[testProduct].primary_variant_id}`);
      console.log(`   - Variant IDs: ${JSON.stringify(mapping[testProduct].variant_ids)}`);
    } else {
      console.error(`❌ Produto teste não encontrado: ${testProduct}`);
    }

  } catch (error) {
    console.error('❌ Erro ao carregar mapeamento:', error.message);
    return;
  }

  // Teste 2: Simular chamada para API de checkout
  console.log('\n🛒 Teste 2: Simulando chamada para API de checkout...');
  
  try {
    const testCartItems = [
      {
        handle: '3-piece-premium-fragrance-collection-set-28',
        quantity: 1
      }
    ];

    console.log('📦 Itens do carrinho de teste:', JSON.stringify(testCartItems, null, 2));

    // Simular a lógica da API de checkout
    const mappingPath = path.join(process.cwd(), 'data', 'shopify_variant_mapping_complete.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

    const shopifyItems = testCartItems.map(item => {
      const productMapping = mapping[item.handle];
      
      if (!productMapping) {
        throw new Error(`Produto não encontrado no mapeamento: ${item.handle}`);
      }

      if (!productMapping.primary_variant_id) {
        throw new Error(`Primary variant ID não encontrado para: ${item.handle}`);
      }

      return {
        merchandiseId: `gid://shopify/ProductVariant/${productMapping.primary_variant_id}`,
        quantity: item.quantity
      };
    });

    console.log('✅ Conversão para formato Shopify bem-sucedida:');
    console.log(JSON.stringify(shopifyItems, null, 2));

  } catch (error) {
    console.error('❌ Erro na simulação de checkout:', error.message);
  }

  // Teste 3: Verificar estrutura dos arquivos de API
  console.log('\n📁 Teste 3: Verificando arquivos de API...');
  
  const apiFiles = [
    'pages/api/create-checkout.ts',
    'pages/api/shopify-variants.ts',
    'lib/shopifyMapping.ts',
    'pages/api/smart-cart-redirect.ts'
  ];

  for (const file of apiFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} - existe`);
      
      // Verificar se usa o mapeamento correto
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('shopify_variant_mapping_complete.json')) {
        console.log(`   ✅ Usa mapeamento correto`);
      } else if (content.includes('shopify_variant_mapping.json')) {
        console.log(`   ⚠️  Ainda usa mapeamento antigo`);
      }
    } else {
      console.log(`❌ ${file} - não encontrado`);
    }
  }

  console.log('\n🏁 Teste concluído!');
}

testCheckoutAPI().catch(console.error);