import { SHOPIFY_STORES, type ShopifyStore } from './shopifyStores';

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

// Tipos para as respostas da API
interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
      };
    }>;
  };
}

interface ShopifyResponse {
  data: {
    productByHandle?: ShopifyProduct;
    products?: {
      edges: Array<{
        node: ShopifyProduct;
      }>;
    };
    cartCreate?: {
      cart?: {
        id: string;
        checkoutUrl: string;
        totalQuantity?: number;
        cost?: {
          totalAmount: {
            amount: string;
            currencyCode: string;
          };
        };
      };
      userErrors?: Array<{
        field: string;
        message: string;
      }>;
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

// Cache simples para evitar requisições desnecessárias
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live em ms
}

class ShopifyClient {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private unifiedProducts: UnifiedProduct[] = [];

  constructor() {
    // Limpar cache expirado a cada 10 minutos
    setInterval(() => this.clearExpiredCache(), 10 * 60 * 1000);
    this.loadUnifiedProducts();
  }

  /**
   * Carrega os produtos unificados via API route
   */
  private async loadUnifiedProducts(): Promise<void> {
    try {
      // Se estamos no servidor, carregamos diretamente do arquivo
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        
        const filePath = path.join(process.cwd(), 'data', 'unified_products_en_gbp.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        this.unifiedProducts = data.products || [];
        console.log(`Carregados ${this.unifiedProducts.length} produtos unificados (servidor)`);
      } else {
        // Se estamos no cliente, usamos a API route
        const response = await fetch('/api/unified-products');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        this.unifiedProducts = data.products || [];
        console.log(`Carregados ${this.unifiedProducts.length} produtos unificados (cliente)`);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos unificados:', error);
      this.unifiedProducts = [];
    }
  }

  /**
   * Encontra um produto unificado pelo handle
   */
  private findUnifiedProductByHandle(handle: string): UnifiedProduct | null {
    return this.unifiedProducts.find(product => product.handle === handle) || null;
  }

  /**
   * Obtém o handle específico da loja para um produto
   */
  private getShopifyHandleForStore(product: UnifiedProduct, storeId: string): string | null {
    const mapping = product.shopify_mapping[storeId];
    return mapping ? mapping.handle : null;
  }

  /**
   * Obtém o domínio da loja para um produto
   */
  private getShopifyDomainForStore(product: UnifiedProduct, storeId: string): string | null {
    const mapping = product.shopify_mapping[storeId];
    return mapping ? mapping.domain : null;
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private getCacheKey(domain: string, query: string, variables?: any): string {
    return `${domain}:${query}:${JSON.stringify(variables || {})}`;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Executa uma query GraphQL na Shopify Storefront API
   */
  async executeQuery(
    domain: string,
    storefrontToken: string,
    query: string,
    variables?: any
  ): Promise<ShopifyResponse> {
    const cacheKey = this.getCacheKey(domain, query, variables);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log(`Cache hit for ${domain}`);
      return cached;
    }

    const url = `https://${domain}/api/2023-10/graphql.json`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontToken,
        },
        body: JSON.stringify({
          query,
          variables: variables || {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ShopifyResponse = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      // Cache apenas respostas bem-sucedidas
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Erro ao consultar Shopify (${domain}):`, error);
      throw error;
    }
  }

  /**
   * Busca variant_id por handle do produto unificado
   */
  async getVariantIdByUnifiedHandle(
    unifiedHandle: string,
    storeId: string
  ): Promise<string | null> {
    // Encontra o produto unificado
    const unifiedProduct = this.findUnifiedProductByHandle(unifiedHandle);
    if (!unifiedProduct) {
      console.warn(`Produto unificado não encontrado: ${unifiedHandle}`);
      return null;
    }

    // Obtém o handle específico da loja
    const shopifyHandle = this.getShopifyHandleForStore(unifiedProduct, storeId);
    if (!shopifyHandle) {
      console.warn(`Handle não encontrado para loja ${storeId} no produto ${unifiedHandle}`);
      return null;
    }

    // Obtém o token da loja
    const store = SHOPIFY_STORES[storeId];
    if (!store) {
      console.warn(`Configuração da loja ${storeId} não encontrada`);
      return null;
    }

    // Usa sempre o myshopifyDomain para acessar a Storefront API
    const domain = store.myshopifyDomain;

    const query = `
      query getProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          handle
          title
          variants(first: 1) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(domain, store.storefrontToken, query, { handle: shopifyHandle });
      
      if (!response.data.productByHandle) {
        console.warn(`Produto não encontrado: ${shopifyHandle} em ${domain}`);
        return null;
      }

      const variants = response.data.productByHandle.variants.edges;
      if (variants.length === 0) {
        console.warn(`Nenhuma variante encontrada para: ${shopifyHandle} em ${domain}`);
        return null;
      }

      // Verificação de segurança para evitar erro ao acessar propriedades
      const firstVariant = variants[0]?.node;
      if (!firstVariant || !firstVariant.id) {
        console.warn(`Variante inválida encontrada para: ${shopifyHandle} em ${domain}`);
        return null;
      }

      // Retorna o ID da primeira variante (removendo o prefixo gid://shopify/ProductVariant/)
      const variantId = firstVariant.id.replace('gid://shopify/ProductVariant/', '');
      console.log(`Variant ID encontrado: ${variantId} para ${unifiedHandle} (${shopifyHandle}) em ${domain}`);
      
      return variantId;
    } catch (error) {
      console.error(`Erro ao buscar variant_id para ${unifiedHandle} em ${domain}:`, error);
      return null;
    }
  }

  /**
   * Busca variant_ids para múltiplos handles unificados em uma loja
   */
  async getVariantIdsByUnifiedHandles(
    unifiedHandles: string[],
    storeId: string
  ): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    // Processa em lotes para evitar sobrecarga
    const batchSize = 5;
    for (let i = 0; i < unifiedHandles.length; i += batchSize) {
      const batch = unifiedHandles.slice(i, i + batchSize);
      const promises = batch.map(handle => 
        this.getVariantIdByUnifiedHandle(handle, storeId)
          .then(variantId => ({ handle, variantId }))
      );
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ handle, variantId }) => {
        results[handle] = variantId;
      });
      
      // Pequena pausa entre lotes para respeitar rate limits
      if (i + batchSize < unifiedHandles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Testa a conexão com uma loja Shopify
   */
  async testConnection(domain: string, storefrontToken: string): Promise<boolean> {
    const query = `
      query testConnection {
        shop {
          name
          primaryDomain {
            host
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(domain, storefrontToken, query);
      return !!response.data.shop;
    } catch (error) {
      console.error(`Falha na conexão com ${domain}:`, error);
      return false;
    }
  }

  /**
   * Recarrega os produtos unificados
   */
  async reloadUnifiedProducts(): Promise<void> {
    await this.loadUnifiedProducts();
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache limpo');
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Retorna informações sobre os produtos carregados
   */
  getUnifiedProductsInfo(): { count: number; sampleHandles: string[] } {
    return {
      count: this.unifiedProducts.length,
      sampleHandles: this.unifiedProducts.slice(0, 5).map(p => p.handle)
    };
  }

  /**
   * Cria um cart na Shopify usando a Storefront API
   */
  async createCart(
    storeId: string,
    lineItems: Array<{ variantId: string; quantity: number }>
  ): Promise<string | null> {
    const store = SHOPIFY_STORES[storeId];
    if (!store) {
      console.error(`❌ Loja ${storeId} não encontrada`);
      return null;
    }

    console.log(`🔑 Usando token para loja ${storeId}: ${store.storefrontToken.substring(0, 10)}...`);
    console.log(`🏪 Domain: ${store.myshopifyDomain}`);

    // Usando Cart API moderna ao invés da Checkout API deprecada
    const mutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lines: lineItems.map(item => ({
          merchandiseId: `gid://shopify/ProductVariant/${item.variantId}`,
          quantity: item.quantity
        }))
      }
    };

