const fs = require('fs');
const path = require('path');

/**
 * Script para atualizar o domínio da Loja 2 para o domínio personalizado correto
 * Baseado na validação, o domínio correto é tpsfragrances.shop
 */

// Configuração atualizada da Loja 2
const UPDATED_STORE_2_CONFIG = {
  id: '2',
  name: 'WIFI MONEY (Store 2)',
  domain: 'tpsfragrances.shop', // Domínio personalizado correto
  myshopifyDomain: 'nkgzhm-1d.myshopify.com', // Domínio original do Shopify
  storeName: 'WIFI MONEY (Store 2)'
};

console.log('🔄 Atualizando configuração da Loja 2...');
console.log(`📍 Domínio antigo: nkgzhm-1d.myshopify.com`);
console.log(`📍 Domínio novo: ${UPDATED_STORE_2_CONFIG.domain}`);

function updateStore2Configuration() {
  try {
    // 1. Atualizar shopifyStores.ts
    const storesPath = path.join(__dirname, '..', 'lib', 'shopifyStores.ts');
    let storesContent = fs.readFileSync(storesPath, 'utf8');
    
    // Substituir o domínio na configuração da Store 2
    storesContent = storesContent.replace(
      /domain: 'nkgzhm-1d\.myshopify\.com'/g,
      `domain: '${UPDATED_STORE_2_CONFIG.domain}'`
    );
    
    // Adicionar myshopifyDomain se não existir
    if (!storesContent.includes('myshopifyDomain:')) {
      storesContent = storesContent.replace(
        /'2': {([^}]+)}/,
        `'2': {$1,
    myshopifyDomain: '${UPDATED_STORE_2_CONFIG.myshopifyDomain}'
  }`
      );
    }
    
    fs.writeFileSync(storesPath, storesContent);
    console.log('✅ shopifyStores.ts atualizado');

    // 2. Atualizar clientCheckout.ts
    const clientCheckoutPath = path.join(__dirname, '..', 'lib', 'clientCheckout.ts');
    let clientCheckoutContent = fs.readFileSync(clientCheckoutPath, 'utf8');
    
    clientCheckoutContent = clientCheckoutContent.replace(
      /nkgzhm-1d\.myshopify\.com/g,
      UPDATED_STORE_2_CONFIG.domain
    );
    
    fs.writeFileSync(clientCheckoutPath, clientCheckoutContent);
    console.log('✅ clientCheckout.ts atualizado');

    // 3. Atualizar simpleCheckout.ts
    const simpleCheckoutPath = path.join(__dirname, '..', 'lib', 'simpleCheckout.ts');
    let simpleCheckoutContent = fs.readFileSync(simpleCheckoutPath, 'utf8');
    
    simpleCheckoutContent = simpleCheckoutContent.replace(
      /nkgzhm-1d\.myshopify\.com/g,
      UPDATED_STORE_2_CONFIG.domain
    );
    
    fs.writeFileSync(simpleCheckoutPath, simpleCheckoutContent);
    console.log('✅ simpleCheckout.ts atualizado');

    // 4. Atualizar create-checkout.ts
    const createCheckoutPath = path.join(__dirname, '..', 'pages', 'api', 'create-checkout.ts');
    let createCheckoutContent = fs.readFileSync(createCheckoutPath, 'utf8');
    
    createCheckoutContent = createCheckoutContent.replace(
      /nkgzhm-1d\.myshopify\.com/g,
      UPDATED_STORE_2_CONFIG.domain
    );
    
    fs.writeFileSync(createCheckoutPath, createCheckoutContent);
    console.log('✅ create-checkout.ts atualizado');

    // 5. Atualizar mapeamento de checkout
    const checkoutMappingPath = path.join(__dirname, '..', 'data', 'store2-checkout-mapping.json');
    if (fs.existsSync(checkoutMappingPath)) {
      const mappingData = JSON.parse(fs.readFileSync(checkoutMappingPath, 'utf8'));
      
      // Atualizar configuração da loja
      mappingData.store.domain = UPDATED_STORE_2_CONFIG.domain;
      mappingData.store.myshopifyDomain = UPDATED_STORE_2_CONFIG.myshopifyDomain;
      
      // Atualizar URLs de checkout
      Object.keys(mappingData.mappings).forEach(productId => {
        const mapping = mappingData.mappings[productId];
        mapping.domain = UPDATED_STORE_2_CONFIG.domain;
        mapping.checkout_url = mapping.checkout_url.replace(
          'nkgzhm-1d.myshopify.com',
          UPDATED_STORE_2_CONFIG.domain
        );
      });
      
      fs.writeFileSync(checkoutMappingPath, JSON.stringify(mappingData, null, 2));
      console.log('✅ store2-checkout-mapping.json atualizado');
    }

    // 6. Atualizar produtos da Loja 2
    const store2ProductsPath = path.join(__dirname, '..', 'data', 'store2-products-with-variants.json');
    if (fs.existsSync(store2ProductsPath)) {
      const productsData = JSON.parse(fs.readFileSync(store2ProductsPath, 'utf8'));
      
      // Atualizar configuração da loja
      productsData.store.domain = UPDATED_STORE_2_CONFIG.domain;
      productsData.store.myshopifyDomain = UPDATED_STORE_2_CONFIG.myshopifyDomain;
      
      // Atualizar URLs de checkout dos produtos
      productsData.products.forEach(product => {
        product.checkout_url = product.checkout_url.replace(
          'nkgzhm-1d.myshopify.com',
          UPDATED_STORE_2_CONFIG.domain
        );
      });
      
      fs.writeFileSync(store2ProductsPath, JSON.stringify(productsData, null, 2));
      console.log('✅ store2-products-with-variants.json atualizado');
    }

    // 7. Atualizar produtos unificados
    const unifiedProductsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
    if (fs.existsSync(unifiedProductsPath)) {
      const unifiedData = JSON.parse(fs.readFileSync(unifiedProductsPath, 'utf8'));
      
      // Atualizar mapeamento da Loja 2 em todos os produtos
      unifiedData.products.forEach(product => {
        if (product.shopify_mapping && product.shopify_mapping['2']) {
          product.shopify_mapping['2'].domain = UPDATED_STORE_2_CONFIG.domain;
        }
      });
      
      fs.writeFileSync(unifiedProductsPath, JSON.stringify(unifiedData, null, 2));
      console.log('✅ unified_products_en_gbp.json atualizado');
    }

    console.log('\n📊 RESUMO DA ATUALIZAÇÃO:');
    console.log(`🏪 Loja: ${UPDATED_STORE_2_CONFIG.storeName}`);
    console.log(`📍 Domínio personalizado: ${UPDATED_STORE_2_CONFIG.domain}`);
    console.log(`📍 Domínio Shopify: ${UPDATED_STORE_2_CONFIG.myshopifyDomain}`);
    console.log('✅ Todos os arquivos atualizados com sucesso!');

    return {
      success: true,
      updatedConfig: UPDATED_STORE_2_CONFIG
    };

  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o script
if (require.main === module) {
  console.log('🚀 Iniciando atualização da configuração da Loja 2...\n');
  
  const result = updateStore2Configuration();
  
  if (result.success) {
    console.log('\n✅ Configuração atualizada com sucesso!');
    console.log('🔄 Agora você pode executar novamente a validação dos checkouts');
  } else {
    console.log('\n❌ Falha ao atualizar configuração');
    process.exit(1);
  }
}

module.exports = { updateStore2Configuration, UPDATED_STORE_2_CONFIG };