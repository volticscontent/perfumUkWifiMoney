// Sistema simplificado - sempre usa loja 1

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
      
      const filePath = path.join(process.cwd(), 'data', 'shopify_variant_mapping_complete.json');
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
 * Determina o store ID baseado no domínio configurado no .env
 * Mapeia o domínio atual para o store ID correto
 */
function getStoreIdFromUTM(utmCampaign?: string): string {
  const currentDomain = process.env.SHOPIFY_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  
  // Mapeamento de domínios para store IDs
  const domainToStoreId: { [key: string]: string } = {
    'ton-store-1656.myshopify.com': '1',
    'nkgzhm-1d.myshopify.com': '2',
    'ae888e.myshopify.com': '3'
  };
  
  if (currentDomain && domainToStoreMapping[currentDomain]) {
    console.log(`🏪 Store ID determinado: ${domainToStoreMapping[currentDomain]} para domínio: ${currentDomain}`);
    return domainToStoreMapping[currentDomain];
  }
  
  // Fallback para loja 1 se não encontrar o domínio
  console.warn(`⚠️ Domínio não encontrado no mapeamento: ${currentDomain}, usando loja 1 como fallback`);
  return '1';
}

// FUNÇÃO REMOVIDA - Estava causando erros no sistema

// FUNÇÃO REMOVIDA - Estava causando erros no sistema

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