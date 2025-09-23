/**
 * Configuração das Lojas Shopify
 * Configurado para usar apenas a LOJA 3 (SADERSTORE)
 */

export interface ShopifyStore {
  id: string;
  name: string;
  domain: string;
  myshopifyDomain: string;
  fallbackUrl: string;
  storefrontToken?: string;
}

// Configuração focada apenas na LOJA 3
export const SHOPIFY_STORES: { [key: string]: ShopifyStore } = {
  '3': {
    id: '3',
    name: 'SAMYRA/SADERSTORE',
    domain: 'tpsperfumeshop.shop',
    myshopifyDomain: 'ae888e.myshopify.com',
    fallbackUrl: 'https://ae888e.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_3_STOREFRONT_TOKEN
  }
};

// Configuração padrão sempre usa a loja 3
export const DEFAULT_STORE_ID = '3';

/**
 * Obtém a configuração da loja 3 (única loja ativa)
 */
export function getStore3Config(): ShopifyStore {
  return SHOPIFY_STORES['3'];
}

/**
 * Obtém a configuração de uma loja por ID
 * Sempre retorna a loja 3, independente do ID solicitado
 */
export function getStoreById(storeId: string): ShopifyStore {
  // Sempre retorna a loja 3, independente do ID solicitado
  return SHOPIFY_STORES['3'];
}

/**
 * Obtém todas as lojas disponíveis
 * Retorna apenas a loja 3
 */
export function getAllStores(): ShopifyStore[] {
  return [SHOPIFY_STORES['3']];
}

/**
 * Verifica se uma loja existe
 * Sempre retorna true para loja 3, false para outras
 */
export function storeExists(storeId: string): boolean {
  return storeId === '3';
}

/**
 * Obtém o domínio myshopify da loja 3
 */
export function getStore3Domain(): string {
  return SHOPIFY_STORES['3'].myshopifyDomain;
}

/**
 * Obtém a URL de fallback da loja 3
 */
export function getStore3FallbackUrl(): string {
  return SHOPIFY_STORES['3'].fallbackUrl;
}

/**
 * Função de compatibilidade - sempre retorna loja 3
 */
export function getStoreConfig(): ShopifyStore {
  return SHOPIFY_STORES['3'];
}

// Exporta a configuração da loja 3 como padrão
export default SHOPIFY_STORES['3'];