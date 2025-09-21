const fs = require('fs');
const path = require('path');

// Configuração da loja
const domain = process.env.SHOPIFY_DOMAIN || 'ton-store-1656.myshopify.com';
const token = process.env.SHOPIFY_STOREFRONT_TOKEN || '558ae40610cf03ff1af53298eb953e03';

console.log('🔍 Obtendo variant IDs dos produtos existentes...\n');

// Ler o relatório de produtos existentes
const reportPath = path.join(__dirname, '..', 'reports', 'unified-products-verification.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Função para obter variants de um produto
async function getProductVariants(productId) {
  const query = `
    query getProductVariants($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        variants(first: 10) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
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
        variables: { id: productId }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      return { error: data.errors[0].message };
    }
    
    return data.data.product;
  } catch (error) {
    return { error: error.message };
  }
}

// Obter variants dos primeiros 5 produtos
async function getVariantsForProducts() {
  const results = [];
  const productsToCheck = report.existing_products.slice(0, 5); // Primeiros 5 produtos

  console.log(`🔄 Obtendo variants para ${productsToCheck.length} produtos...\n`);

  for (const product of productsToCheck) {
    process.stdout.write(`Obtendo variants para ${product.handle}... `);
    
    const productData = await getProductVariants(product.id);
    
    if (productData.error) {
      console.log('❌ ERRO');
      results.push({
        productId: product.id,
        handle: product.handle,
        error: productData.error
      });
    } else {
      console.log('✅ OK');
      
      const variants = productData.variants.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title,
        availableForSale: edge.node.availableForSale,
        price: edge.node.price
      }));

      results.push({
        productId: product.id,
        handle: product.handle,
        title: productData.title,
        variants: variants
      });
    }

    // Pequena pausa
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

// Executar
getVariantsForProducts().then(results => {
  console.log('\n📋 VARIANT IDs ENCONTRADOS:\n');
  
  const allVariants = [];
  
  results.forEach(product => {
    if (product.variants) {
      console.log(`🛍️ ${product.title} (${product.handle})`);
      product.variants.forEach(variant => {
        const variantId = variant.id.replace('gid://shopify/ProductVariant/', '');
        console.log(`   - Variant ID: ${variantId}`);
        console.log(`     Título: ${variant.title}`);
        console.log(`     Disponível: ${variant.availableForSale ? '✅' : '❌'}`);
        console.log(`     Preço: ${variant.price.amount} ${variant.price.currencyCode}`);
        console.log('');
        
        allVariants.push({
          variantId: variantId,
          productHandle: product.handle,
          productTitle: product.title,
          variantTitle: variant.title,
          availableForSale: variant.availableForSale,
          price: variant.price
        });
      });
    }
  });

  console.log(`\n🎯 VARIANT IDs PARA TESTE DE CHECKOUT:\n`);
  
  // Mostrar os primeiros 3 variant IDs disponíveis
  const availableVariants = allVariants.filter(v => v.availableForSale).slice(0, 3);
  
  availableVariants.forEach((variant, index) => {
    console.log(`${index + 1}. Variant ID: ${variant.variantId}`);
    console.log(`   Produto: ${variant.productTitle}`);
    console.log(`   URL Direta: https://${domain}/cart/${variant.variantId}:1`);
    console.log(`   API Test: {"items":[{"shopifyId":"${variant.variantId}","quantity":1}]}`);
    console.log('');
  });

  // Salvar resultados
  const variantsReportPath = path.join(__dirname, '..', 'reports', 'variant-ids-report.json');
  fs.writeFileSync(variantsReportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_products: results.length,
    total_variants: allVariants.length,
    available_variants: availableVariants.length,
    variants: allVariants
  }, null, 2));

  console.log(`💾 Relatório de variants salvo em: ${variantsReportPath}`);

}).catch(error => {
  console.error('❌ Erro:', error);
});