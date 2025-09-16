interface ShopifyMapping {
  metadata: {
    generated_at: string;
    total_local_products: number;
    total_shopify_products: number;
    mapped_products: number;
    unmapped_products: number;
  };
  products: {
    [key: string]: {
      local_handle: string;
      local_title: string;
      shopify_product_id: number;
      shopify_variant_id: number;
      shopify_handle: string;
      shopify_title: string;
      match_method: string;
    };
  };
}

let mappingCache: ShopifyMapping | null = null;
let mappingPromise: Promise<ShopifyMapping | null> | null = null;

/**
 * Carrega o mapeamento do Shopify via API
 */
export async function loadShopifyMapping(): Promise<ShopifyMapping | null> {
  if (mappingCache) {
    return mappingCache;
  }

  if (mappingPromise) {
    return await mappingPromise;
  }

  mappingPromise = (async () => {
    try {
      const response = await fetch('/api/shopify-mapping');
      
      if (!response.ok) {
        console.warn('Arquivo de mapeamento do Shopify não encontrado');
        return null;
      }

      const mapping = await response.json();
      mappingCache = mapping;
      
      console.log(`✅ Mapeamento do Shopify carregado: ${mapping?.metadata.mapped_products} produtos`);
      return mapping;
    } catch (error) {
      console.error('Erro ao carregar mapeamento do Shopify:', error);
      return null;
    } finally {
      mappingPromise = null;
    }
  })();

  return mappingPromise;
}

/**
 * Obtém o ID da variante do Shopify para um produto específico
 */
export async function getShopifyVariantId(productId: string): Promise<string | null> {
  const mapping = await loadShopifyMapping();
  
  if (!mapping || !mapping.products[productId]) {
    console.warn(`Produto ${productId} não encontrado no mapeamento do Shopify`);
    return null;
  }

  return mapping.products[productId].shopify_variant_id.toString();
}

/**
 * Obtém o ID do produto do Shopify para um produto específico
 */
export async function getShopifyProductId(productId: string): Promise<string | null> {
  const mapping = await loadShopifyMapping();
  
  if (!mapping || !mapping.products[productId]) {
    console.warn(`Produto ${productId} não encontrado no mapeamento do Shopify`);
    return null;
  }

  return mapping.products[productId].shopify_product_id.toString();
}

/**
 * Obtém informações completas do Shopify para um produto
 */
export async function getShopifyProductInfo(productId: string) {
  const mapping = await loadShopifyMapping();
  
  if (!mapping || !mapping.products[productId]) {
    return null;
  }

  return mapping.products[productId];
}

/**
 * Verifica se o mapeamento está disponível e atualizado
 */
export async function isMappingAvailable(): Promise<boolean> {
  const mapping = await loadShopifyMapping();
  return mapping !== null && mapping.metadata.mapped_products > 0;
}