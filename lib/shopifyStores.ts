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
    name: 'EURO PRIDE',
    domain: 'theperfumeshop.store',
    myshopifyDomain: 'ton-store-1656.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN || '',
    fallbackUrl: 'https://ton-store-1656.myshopify.com'
  },
  '2': {
    id: '2', 
    name: 'WIFI MONEY',
    domain: 'tpsfragrances.shop',
    myshopifyDomain: 'nkgzhm-1d.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_2_STOREFRONT_TOKEN || '',
    fallbackUrl: 'https://nkgzhm-1d.myshopify.com'
  },
  '3': {
    id: '3',
    name: 'SADERSTORE', 
    domain: 'tpsperfumeshop.shop',
    myshopifyDomain: 'ae888e.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_3_STOREFRONT_TOKEN || '',
    fallbackUrl: 'https://ae888e.myshopify.com'
  }
};

// Fallbacks removidos - sistema agora falha se não conseguir determinar a loja

/**
 * Extrai o store ID do utm_campaign com fallback para loja 1
 * Mapeia campanhas específicas para lojas
 */
export function extractStoreIdFromCampaign(utmCampaign?: string): string | null {
  console.log('🔍 extractStoreIdFromCampaign chamada com:', utmCampaign, 'tipo:', typeof utmCampaign);
  
  if (!utmCampaign) {
    console.log('⚠️ Nenhum UTM campaign fornecido - usando loja padrão 1 (EURO PRIDE)');
    return '1';
  }

  // 1. Verificação por padrões da loja 1
  if (utmCampaign.includes('id1') || utmCampaign.includes('1') || utmCampaign.includes('euro') || utmCampaign.includes('pride')) {
    console.log(`🏪 UTM "${utmCampaign}" mapeado para loja 1 (EURO PRIDE)`);
    return '1';
  }
  
  // 2. Verificação por padrões da loja 2
  if (utmCampaign.includes('id2') || utmCampaign.includes('2') || utmCampaign.includes('wifi') || utmCampaign.includes('money') || utmCampaign.includes('lepiske')) {
    console.log(`🏪 UTM "${utmCampaign}" mapeado para loja 2 (WIFI MONEY)`);
    return '2';
  }
  
  // 3. Verificação por padrões da loja 3
  if (utmCampaign.includes('id3') || utmCampaign.includes('3') || utmCampaign.includes('sader') || utmCampaign.includes('samyra') || utmCampaign.includes('store3')) {
    console.log(`🏪 UTM "${utmCampaign}" mapeado para loja 3 (SADERSTORE)`);
    return '3';
  }
  
  console.log(`⚠️ UTM "${utmCampaign}" não reconhecido - usando loja padrão 1 (EURO PRIDE)`);
  return '1';
}

/**
 * Obtém configuração da loja baseada no UTM campaign (SEM FALLBACK)
 */
export function getStoreConfig(utmCampaign?: string): ShopifyStore | null {
  const storeId = extractStoreIdFromCampaign(utmCampaign);
  if (!storeId) {
    return null;
  }
  return SHOPIFY_STORES[storeId] || null;
}

// FALLBACKS REMOVIDOS - Sistema agora falha se não conseguir processar

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
  cartItems: Array<{shopifyId: string, quantity: number}>
): Promise<string | null> {
  // SEM FALLBACK: Verificar se a loja existe
  if (!storeId || !SHOPIFY_STORES[storeId]) {
    console.error(`❌ Store ID inválido: ${storeId}`);
    return null;
  }
  
  const store = SHOPIFY_STORES[storeId];
  
  if (cartItems.length === 0) {
    console.error('❌ Carrinho vazio - não é possível criar checkout');
    return null;
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
      console.error('❌ Nenhum variant ID válido encontrado');
      return null;
    }
    
    // Criar checkout usando a Cart API (SEM FALLBACK)
     console.log(`🔄 Tentando criar cart com Cart API para loja ${storeId} com ${lineItems.length} itens`);
     const checkoutUrl = await shopifyClient.createCart(storeId, lineItems);
     
     if (checkoutUrl) {
       console.log(`✅ Cart criado com sucesso para loja ${storeId} (${store.name}): ${checkoutUrl}`);
       console.log(`🎯 REDIRECIONANDO PARA CHECKOUT VIA CART API: ${checkoutUrl}`);
       return checkoutUrl;
     } else {
       console.error('❌ Falha ao criar cart - SEM FALLBACK');
       return null;
     }
    
  } catch (error) {
    console.error('❌ Erro ao criar cart:', error);
    console.error('❌ SEM FALLBACK - Checkout falhou');
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
    }
    return null;
  }
}