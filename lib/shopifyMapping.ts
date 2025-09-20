import { shopifyClient } from './shopifyClient';

// Tipos para os produtos unificados
interface UnifiedProduct {
  id: string;
  handle: string;
  title: string;
  shopify_mapping: {
    [storeId: string]: {
      product_id: number;
      handle: string;
      domain: string;
      store_name: string;
      sku: string;
    };
  };
}

// Tipos para o mapeamento de variant IDs
interface ShopifyVariantMapping {
  [handle: string]: {
    [storeId: string]: {
      product_id: string;
      title: string;
      variant_ids: string[];
      primary_variant_id: string;
    };
  };
}

// Cache para produtos unificados e variant mapping
let unifiedProductsCache: UnifiedProduct[] | null = null;
let unifiedProductsPromise: Promise<UnifiedProduct[]> | null = null;
let variantMappingCache: ShopifyVariantMapping | null = null;
let variantMappingPromise: Promise<ShopifyVariantMapping> | null = null;

/**
 * Carrega o mapeamento de variant IDs do Shopify
 */
async function loadVariantMapping(): Promise<ShopifyVariantMapping> {
  if (variantMappingCache) {
    return variantMappingCache;
  }

  if (variantMappingPromise) {
    return await variantMappingPromise;
  }

  variantMappingPromise = (async () => {
    try {
      let data;
      
      // Se estamos no servidor, carregamos diretamente do arquivo
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        
        const filePath = path.join(process.cwd(), 'data', 'shopify_variant_mapping.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(fileContent);
      } else {
        // Se estamos no cliente, usamos a API route
        const response = await fetch('/api/shopify-variants');
        if (!response.ok) {
          console.warn('Não foi possível carregar o mapeamento de variant IDs');
          return {};
        }
        data = await response.json();
      }
      
      variantMappingCache = data;
      console.log(`✅ Mapeamento de variant IDs carregado: ${Object.keys(data).length} produtos`);
      
      return data;
    } catch (error) {
      console.error('Erro ao carregar mapeamento de variant IDs:', error);
      return {};
    } finally {
      variantMappingPromise = null;
    }
  })();

  return variantMappingPromise;
}

/**
 * Carrega os produtos unificados do arquivo JSON
 */
async function loadUnifiedProducts(): Promise<UnifiedProduct[]> {
  if (unifiedProductsCache) {
    return unifiedProductsCache;
  }

  if (unifiedProductsPromise) {
    return await unifiedProductsPromise;
  }

  unifiedProductsPromise = (async () => {
    try {
      let data;
      
      // Se estamos no servidor, carregamos diretamente do arquivo
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        
        const filePath = path.join(process.cwd(), 'data', 'unified_products_en_gbp.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(fileContent);
      } else {
        // Se estamos no cliente, usamos a API route
        const response = await fetch('/api/unified-products');
        if (!response.ok) {
          console.warn('Não foi possível carregar os produtos unificados');
          return [];
        }
        data = await response.json();
      }
      
      const products = data.products || [];
      
      unifiedProductsCache = products;
      console.log(`✅ Produtos unificados carregados: ${products.length} produtos`);
      
      return products;
    } catch (error) {
      console.error('Erro ao carregar produtos unificados:', error);
      return [];
    } finally {
      unifiedProductsPromise = null;
    }
  })();

  return unifiedProductsPromise;
}

/**
 * Encontra um produto unificado pelo ID
 */
async function findUnifiedProductById(productId: string): Promise<UnifiedProduct | null> {
  const products = await loadUnifiedProducts();
  return products.find(product => product.id === productId) || null;
}

/**
 * Determina qual loja usar baseado no utm_campaign
 */
function getStoreIdFromUTM(utmCampaign?: string): string {
  if (!utmCampaign) return '1'; // Default
  
  if (utmCampaign.includes('2') || utmCampaign.includes('wifi')) {
    return '2';
  } else if (utmCampaign.includes('3') || utmCampaign.includes('sader')) {
    return '3';
  }
  
  return '1'; // Default
}

/**
 * Obtém o ID da variante do Shopify baseado no utm_campaign e produto
 * Usa os dados reais dos variant IDs carregados do arquivo de mapeamento
 * Com fallback inteligente para lojas disponíveis
 */
export async function getShopifyVariantIdByUTM(productId: string, utmCampaign?: string): Promise<string | null> {
  try {
    // Encontra o produto unificado
    const product = await findUnifiedProductById(productId);
    if (!product) {
      console.warn(`Produto ${productId} não encontrado nos produtos unificados`);
      return null;
    }
    
    // Carrega o mapeamento de variant IDs
    const variantMapping = await loadVariantMapping();
    
    // Busca o variant_id no mapeamento
    const productMapping = variantMapping[product.handle];
    if (!productMapping) {
      console.warn(`Mapeamento não encontrado para produto ${productId} (${product.handle})`);
      return null;
    }
    
    // Determina qual loja usar baseado no utm_campaign
    let storeId = getStoreIdFromUTM(utmCampaign);
    
    // Verifica se o produto existe na loja preferida
    let storeMapping = productMapping[storeId];
    
    // Se não existe na loja preferida, usa fallback inteligente
    if (!storeMapping) {
      console.warn(`Produto ${productId} (${product.handle}) não disponível na loja ${storeId}, procurando alternativas...`);
      
      // Ordem de prioridade para fallback: 1 -> 2 -> 3
      const fallbackOrder = ['1', '2', '3'];
      for (const fallbackStoreId of fallbackOrder) {
        if (productMapping[fallbackStoreId]) {
          storeId = fallbackStoreId;
          storeMapping = productMapping[fallbackStoreId];
          console.log(`✅ Usando loja ${storeId} como fallback para produto ${productId}`);
          break;
        }
      }
    }
    
    if (!storeMapping) {
      console.warn(`Produto ${productId} (${product.handle}) não encontrado em nenhuma loja`);
      return null;
    }
    
    const variantId = storeMapping.primary_variant_id;
    if (!variantId) {
      console.warn(`Variant ID não encontrado para produto ${productId} (${product.handle}) na loja ${storeId}`);
      return null;
    }
    
    console.log(`✅ Variant ID obtido do mapeamento: ${variantId} para produto ${productId} na loja ${storeId}`);
    return variantId;
    
  } catch (error) {
    console.error('Erro ao obter variant ID do Shopify:', error);
    return null;
  }
}

/**
 * Obtém o ID da variante do Shopify para um produto específico (função de compatibilidade)
 */
export async function getShopifyVariantId(productId: string, utmCampaign?: string): Promise<string | null> {
  return getShopifyVariantIdByUTM(productId, utmCampaign);
}

/**
 * Obtém informações do produto unificado
 */
export async function getUnifiedProductInfo(productId: string): Promise<UnifiedProduct | null> {
  return findUnifiedProductById(productId);
}

/**
 * Verifica se os produtos unificados estão disponíveis
 */
export async function isUnifiedProductsAvailable(): Promise<boolean> {
  const products = await loadUnifiedProducts();
  return products.length > 0;
}

/**
 * Limpa o cache dos produtos unificados
 */
export function clearUnifiedProductsCache(): void {
  unifiedProductsCache = null;
  unifiedProductsPromise = null;
}

/**
 * Limpa o cache do mapeamento de variant IDs
 */
export function clearVariantMappingCache(): void {
  variantMappingCache = null;
  variantMappingPromise = null;
}

/**
 * Limpa todos os caches
 */
export function clearAllCaches(): void {
  clearUnifiedProductsCache();
  clearVariantMappingCache();
  console.log('Todos os caches limpos');
}