    try {
      console.log(`🛒 Criando cart na loja ${store.name} (${storeId})`);
      console.log('📦 Line items:', lineItems);
      console.log('📋 Variables enviadas:', JSON.stringify(variables, null, 2));

      const response = await this.executeQuery(
        store.myshopifyDomain,
        store.storefrontToken,
        mutation,
        variables
      );

      console.log('📋 Resposta completa da API:', JSON.stringify(response, null, 2));

      if (response.errors) {
        console.error('❌ Erros GraphQL na criação do cart:', response.errors);
        return null;
      }

      const cart = response.data?.cartCreate?.cart;
      const userErrors = response.data?.cartCreate?.userErrors;

      if (userErrors && userErrors.length > 0) {
        console.error('❌ Erros de usuário no cart:', userErrors);
        return null;
      }

      if (!cart?.checkoutUrl) {
        console.error('❌ URL do checkout não retornada');
        console.error('❌ Dados do cart:', cart);
        return null;
      }

      // Força o uso do domínio myshopify.com para evitar scripts automáticos do domínio personalizado
      let checkoutUrl = cart.checkoutUrl;
      const originalUrl = checkoutUrl;
      
      if (store.myshopifyDomain && checkoutUrl.includes(store.domain)) {
        checkoutUrl = checkoutUrl.replace(store.domain, store.myshopifyDomain);
        console.log(`🔄 URL convertida de ${originalUrl} para: ${checkoutUrl}`);
      }

      // Validar se a URL é válida
      try {
        new URL(checkoutUrl);
      } catch (urlError) {
        console.error('❌ URL de checkout inválida:', checkoutUrl);
        console.error('❌ Erro de URL:', urlError);
        return null;
      }

      console.log(`✅ Cart criado com sucesso!`);
      console.log(`🔗 URL de checkout: ${checkoutUrl}`);
      console.log(`💰 Total: ${cart.cost?.totalAmount?.amount} ${cart.cost?.totalAmount?.currencyCode}`);
      console.log(`📦 Quantidade total: ${cart.totalQuantity}`);
      console.log(`🆔 Cart ID: ${cart.id}`);

      return checkoutUrl;
    } catch (error) {
      console.error('❌ Erro ao criar cart:', error);
      if (error instanceof Error) {
        console.error('❌ Stack trace:', error.stack);
      }
      return null;
    }
  }
}

// Instância singleton
export const shopifyClient = new ShopifyClient();
export default shopifyClient;