const fs = require('fs');
const path = require('path');

// Configuração da loja
const domain = process.env.SHOPIFY_DOMAIN || 'ton-store-1656.myshopify.com';
const token = process.env.SHOPIFY_STOREFRONT_TOKEN || '558ae40610cf03ff1af53298eb953e03';

console.log('🔍 Obtendo variant IDs de TODOS os 44 produtos...\n');

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
              selectedOptions {
                name
                value
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

// Obter variants de TODOS os produtos
async function getAllVariants() {
  const results = [];
  const allProducts = report.existing_products; // Todos os 44 produtos

  console.log(`🔄 Obtendo variants para ${allProducts.length} produtos...\n`);

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    process.stdout.write(`[${i + 1}/${allProducts.length}] ${product.handle}... `);
    
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
        variantId: edge.node.id.replace('gid://shopify/ProductVariant/', ''),
        title: edge.node.title,
        availableForSale: edge.node.availableForSale,
        price: edge.node.price,
        selectedOptions: edge.node.selectedOptions
      }));

      results.push({
        productId: product.id,
        handle: product.handle,
        title: productData.title,
        variants: variants
      });
    }

    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return results;
}

// Executar
getAllVariants().then(results => {
  console.log('\n📋 PROCESSAMENTO COMPLETO!\n');
  
  const allVariants = [];
  const variantMapping = {};
  
  results.forEach(product => {
    if (product.variants) {
      console.log(`🛍️ ${product.title} (${product.handle})`);
      product.variants.forEach(variant => {
        console.log(`   - Variant ID: ${variant.variantId}`);
        console.log(`     Disponível: ${variant.availableForSale ? '✅' : '❌'}`);
        console.log(`     Preço: ${variant.price.amount} ${variant.price.currencyCode}`);
        
        allVariants.push({
          variantId: variant.variantId,
          productHandle: product.handle,
          productTitle: product.title,
          variantTitle: variant.title,
          availableForSale: variant.availableForSale,
          price: variant.price,
          selectedOptions: variant.selectedOptions
        });

        // Criar mapeamento handle -> variantId
        variantMapping[product.handle] = variant.variantId;
      });
      console.log('');
    }
  });

  // Criar JSON estruturado com todas as variantes
  const completeVariantsData = {
    timestamp: new Date().toISOString(),
    total_products: results.length,
    total_variants: allVariants.length,
    available_variants: allVariants.filter(v => v.availableForSale).length,
    summary: {
      products_with_variants: results.filter(r => r.variants).length,
      products_with_errors: results.filter(r => r.error).length
    },
    variant_mapping: variantMapping,
    detailed_variants: allVariants,
    products_data: results
  };

  // Salvar JSON completo das variantes
  const completeVariantsPath = path.join(__dirname, '..', 'data', 'shopify_variants_complete.json');
  fs.writeFileSync(completeVariantsPath, JSON.stringify(completeVariantsData, null, 2));

  // Salvar mapeamento simples handle -> variantId
  const simpleMappingPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping_complete.json');
  fs.writeFileSync(simpleMappingPath, JSON.stringify(variantMapping, null, 2));

  console.log(`\n💾 ARQUIVOS SALVOS:`);
  console.log(`📄 Dados completos: ${completeVariantsPath}`);
  console.log(`🗺️ Mapeamento simples: ${simpleMappingPath}`);
  
  console.log(`\n📊 ESTATÍSTICAS:`);
  console.log(`   Total de produtos: ${results.length}`);
  console.log(`   Total de variantes: ${allVariants.length}`);
  console.log(`   Variantes disponíveis: ${allVariants.filter(v => v.availableForSale).length}`);
  console.log(`   Produtos com erro: ${results.filter(r => r.error).length}`);

  // Mostrar alguns exemplos de variant IDs para teste
  console.log(`\n🎯 EXEMPLOS DE VARIANT IDs PARA TESTE:`);
  const availableVariants = allVariants.filter(v => v.availableForSale).slice(0, 5);
  
  availableVariants.forEach((variant, index) => {
    console.log(`${index + 1}. ${variant.variantId} - ${variant.productTitle}`);
  });

}).catch(error => {
  console.error('❌ Erro:', error);
});