// Script para verificar produtos disponíveis na loja
require('dotenv').config();

async function checkStoreProducts() {
  console.log('🔍 Verificando produtos na loja...\n');

  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    console.log('❌ Variáveis de ambiente não configuradas:');
    console.log('SHOPIFY_DOMAIN:', domain || 'NÃO DEFINIDO');
    console.log('SHOPIFY_STOREFRONT_TOKEN:', token || 'NÃO DEFINIDO');
    return;
  }

  console.log('🏪 Loja:', domain);
  console.log('🔑 Token:', token.substring(0, 10) + '...\n');

  // Query para buscar produtos
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            handle
            title
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
      }
    }
  `;

  try {
    const response = await fetch(`https://${domain}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token
      },
      body: JSON.stringify({
        query,
        variables: { first: 10 }
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.log('❌ Erro na consulta GraphQL:', JSON.stringify(data.errors, null, 2));
      return;
    }

    console.log('✅ Produtos encontrados:');
    data.data.products.edges.forEach((edge, index) => {
      const product = edge.node;
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   Handle: ${product.handle}`);
      console.log(`   ID: ${product.id}`);
      console.log('   Variantes:');
      product.variants.edges.forEach((variantEdge, variantIndex) => {
        const variant = variantEdge.node;
        console.log(`     ${variantIndex + 1}. ${variant.title || 'Default'}`);
        console.log(`        ID: ${variant.id}`);
        console.log(`        Disponível: ${variant.availableForSale ? '✅' : '❌'}`);
      });
    });

  } catch (error) {
    console.log('❌ Erro ao consultar a loja:', error.message);
  }
}

checkStoreProducts().catch(console.error);