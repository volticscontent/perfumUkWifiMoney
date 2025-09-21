import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface StoreConfig {
  id: string;
  name: string;
  domain: string;
  myshopify: string;
  storefrontToken?: string;
}

const stores: Record<string, StoreConfig> = {
  '1': { 
    id: '1',
    name: 'EURO PRIDE',
    domain: 'theperfumeshop.store', 
    myshopify: 'ton-store-1656.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN
  },
  '3': { 
    id: '3',
    name: 'SADERSTORE',
    domain: 'tpsperfumeshop.shop', 
    myshopify: 'ae888e.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_3_STOREFRONT_TOKEN
  }
};

/**
 * API para inspecionar domínios e listar variant IDs das Lojas 1 e 3
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { store_id, action = 'inspect' } = req.query;

  try {
    if (action === 'inspect') {
      // Inspecionar informações de domínio
      const results = await inspectDomains();
      return res.status(200).json(results);
    }

    if (action === 'variants') {
      if (!store_id || (store_id !== '1' && store_id !== '3')) {
        return res.status(400).json({ error: 'store_id deve ser 1 ou 3' });
      }
      
      const variants = await getStoreVariants(store_id as string);
      return res.status(200).json(variants);
    }

    if (action === 'compare') {
      const comparison = await compareVariants();
      return res.status(200).json(comparison);
    }

    return res.status(400).json({ error: 'Ação inválida. Use: inspect, variants, ou compare' });

  } catch (error) {
    console.error('Erro na API de inspeção:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

/**
 * Inspeciona informações de domínio das lojas
 */
async function inspectDomains() {
  const results = {
    timestamp: new Date().toISOString(),
    stores: {},
    domain_tests: {}
  };

  for (const [storeId, store] of Object.entries(stores)) {
    console.log(`🔍 Inspecionando Loja ${storeId} (${store.name})...`);
    
    results.stores[storeId] = {
      id: store.id,
      name: store.name,
      domain: store.domain,
      myshopify: store.myshopify,
      has_storefront_token: !!store.storefrontToken
    };

    // Testar conectividade dos domínios
    results.domain_tests[storeId] = await testDomainConnectivity(store);
  }

  return results;
}

/**
 * Testa conectividade dos domínios
 */
async function testDomainConnectivity(store: StoreConfig) {
  const tests = {
    custom_domain: null,
    myshopify_domain: null,
    shopify_api_accessible: false
  };

  try {
    // Teste do domínio personalizado
    const customResponse = await fetch(`https://${store.domain}`, { 
      method: 'HEAD',
      timeout: 5000 
    });
    tests.custom_domain = {
      status: customResponse.status,
      accessible: customResponse.ok,
      redirected: customResponse.redirected,
      final_url: customResponse.url
    };
  } catch (error) {
    tests.custom_domain = {
      status: null,
      accessible: false,
      error: error.message
    };
  }

  try {
    // Teste do domínio MyShopify
    const myshopifyResponse = await fetch(`https://${store.myshopify}`, { 
      method: 'HEAD',
      timeout: 5000 
    });
    tests.myshopify_domain = {
      status: myshopifyResponse.status,
      accessible: myshopifyResponse.ok,
      redirected: myshopifyResponse.redirected,
      final_url: myshopifyResponse.url
    };
  } catch (error) {
    tests.myshopify_domain = {
      status: null,
      accessible: false,
      error: error.message
    };
  }

  // Teste da API Shopify (se tiver token)
  if (store.storefrontToken) {
    try {
      const apiResponse = await fetch(`https://${store.myshopify}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': store.storefrontToken
        },
        body: JSON.stringify({
          query: `{ shop { name domain } }`
        })
      });
      tests.shopify_api_accessible = apiResponse.ok;
    } catch (error) {
      tests.shopify_api_accessible = false;
    }
  }

  return tests;
}

/**
 * Obtém variant IDs de uma loja específica via Shopify API
 */
async function getStoreVariants(storeId: string) {
  const store = stores[storeId];
  if (!store) {
    throw new Error(`Loja ${storeId} não encontrada`);
  }

  if (!store.storefrontToken) {
    throw new Error(`Token Storefront não configurado para Loja ${storeId}`);
  }

  console.log(`📦 Buscando variants da Loja ${storeId} (${store.name})...`);

  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            handle
            title
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                  }
                  availableForSale
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${store.myshopify}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': store.storefrontToken
      },
      body: JSON.stringify({
        query,
        variables: { first: 250 }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors)}`);
    }

    const variants = [];
    const products = data.data.products.edges;

    for (const productEdge of products) {
      const product = productEdge.node;
      for (const variantEdge of product.variants.edges) {
        const variant = variantEdge.node;
        // Extrair ID numérico do ID GraphQL (ex: "gid://shopify/ProductVariant/123456" -> "123456")
        const variantId = variant.id.split('/').pop();
        variants.push({
          variant_id: variantId,
          graphql_id: variant.id,
          product_handle: product.handle,
          product_title: product.title,
          variant_title: variant.title,
          price: variant.price.amount,
          available: variant.availableForSale
        });
      }
    }

    return {
      store_id: storeId,
      store_name: store.name,
      domain: store.domain,
      myshopify: store.myshopify,
      total_variants: variants.length,
      variants: variants,
      has_more_pages: data.data.products.pageInfo.hasNextPage
    };

  } catch (error) {
    throw new Error(`Erro ao buscar variants da Loja ${storeId}: ${error.message}`);
  }
}

/**
 * Compara variant IDs das APIs com o arquivo local
 */
async function compareVariants() {
  console.log('🔄 Comparando variant IDs...');

  // Carregar arquivo local
  const filePath = path.join(process.cwd(), 'data', 'shopify_variant_mapping.json');
  let localMapping = {};
  
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    localMapping = JSON.parse(fileContent);
  }

  // Buscar variants das APIs
  const apiVariants = {
    '1': null,
    '3': null
  };

  try {
    apiVariants['1'] = await getStoreVariants('1');
  } catch (error) {
    console.warn('Erro ao buscar variants da Loja 1:', error.message);
  }

  try {
    apiVariants['3'] = await getStoreVariants('3');
  } catch (error) {
    console.warn('Erro ao buscar variants da Loja 3:', error.message);
  }

  // Extrair variant IDs do arquivo local
  const localVariantIds = {
    '1': new Set(),
    '3': new Set()
  };

  for (const [handle, productData] of Object.entries(localMapping)) {
    for (const [storeId, storeData] of Object.entries(productData as any)) {
      if ((storeId === '1' || storeId === '3') && storeData.variant_ids) {
        storeData.variant_ids.forEach(id => localVariantIds[storeId].add(id));
      }
    }
  }

  // Comparar
  const comparison = {
    timestamp: new Date().toISOString(),
    stores: {}
  };

  for (const storeId of ['1', '3']) {
    const apiData = apiVariants[storeId];
    const localIds = Array.from(localVariantIds[storeId]);
    const apiIds = apiData ? apiData.variants.map(v => v.variant_id) : [];

    comparison.stores[storeId] = {
      store_name: stores[storeId].name,
      api_accessible: !!apiData,
      local_variants_count: localIds.length,
      api_variants_count: apiIds.length,
      local_variant_ids: localIds,
      api_variant_ids: apiIds,
      only_in_local: localIds.filter(id => !apiIds.includes(id)),
      only_in_api: apiIds.filter(id => !localIds.includes(id)),
      common_variants: localIds.filter(id => apiIds.includes(id))
    };
  }

  return comparison;
}