require('dotenv').config();

async function checkSpecificProduct() {
  const query = `
    query {
      products(first: 1, query: "handle:3-piece-premium-fragrance-collection-set-48") {
        edges {
          node {
        id
        handle
        title
        description
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 5) {
          edges {
            node {
              id
              title
              price
              sku
            }
          }
        }
        tags
        images(first: 3) {
          edges {
            node {
              url
              altText
            }
          }
        }
          }
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
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.products && data.data.products.edges.length > 0) {
      const product = data.data.products.edges[0].node;
      console.log('=== PRODUTO NO SHOPIFY ===');
      console.log('Handle:', product.handle);
      console.log('Título:', product.title);
      console.log('Preço:', product.priceRangeV2.minVariantPrice.amount, product.priceRangeV2.minVariantPrice.currencyCode);
      console.log('SKU:', product.variants.edges[0]?.node.sku || 'N/A');
      console.log('Tags:', product.tags.join(', '));
      console.log('Imagens:', product.images.edges.length);
      console.log('Descrição (primeiros 100 chars):', product.description.substring(0, 100) + '...');
    } else {
      console.log('Produto não encontrado');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkSpecificProduct();