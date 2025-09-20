// Configuração das múltiplas lojas Shopify
export interface ShopifyStore {
  id: string;
  name: string;
  domain: string;
  myshopifyDomain: string;
  storefrontToken: string;
  fallbackUrl: string;
}

// Configuração das lojas baseada em UTM campaigns
export const SHOPIFY_STORES: Record<string, ShopifyStore> = {
  '1': {
    id: '1',
    name: 'SOUZABARROS (Euro Pride)',
    domain: 'theperfumeshop.store',
    myshopifyDomain: 'ton-store-1656.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
    fallbackUrl: 'https://ton-store-1656.myshopify.com'
  },
  '2': {
    id: '2', 
    name: 'LEPISKE (Wifi Money)',
    domain: 'tpsfragrances.shop',
    myshopifyDomain: 'nkgzhm-1d.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_2_STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
    fallbackUrl: 'https://nkgzhm-1d.myshopify.com'
  },
  '3': {
    id: '3',
    name: 'SAMYRA/SADERSTORE', 
    domain: 'tpsperfumeshop.shop',
    myshopifyDomain: 'ae888e.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_3_STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
    fallbackUrl: 'https://ae888e.myshopify.com'
  }
};

// Store padrão (fallback)
export const DEFAULT_STORE_ID = '1';

/**
 * Extrai o ID da loja do utm_campaign
 * Formato esperado: utm_campaign=id1,id2,id3[resto...]
 * Retorna o primeiro ID encontrado
 */
export function extractStoreIdFromCampaign(utmCampaign?: string): string {
  if (!utmCampaign) {
    return DEFAULT_STORE_ID;
  }

  // Procura por padrão id1, id2, id3 no início da campanha
  const match = utmCampaign.match(/^(id)?([123])/);
  if (match) {
    const storeId = match[2];
    if (SHOPIFY_STORES[storeId]) {
      return storeId;
    }
  }

  // Se não encontrar padrão válido, retorna store padrão
  return DEFAULT_STORE_ID;
}

/**
 * Obtém configuração da loja baseada no utm_campaign
 */
export function getStoreConfig(utmCampaign?: string): ShopifyStore {
  const storeId = extractStoreIdFromCampaign(utmCampaign);
  return SHOPIFY_STORES[storeId] || SHOPIFY_STORES[DEFAULT_STORE_ID];
}

/**
 * Obtém URL de fallback para carrinho baseada na loja e itens
 * Formato Shopify: https://store.myshopify.com/cart/variant_id:quantity,variant_id:quantity
 * Agora usa busca direta da API do Shopify
 */
export async function getFallbackCartUrl(
  storeId: string, 
  cartItems: Array<{shopifyId: string, quantity: number}>,
  utmCampaign?: string
): Promise<string> {
  const store = SHOPIFY_STORES[storeId] || SHOPIFY_STORES[DEFAULT_STORE_ID];
  
  if (cartItems.length === 0) {
    return `${store.fallbackUrl}/cart`;
  }
  
  // O shopifyId já é o variantId correto obtido na página do produto
  const cartParams: string[] = [];
  
  for (const item of cartItems) {
    if (item.shopifyId && item.quantity > 0) {
      cartParams.push(`${item.shopifyId}:${item.quantity}`);
      console.log(`🔄 Item carrinho: variantId ${item.shopifyId} (qty: ${item.quantity})`);
    } else {
      console.warn(`⚠️ Item inválido ignorado: shopifyId=${item.shopifyId}, quantity=${item.quantity}`);
    }
  }
  
  if (cartParams.length === 0) {
    console.warn('⚠️ Nenhum variant ID válido encontrado, retornando URL de carrinho vazio');
    return `${store.fallbackUrl}/cart`;
  }
  
  const cartUrl = `${store.fallbackUrl}/cart/${cartParams.join(',')}`;
  console.log(`🛒 URL carrinho gerada para loja ${storeId} (${store.name}): ${cartUrl}`);
  
  return cartUrl;
}

/**
 * Versão síncrona da função getFallbackCartUrl para compatibilidade
 * @deprecated Use a versão async getFallbackCartUrl
 */
export function getFallbackCartUrlSync(storeId: string, cartItems: Array<{shopifyId: string, quantity: number}>): string {
  const store = SHOPIFY_STORES[storeId] || SHOPIFY_STORES[DEFAULT_STORE_ID];
  
  if (cartItems.length === 0) {
    return `${store.fallbackUrl}/cart`;
  }
  
  // Fallback usando os IDs como estão (pode não funcionar se forem product_ids)
  const cartParams = cartItems.map(item => `${item.shopifyId}:${item.quantity}`).join(',');
  const cartUrl = `${store.fallbackUrl}/cart/${cartParams}`;
  
  console.warn(`⚠️ Usando versão síncrona deprecated. URL: ${cartUrl}`);
  return cartUrl;
}

/**
 * Valida se um ID de loja é válido
 */
export function isValidStoreId(storeId: string): boolean {
  return storeId in SHOPIFY_STORES;
}

/**
 * Cria um checkout direto na Shopify usando a Cart API
 * Retorna a URL do checkout ao invés do carrinho
 */
export async function createCheckoutUrl(
  storeId: string, 
  cartItems: Array<{shopifyId: string, quantity: number}>,
  utmCampaign?: string
): Promise<string> {
  const store = SHOPIFY_STORES[storeId] || SHOPIFY_STORES[DEFAULT_STORE_ID];
  
  if (cartItems.length === 0) {
    return `${store.fallbackUrl}/cart`;
  }
  
  try {
    // Importar shopifyClient
    const { shopifyClient } = await import('./shopifyClient');
    
    // O shopifyId já é o variantId correto obtido na página do produto
    const lineItems: Array<{ variantId: string; quantity: number }> = [];
    
    for (const item of cartItems) {
      if (item.shopifyId && item.quantity > 0) {
        lineItems.push({
          variantId: item.shopifyId, // shopifyId já é o variantId correto
          quantity: item.quantity
        });
        console.log(`🔄 Item checkout: variantId ${item.shopifyId} (qty: ${item.quantity})`);
      } else {
        console.warn(`⚠️ Item inválido ignorado: shopifyId=${item.shopifyId}, quantity=${item.quantity}`);
      }
    }
    
    if (lineItems.length === 0) {
      console.warn('⚠️ Nenhum variant ID válido encontrado, retornando URL de carrinho vazio');
      return `${store.fallbackUrl}/cart`;
    }
    
    // Criar checkout usando a Cart API
     console.log(`🔄 Tentando criar cart com Cart API para loja ${storeId} com ${lineItems.length} itens`);
     const checkoutUrl = await shopifyClient.createCart(storeId, lineItems);
     
     if (checkoutUrl) {
       console.log(`✅ Cart criado com sucesso para loja ${storeId} (${store.name}): ${checkoutUrl}`);
       console.log(`🎯 REDIRECIONANDO PARA CHECKOUT VIA CART API: ${checkoutUrl}`);
       return checkoutUrl;
     } else {
       console.warn('⚠️ Falha ao criar cart, usando fallback para carrinho');
       console.log(`🔄 Fallback: redirecionando para carrinho`);
       return await getFallbackCartUrl(storeId, cartItems, utmCampaign);
     }
    
  } catch (error) {
    console.error('❌ Erro ao criar cart:', error);
    console.warn('⚠️ Usando fallback para carrinho devido ao erro');
    return await getFallbackCartUrl(storeId, cartItems, utmCampaign);
  }
}