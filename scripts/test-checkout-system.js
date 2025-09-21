const fs = require('fs');
const path = require('path');

async function testCheckoutSystem() {
  console.log('🧪 Testando sistema de checkout...\n');

  try {
    // 1. Verificar se os dados de produtos estão disponíveis
    console.log('1. Verificando dados de produtos...');
    const productsPath = path.join(process.cwd(), 'data', 'unified_products_en_gbp.json');
    
    if (!fs.existsSync(productsPath)) {
      console.log('❌ Arquivo de produtos não encontrado:', productsPath);
      return;
    }

    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.products || [];
    console.log(`✅ ${products.length} produtos carregados`);

    // 2. Verificar mapeamento de variant IDs
    console.log('\n2. Verificando mapeamento de variant IDs...');
    const mappingPath = path.join(process.cwd(), 'data', 'shopify_variant_mapping.json');
    
    if (!fs.existsSync(mappingPath)) {
      console.log('❌ Arquivo de mapeamento não encontrado:', mappingPath);
      return;
    }

    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    const mappingCount = Object.keys(mapping).length;
    console.log(`✅ ${mappingCount} mapeamentos de variant ID carregados`);

    // 3. Testar alguns produtos específicos
    console.log('\n3. Testando produtos específicos...');
    const testProducts = products.slice(0, 3);
    
    for (const product of testProducts) {
      const variantId = mapping[product.handle];
      console.log(`- ${product.handle}: ${variantId ? '✅ ' + variantId : '❌ Sem variant ID'}`);
    }

    // 4. Testar API de checkout
    console.log('\n4. Testando API de checkout...');
    
    // Pegar um produto com variant ID válido
    const productWithVariant = testProducts.find(p => mapping[p.handle]);
    
    if (!productWithVariant) {
      console.log('❌ Nenhum produto com variant ID encontrado para teste');
      return;
    }

    const testItem = {
      shopifyId: mapping[productWithVariant.handle],
      quantity: 1
    };

    console.log(`Testando checkout com produto: ${productWithVariant.handle}`);
    console.log(`Variant ID: ${testItem.shopifyId}`);

    // Fazer requisição para API de checkout
    const response = await fetch('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [testItem]
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Checkout criado com sucesso!');
      console.log('URL do checkout:', result.checkoutUrl);
    } else {
      console.log('❌ Erro ao criar checkout:');
      console.log('Status:', response.status);
      console.log('Erro:', result.error);
      console.log('Detalhes:', result.details);
    }

    // 5. Verificar variáveis de ambiente
    console.log('\n5. Verificando configuração...');
    const envResponse = await fetch('http://localhost:3000/api/test-env');
    const envData = await envResponse.json();
    
    console.log('Variáveis de ambiente:');
    Object.entries(envData.environment).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testCheckoutSystem();