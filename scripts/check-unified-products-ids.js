const fs = require('fs');
const path = require('path');

// Configuração da loja
const domain = process.env.SHOPIFY_DOMAIN || 'ton-store-1656.myshopify.com';
const token = process.env.SHOPIFY_STOREFRONT_TOKEN || '558ae40610cf03ff1af53298eb953e03';

console.log('🔍 Verificando product_ids do unified_products na loja...\n');

// Ler o arquivo unified_products
const unifiedProductsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
const unifiedProducts = JSON.parse(fs.readFileSync(unifiedProductsPath, 'utf8'));

// Extrair todos os product_ids únicos
const productIds = new Set();
unifiedProducts.products.forEach(product => {
  if (product.shopify_mapping) {
    Object.values(product.shopify_mapping).forEach(mapping => {
      if (mapping.product_id) {
        productIds.add(mapping.product_id.toString());
      }
    });
  }
});

console.log(`📊 Total de product_ids únicos encontrados: ${productIds.size}\n`);

// Função para verificar um produto na loja
async function checkProductInStore(productId) {
  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        availableForSale
        variants(first: 5) {
          edges {
            node {
              id
              title
              availableForSale
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${domain}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({
        query,
        variables: {
          id: `gid://shopify/Product/${productId}`
        }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      return { exists: false, error: data.errors[0].message };
    }
    
    if (data.data.product) {
      return {
        exists: true,
        product: {
          id: data.data.product.id,
          handle: data.data.product.handle,
          title: data.data.product.title,
          availableForSale: data.data.product.availableForSale,
          variantCount: data.data.product.variants.edges.length
        }
      };
    } else {
      return { exists: false, error: 'Product not found' };
    }
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

// Verificar todos os produtos
async function checkAllProducts() {
  const results = {
    existing: [],
    missing: [],
    errors: []
  };

  console.log('🔄 Verificando produtos na loja...\n');

  for (const productId of productIds) {
    process.stdout.write(`Verificando ${productId}... `);
    
    const result = await checkProductInStore(productId);
    
    if (result.exists) {
      console.log('✅ EXISTE');
      results.existing.push({
        id: productId,
        ...result.product
      });
    } else {
      console.log('❌ NÃO EXISTE');
      results.missing.push({
        id: productId,
        error: result.error
      });
    }

    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// Executar verificação
checkAllProducts().then(results => {
  console.log('\n📋 RESUMO DOS RESULTADOS:\n');
  
  console.log(`✅ Produtos que EXISTEM na loja: ${results.existing.length}`);
  if (results.existing.length > 0) {
    results.existing.forEach(product => {
      console.log(`   - ${product.id}: ${product.title} (${product.handle})`);
    });
  }
  
  console.log(`\n❌ Produtos que NÃO EXISTEM na loja: ${results.missing.length}`);
  if (results.missing.length > 0) {
    results.missing.forEach(product => {
      console.log(`   - ${product.id}: ${product.error}`);
    });
  }

  console.log(`\n📊 Taxa de correspondência: ${((results.existing.length / productIds.size) * 100).toFixed(1)}%`);

  // Salvar resultados em arquivo
  const reportPath = path.join(__dirname, '..', 'reports', 'unified-products-verification.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_checked: productIds.size,
    existing_count: results.existing.length,
    missing_count: results.missing.length,
    match_rate: ((results.existing.length / productIds.size) * 100).toFixed(1) + '%',
    existing_products: results.existing,
    missing_products: results.missing
  }, null, 2));

  console.log(`\n💾 Relatório salvo em: ${reportPath}`);

}).catch(error => {
  console.error('❌ Erro durante verificação:', error);
});