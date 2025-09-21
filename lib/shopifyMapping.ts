import { shopifyClient } from './shopifyClient';
import { extractStoreIdFromCampaign } from './shopifyStores';

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



/**
 * Carrega o mapeamento de variant IDs do arquivo JSON (SEM CACHE)
 */
async function loadVariantMapping(): Promise<ShopifyVariantMapping> {
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
    
    console.log(`✅ Mapeamento de variant IDs carregado: ${Object.keys(data).length} produtos`);
    return data;
  } catch (error) {
    console.error('Erro ao carregar mapeamento de variant IDs:', error);
    return {};
  }
}

/**
 * Carrega os produtos unificados do arquivo JSON (SEM CACHE)
 */
async function loadUnifiedProducts(): Promise<UnifiedProduct[]> {
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
    
    console.log(`✅ Produtos unificados carregados: ${products.length} produtos`);
    return products;
  } catch (error) {
    console.error('Erro ao carregar produtos unificados:', error);
    return [];
  }
}

/**
 * Encontra um produto unificado pelo ID
 */
async function findUnifiedProductById(productId: string): Promise<UnifiedProduct | null> {
  const products = await loadUnifiedProducts();
  return products.find(product => product.id === productId) || null;
}

/**
 * Determina qual loja usar baseado no utm_campaign com fallback para loja 1
 */
function getStoreIdFromUTM(utmCampaign?: string): string | null {
  return extractStoreIdFromCampaign(utmCampaign);
}

/**
 * Obtém o ID da variante do Shopify baseado no utm_campaign e produto
 * Usa os dados reais dos variant IDs carregados do arquivo de mapeamento
 * Com fallback inteligente para lojas disponíveis
 * Retorna tanto o variant ID quanto o store ID usado
 */
export async function getShopifyVariantIdByUTM(productId: string, utmCampaign?: string): Promise<{variantId: string; storeId: string} | null> {
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
    const storeId = getStoreIdFromUTM(utmCampaign);
    
    if (!storeId) {
      console.error(`❌ Não foi possível determinar a loja para o UTM campaign: ${utmCampaign}`);
      return null;
    }
    
    // Verifica se o produto existe na loja especificada (SEM FALLBACK)
    const storeMapping = productMapping[storeId];
    
    if (!storeMapping) {
      console.warn(`Produto ${productId} (${product.handle}) não disponível na loja ${storeId}`);
      return null;
    }
    
    const variantId = storeMapping.primary_variant_id;
    if (!variantId) {
      console.warn(`Variant ID não encontrado para produto ${productId} (${product.handle}) na loja ${storeId}`);
      return null;
    }
    
    console.log(`✅ Variant ID obtido do mapeamento: ${variantId} para produto ${productId} na loja ${storeId}`);
    return { variantId, storeId };
    
  } catch (error) {
    console.error('Erro ao obter variant ID do Shopify:', error);
    return null;
  }
}

/**
 * Obtém o ID da variante do Shopify e o store ID usado
 * NOVA FUNÇÃO - Retorna tanto variant ID quanto store ID para evitar inconsistências
 */
export async function getShopifyVariantWithStore(productId: string, utmCampaign?: string): Promise<{variantId: string; storeId: string} | null> {
  return getShopifyVariantIdByUTM(productId, utmCampaign);
}

/**
 * Obtém o ID da variante do Shopify para um produto específico (função de compatibilidade)
 * ATENÇÃO: Esta função pode causar inconsistências se houver fallback de loja
 */
export async function getShopifyVariantId(productId: string, utmCampaign?: string): Promise<string | null> {
  const result = await getShopifyVariantIdByUTM(productId, utmCampaign);
  return result ? result.variantId : null;
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