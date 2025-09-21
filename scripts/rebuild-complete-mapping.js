require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function rebuildCompleteMapping() {
  console.log('🔄 Reconstruindo mapeamento completo de produtos...');

  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    console.log('❌ Variáveis de ambiente não configuradas');
    return;
  }

  // Query para buscar produtos com variantes
  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            handle
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                }
              }
            }
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

    // Buscar todos os produtos com paginação
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

    console.log(`\n✅ Total de produtos carregados: ${allProducts.length}`);

    // Filtrar apenas produtos de perfume (sets)
    const perfumeProducts = allProducts.filter(edge => 
      edge.node.handle.startsWith('3-piece-premium-fragrance-collection-set')
    );

    console.log(`🌸 Produtos de perfume encontrados: ${perfumeProducts.length}`);

    // Criar mapeamento handle -> variant ID
    const mapping = {};
    const detailedMapping = {};

    perfumeProducts.forEach(edge => {
      const product = edge.node;
      const handle = product.handle;
      
      // Pegar a primeira variante (padrão)
      if (product.variants.edges.length > 0) {
        const firstVariant = product.variants.edges[0].node;
        // Extrair apenas o ID numérico do variant ID
        const variantId = firstVariant.id.replace('gid://shopify/ProductVariant/', '');
        
        mapping[handle] = variantId;
        
        // Mapeamento detalhado para debug
        detailedMapping[handle] = {
          productId: product.id.replace('gid://shopify/Product/', ''),
          variantId: variantId,
          title: product.title,
          price: `${firstVariant.price.amount} ${firstVariant.price.currencyCode}`,
          available: firstVariant.availableForSale
        };
        
        console.log(`✅ ${handle} -> ${variantId} (${product.title})`);
      } else {
        console.log(`⚠️  Produto sem variantes: ${handle}`);
      }
    });

    // Salvar mapeamento principal
    const mappingPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`\n💾 Mapeamento salvo em: ${mappingPath}`);

    // Salvar mapeamento detalhado
    const detailedPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping_complete.json');
    fs.writeFileSync(detailedPath, JSON.stringify(detailedMapping, null, 2));
    console.log(`💾 Mapeamento detalhado salvo em: ${detailedPath}`);

    // Salvar também na pasta public para acesso do frontend
    const publicPath = path.join(__dirname, '..', 'public', 'data', 'shopify_variant_mapping.json');
    fs.writeFileSync(publicPath, JSON.stringify(mapping, null, 2));
    console.log(`💾 Mapeamento copiado para public: ${publicPath}`);

    console.log(`\n🎉 Mapeamento completo criado com ${Object.keys(mapping).length} produtos!`);
    
    // Verificar se todos os 44 produtos estão mapeados
    if (Object.keys(mapping).length === 44) {
      console.log('✅ Todos os 44 produtos estão corretamente mapeados!');
    } else {
      console.log(`⚠️  Esperado 44 produtos, encontrado ${Object.keys(mapping).length}`);
    }

  } catch (error) {
    console.log('❌ Erro ao reconstruir mapeamento:', error.message);
  }
}

rebuildCompleteMapping().catch(console.error);