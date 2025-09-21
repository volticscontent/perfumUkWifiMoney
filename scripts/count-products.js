require('dotenv').config();

async function countProducts() {
  console.log('🔢 Contando produtos na loja...');

  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    console.log('❌ Variáveis de ambiente não configuradas');
    return;
  }

  // Query para buscar produtos com paginação
  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            handle
            title
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const response = await fetch(`https://${domain}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': token
        },
        body: JSON.stringify({
          query,
          variables: { first: 50, after: cursor }
        })
      });

      const data = await response.json();

      if (data.errors) {
        console.log('❌ Erro na consulta GraphQL:', JSON.stringify(data.errors, null, 2));
        return;
      }

      const products = data.data.products.edges;
      allProducts = allProducts.concat(products);
      
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;
      
      console.log(`📦 Carregados ${allProducts.length} produtos...`);
    }

    console.log(`\n🎉 TOTAL DE PRODUTOS NA LOJA: ${allProducts.length}`);
    
    // Contar produtos de perfume (que começam com "3-piece")
    const perfumeProducts = allProducts.filter(edge => 
      edge.node.handle.startsWith('3-piece-premium-fragrance-collection-set')
    );
    
    console.log(`🌸 Produtos de perfume (sets): ${perfumeProducts.length}`);
    
    if (perfumeProducts.length > 0) {
      console.log('\n📋 Sets de perfume encontrados:');
      perfumeProducts.forEach((edge, index) => {
        console.log(`${index + 1}. ${edge.node.title} (${edge.node.handle})`);
      });
    }

  } catch (error) {
    console.log('❌ Erro ao consultar a loja:', error.message);
  }
}

countProducts().catch(console.error);