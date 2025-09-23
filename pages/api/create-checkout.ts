import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface CartItem {
  shopifyId?: string;
  merchandiseId?: string;
  quantity: number;
}

// Configurações das lojas Shopify
const STORE_CONFIGS = {
  id1: {
    domain: process.env.SHOPIFY_DOMAIN_ID1 || 'ton-store-1656.myshopify.com',
    token: process.env.SHOPIFY_TOKEN_ID1 || process.env.SHOPIFY_STOREFRONT_TOKEN,
    name: 'EURO PRIDE'
  },
  id2: {
    domain: process.env.SHOPIFY_DOMAIN_ID2 || 'nkgzhm-1d.myshopify.com', 
    token: process.env.SHOPIFY_TOKEN_ID2 || process.env.SHOPIFY_STOREFRONT_TOKEN,
    name: 'WIFI MONEY'
  },
  id3: {
    domain: process.env.SHOPIFY_DOMAIN_ID3 || 'ae888e.myshopify.com',
    token: process.env.SHOPIFY_TOKEN_ID3 || process.env.SHOPIFY_STOREFRONT_TOKEN,
    name: 'SADERSTORE'
  }
};

// Função para detectar qual loja um variant ID pertence
function detectStoreFromVariantId(variantId: string): string {
  try {
    // Carrega o mapeamento de SKU para Shopify
    const skuMappingPath = path.join(process.cwd(), 'mapa_sku_para_shopify.json');
    if (fs.existsSync(skuMappingPath)) {
      const skuMapping = JSON.parse(fs.readFileSync(skuMappingPath, 'utf8'));
      
      // Procura o variant ID no mapeamento
      for (const [sku, data] of Object.entries(skuMapping.mapeamentos)) {
        if ((data as any).shopifyVariantId === variantId) {
          return (data as any).shopifyStoreId;
        }
      }
    }
    
    // Se não encontrar, tenta o mapeamento de handle
    const handleMappingPath = path.join(process.cwd(), 'mapa_handle_para_shopify.json');
    if (fs.existsSync(handleMappingPath)) {
      const handleMapping = JSON.parse(fs.readFileSync(handleMappingPath, 'utf8'));
      
      for (const [handle, data] of Object.entries(handleMapping.mapeamentos)) {
        const variants = (data as any).variants || [];
        for (const variant of variants) {
          if (variant.id === variantId) {
            return (data as any).shopifyStoreId;
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao detectar loja do variant:', error);
  }
  
  // Fallback para loja id1
  return 'id1';
}

// Função simplificada - sempre retorna loja 1
function checkProductInAllStores(variantId: string): string[] {
  console.log(`🔍 [API Checkout] Usando loja padrão: id1`);
  return ['id1'];
}

// Função para encontrar variant ID equivalente em outra loja
function findVariantInStore(originalVariantId: string, targetStoreId: string): string | null {
  try {
    const mappingPath = path.join(process.cwd(), 'mapa_correspondencia_unified_shopify_corrigido.json');
    if (fs.existsSync(mappingPath)) {
      const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      
      // Primeiro, encontra o produto unificado correspondente ao variant original
      let unifiedId = null;
      for (const correspondencia of mapping.correspondencias) {
        if (correspondencia.shopify.variantId === originalVariantId || 
            correspondencia.shopify.variantId === originalVariantId.replace('gid://shopify/ProductVariant/', '')) {
          unifiedId = correspondencia.unified.id;
          break;
        }
      }
      
      // Se encontrou o produto unificado, procura o variant na loja alvo
      if (unifiedId) {
        for (const correspondencia of mapping.correspondencias) {
          if (correspondencia.unified.id === unifiedId && correspondencia.shopify.storeId === targetStoreId) {
            return correspondencia.shopify.variantId.startsWith('gid://') ? 
              correspondencia.shopify.variantId : 
              `gid://shopify/ProductVariant/${correspondencia.shopify.variantId}`;
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao encontrar variant em outra loja:', error);
  }
  
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    const { items, utmCampaign }: { items: CartItem[], utmCampaign?: string } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' });
    }

    console.log('🛒 Criando checkout com items:', items);

    // Converte os items para o formato correto do Shopify
    const lines = items.map(item => {
      // Garante que o merchandiseId tenha o prefixo correto
      let merchandiseId = item.merchandiseId || item.shopifyId;
      if (!merchandiseId) {
        throw new Error('merchandiseId ou shopifyId é obrigatório');
      }
      if (!merchandiseId.startsWith('gid://shopify/ProductVariant/')) {
        merchandiseId = `gid://shopify/ProductVariant/${merchandiseId}`;
      }
      
      return {
        merchandiseId,
        quantity: item.quantity
      };
    });

    console.log('📦 Lines formatadas:', lines);

    // Sempre usar loja 1 (simplificado)
    const getStoreIdFromUTM = (utmCampaign?: string): string | null => {
      console.log(`🎯 [API Checkout] Usando loja padrão: id1`);
      return 'id1';
    };

    // Sempre usar loja 2 (loja 1 indisponível)
     const storeId = 'id2';
     console.log(`✅ [API Checkout] Usando loja padrão: ${storeId}`);
    const storeConfig = STORE_CONFIGS[storeId as keyof typeof STORE_CONFIGS];

    if (!storeConfig) {
      return res.status(500).json({ 
        error: 'Configuração da loja não encontrada',
        storeId 
      });
    }

    console.log(`🏪 Usando loja ${storeId} (${storeConfig.name}):`, {
      domain: storeConfig.domain,
      hasToken: !!storeConfig.token
    });

    const domain = storeConfig.domain;
    const token = storeConfig.token;

    if (!domain || !token) {
      console.error('❌ Configuração faltando para loja:', storeId, { domain: !!domain, token: !!token });
      return res.status(500).json({ 
        error: `Configuração da loja ${storeId} não encontrada`,
        details: { domain: !!domain, token: !!token }
      });
    }

    const query = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    console.log('🚀 [API Checkout] Fazendo requisição para Shopify:', {
      url: `https://${domain}/api/2023-10/graphql.json`,
      storeId,
      linesCount: lines.length,
      hasToken: !!token
    });

    const response = await fetch(`https://${domain}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ 
        query, 
        variables: { input: { lines: lines } }
      }),
    });

    console.log('📡 [API Checkout] Resposta do Shopify:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Checkout] Erro HTTP do Shopify:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('❌ [API Checkout] Erro GraphQL:', data.errors);
      return res.status(500).json({ 
        error: 'Erro GraphQL',
        details: data.errors
      });
    }

    if (data.data.cartCreate.userErrors.length > 0) {
      console.error('❌ [API Checkout] User errors:', data.data.cartCreate.userErrors);
      return res.status(400).json({ 
        error: 'Erro ao criar carrinho',
        details: data.data.cartCreate.userErrors
      });
    }

    const checkoutUrl = data.data.cartCreate.cart.checkoutUrl;
    // Checkout criado com sucesso

    return res.status(200).json({ checkoutUrl });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}