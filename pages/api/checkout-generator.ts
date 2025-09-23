import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface UnifiedProduct {
  id: string;
  handle: string;
  title: string;
  sku: string;
  price: {
    regular: number;
    currency: string;
  };
}

interface ShopifyMatch {
  storeId: string;
  storeName: string;
  domain?: string;
  productId: string;
  variantId: string;
  sku: string;
  price: string;
  available: boolean;
  quantity: number;
}

interface Correspondence {
  unified: UnifiedProduct;
  shopify: ShopifyMatch;
  matchType: string;
}

interface CartItem {
  unifiedId: string;
  quantity: number;
  preferredStore?: string; // id1, id2, id3
}

interface CheckoutRequest {
  items: CartItem[];
  storePreference?: string; // 'best_price' | 'best_availability' | 'specific_store' | 'utm_based'
  specificStore?: string; // id1, id2, id3
  utmCampaign?: string; // UTM campaign parameter for automatic store selection
}

// Configurações das lojas Shopify
const STORE_CONFIGS = {
  id1: {
    domain: process.env.SHOPIFY_DOMAIN_ID1 || 'euro-pride.myshopify.com',
    token: process.env.SHOPIFY_TOKEN_ID1 || process.env.SHOPIFY_STOREFRONT_TOKEN,
    name: 'EURO PRIDE'
  },
  id2: {
    domain: process.env.SHOPIFY_DOMAIN_ID2 || 'perfumes-club.myshopify.com', 
    token: process.env.SHOPIFY_TOKEN_ID2 || process.env.SHOPIFY_STOREFRONT_TOKEN,
    name: 'Perfumes Club'
  },
  id3: {
    domain: process.env.SHOPIFY_DOMAIN_ID3 || 'ae888e.myshopify.com',
    token: process.env.SHOPIFY_TOKEN_ID3 || process.env.SHOPIFY_STOREFRONT_TOKEN,
    name: 'Perfumes & Co'
  }
};

// Mapeamento de UTM campaigns para store IDs
const UTM_TO_STORE_MAP: { [key: string]: string } = {
  'id1': 'id1',
  'id2': 'id2', 
  'id3': 'id3',
  'euro-pride': 'id1',
  'perfumes-club': 'id2',
  'perfumes-co': 'id3',
  'store1': 'id1',
  'store2': 'id2',
  'store3': 'id3'
};

// Função para carregar mapa específico da loja baseado na UTM
function loadStoreSpecificMap(utmCampaign: string): any {
  console.log(`🔍 [Store Mapping] Processando UTM Campaign: "${utmCampaign}"`);
  console.log(`🔍 [Store Mapping] UTM Campaign (lowercase): "${utmCampaign.toLowerCase()}"`);
  console.log(`🔍 [Store Mapping] Mapeamentos disponíveis:`, Object.keys(UTM_TO_STORE_MAP));
  
  const storeId = UTM_TO_STORE_MAP[utmCampaign.toLowerCase()];
  
  if (!storeId) {
    console.error(`❌ [Store Mapping] UTM campaign '${utmCampaign}' não encontrada no mapeamento`);
    throw new Error(`UTM campaign '${utmCampaign}' não mapeada para nenhuma loja`);
  }

  console.log(`✅ [Store Mapping] UTM "${utmCampaign}" mapeada para loja: ${storeId}`);
  
  const mapPath = path.join(process.cwd(), `mapa_correspondencia_${storeId}_corrigido.json`);
  console.log(`🔍 [Store Mapping] Caminho do mapa: ${mapPath}`);
  
  if (!fs.existsSync(mapPath)) {
    console.error(`❌ [Store Mapping] Arquivo de mapa não encontrado: ${mapPath}`);
    throw new Error(`Mapa para loja ${storeId} não encontrado: ${mapPath}`);
  }

  const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  console.log(`✅ [Store Mapping] Mapa carregado com sucesso para loja ${storeId}`);
  console.log(`📊 [Store Mapping] Total de correspondências: ${mapData.totalCorrespondencias || mapData.correspondencias?.length || 'N/A'}`);
  
  return mapData;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🛒 INICIANDO GERAÇÃO DE CHECKOUT');
    console.log('='.repeat(50));

    const { items, storePreference = 'best_price', specificStore, utmCampaign }: CheckoutRequest = req.body;
    
    console.log('📋 [Checkout] Parâmetros recebidos:');
    console.log(`   - Items: ${items?.length || 0} produtos`);
    console.log(`   - Store Preference: ${storePreference}`);
    console.log(`   - Specific Store: ${specificStore || 'N/A'}`);
    console.log(`   - UTM Campaign: ${utmCampaign || 'N/A'}`);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' });
    }

    // Determina qual mapa carregar baseado na estratégia
    let mapaCorrigido: any;
    let targetStoreId: string | null = null;
    
    console.log('🔍 [Checkout] Determinando estratégia de mapeamento...');

    if (utmCampaign && (storePreference === 'utm_based' || !storePreference)) {
      // Modo UTM: carrega mapa específico da loja baseado na UTM campaign
      console.log(`🎯 Modo UTM detectado: ${utmCampaign}`);
      
      try {
        mapaCorrigido = loadStoreSpecificMap(utmCampaign);
        targetStoreId = UTM_TO_STORE_MAP[utmCampaign.toLowerCase()];
        console.log(`📊 Mapa específico carregado para loja ${targetStoreId}: ${mapaCorrigido.totalCorrespondencias} correspondências`);
      } catch (error) {
        console.warn(`⚠️ Erro ao carregar mapa para UTM '${utmCampaign}': ${error}. Usando mapa unificado.`);
        mapaCorrigido = JSON.parse(
          fs.readFileSync(
            path.join(process.cwd(), 'mapa_correspondencia_unified_shopify_corrigido.json'),
            'utf8'
          )
        );
      }
    } else {
      // Modo tradicional: carrega mapa unificado
      mapaCorrigido = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'mapa_correspondencia_unified_shopify_corrigido.json'),
          'utf8'
        )
      );
      console.log(`📊 Mapa unificado carregado: ${mapaCorrigido.estatisticas?.totalCorrespondencias || mapaCorrigido.totalCorrespondencias} correspondências`);
    }

    // Cria índice por unified ID para busca rápida
    const correspondenciasPorUnified: { [key: string]: Correspondence[] } = {};
    mapaCorrigido.correspondencias.forEach((corresp: Correspondence) => {
      const unifiedId = corresp.unified.id;
      if (!correspondenciasPorUnified[unifiedId]) {
        correspondenciasPorUnified[unifiedId] = [];
      }
      correspondenciasPorUnified[unifiedId].push(corresp);
    });

    // Processa cada item do carrinho
    const checkoutsPorLoja: { [storeId: string]: any[] } = { id1: [], id2: [], id3: [] };
    const itemsNaoEncontrados: string[] = [];
    const resumoItens: any[] = [];

    for (const item of items) {
      const correspondencias = correspondenciasPorUnified[item.unifiedId];
      
      if (!correspondencias || correspondencias.length === 0) {
        itemsNaoEncontrados.push(item.unifiedId);
        continue;
      }

      let melhorCorrespondencia: Correspondence;

      // Lógica de seleção baseada na preferência
      if (targetStoreId) {
        // Modo UTM: prioriza a loja alvo
        melhorCorrespondencia = correspondencias.find(c => c.shopify.storeId === targetStoreId) || correspondencias[0];
        console.log(`   🎯 UTM: Priorizando loja ${targetStoreId} para produto ${item.unifiedId}`);
      } else if (storePreference === 'specific_store' && specificStore) {
        melhorCorrespondencia = correspondencias.find(c => c.shopify.storeId === specificStore) || correspondencias[0];
      } else if (storePreference === 'best_price') {
        melhorCorrespondencia = correspondencias.reduce((melhor, atual) => {
          const precoAtual = parseFloat(atual.shopify.price);
          const precoMelhor = parseFloat(melhor.shopify.price);
          return precoAtual < precoMelhor ? atual : melhor;
        });
      } else if (storePreference === 'best_availability') {
        melhorCorrespondencia = correspondencias.find(c => c.shopify.available && c.shopify.quantity > 0) || correspondencias[0];
      } else {
        melhorCorrespondencia = correspondencias[0];
      }

      // Adiciona ao checkout da loja correspondente
      const storeId = melhorCorrespondencia.shopify.storeId;
      checkoutsPorLoja[storeId].push({
        merchandiseId: melhorCorrespondencia.shopify.variantId.startsWith('gid://') ? melhorCorrespondencia.shopify.variantId : `gid://shopify/ProductVariant/${melhorCorrespondencia.shopify.variantId}`,
        quantity: item.quantity
      });

      resumoItens.push({
        unifiedId: item.unifiedId,
        unifiedTitle: melhorCorrespondencia.unified.title,
        selectedStore: storeId,
        storeName: melhorCorrespondencia.shopify.storeName,
        shopifyVariantId: melhorCorrespondencia.shopify.variantId,
        price: melhorCorrespondencia.shopify.price,
        quantity: item.quantity,
        available: melhorCorrespondencia.shopify.available,
        stock: melhorCorrespondencia.shopify.quantity
      });
    }

    console.log(`\\n📦 RESUMO DOS ITENS:`);
    console.log(`   Total de itens: ${items.length}`);
    console.log(`   Encontrados: ${resumoItens.length}`);
    console.log(`   Não encontrados: ${itemsNaoEncontrados.length}`);
    console.log(`   Distribuição por loja:`);
    console.log(`     ID1: ${checkoutsPorLoja.id1.length} itens`);
    console.log(`     ID2: ${checkoutsPorLoja.id2.length} itens`);
    console.log(`     ID3: ${checkoutsPorLoja.id3.length} itens`);

    // Cria checkouts para cada loja que tem itens
    const checkoutUrls: { [storeId: string]: string } = {};
    const errosCheckout: { [storeId: string]: any } = {};

    for (const [storeId, lineItems] of Object.entries(checkoutsPorLoja)) {
      if (lineItems.length === 0) continue;

      const storeConfig = STORE_CONFIGS[storeId as keyof typeof STORE_CONFIGS];
      
      try {
        console.log(`\\n🏪 Criando checkout para ${storeConfig.name} (${lineItems.length} itens)`);
        
        const checkoutUrl = await criarCheckoutShopify(storeConfig, lineItems);
        checkoutUrls[storeId] = checkoutUrl;
        
        console.log(`   ✅ Checkout criado: ${checkoutUrl}`);
      } catch (error) {
        console.error(`   ❌ Erro ao criar checkout para ${storeId}:`, error);
        errosCheckout[storeId] = error instanceof Error ? error.message : 'Erro desconhecido';
      }
    }

    // Resposta final
    const response = {
      success: Object.keys(checkoutUrls).length > 0,
      checkouts: checkoutUrls,
      resumo: {
        totalItens: items.length,
        itensEncontrados: resumoItens.length,
        itensNaoEncontrados: itemsNaoEncontrados.length,
        lojasPorCheckout: Object.keys(checkoutUrls).length,
        storePreference,
        specificStore
      },
      detalhes: {
        itens: resumoItens,
        itensNaoEncontrados: itemsNaoEncontrados,
        errosCheckout: Object.keys(errosCheckout).length > 0 ? errosCheckout : undefined
      }
    };

    console.log(`\\n✅ CHECKOUT GERADO COM SUCESSO!`);
    console.log(`   Checkouts criados: ${Object.keys(checkoutUrls).length}`);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

async function criarCheckoutShopify(storeConfig: any, lineItems: any[]): Promise<string> {
  console.log(`🛒 [Checkout Creation] Iniciando criação de checkout na loja: ${storeConfig.name}`);
  console.log(`🛒 [Checkout Creation] Domínio: ${storeConfig.domain}`);
  console.log(`🛒 [Checkout Creation] Items para checkout:`, lineItems.map(item => ({
    merchandiseId: item.merchandiseId,
    quantity: item.quantity
  })));
  
  const query = `
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

  const shopifyUrl = `https://${storeConfig.domain}/api/2023-10/graphql.json`;
  console.log(`🔗 [Checkout Creation] URL da API Shopify: ${shopifyUrl}`);

  const response = await fetch(shopifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storeConfig.token,
    },
    body: JSON.stringify({ 
      query, 
      variables: { 
        input: { 
          lines: lineItems,
          attributes: [
            { key: 'source', value: 'unified_checkout_generator' },
            { key: 'timestamp', value: new Date().toISOString() }
          ]
        } 
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
  }

  if (data.data.cartCreate.userErrors.length > 0) {
    throw new Error(`Cart Creation Error: ${JSON.stringify(data.data.cartCreate.userErrors)}`);
  }

  return data.data.cartCreate.cart.checkoutUrl;
}