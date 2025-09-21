require('dotenv').config();

async function checkAllProducts() {
  const query = `
    query {
      products(first: 250) {
        edges {
          node {
            id
            handle
            title
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${process.env.SHOPIFY_DOMAIN}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    console.log('Total de produtos:', data.data.products.edges.length);
    
    // Filtrar produtos de perfume
    const perfumeProducts = data.data.products.edges.filter(edge => 
      edge.node.handle.includes('fragrance') || 
      edge.node.handle.includes('perfume') || 
      edge.node.title.toLowerCase().includes('fragrance') ||
      edge.node.handle.includes('piece') ||
      edge.node.title.toLowerCase().includes('piece')
    );
    
    console.log('Produtos de perfume encontrados:', perfumeProducts.length);
    
    if (perfumeProducts.length > 0) {
      console.log('\nProdutos de perfume:');
      perfumeProducts.forEach((edge, index) => {
        console.log(`${index + 1}. ${edge.node.title}`);
        console.log(`   Handle: ${edge.node.handle}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkAllProducts();