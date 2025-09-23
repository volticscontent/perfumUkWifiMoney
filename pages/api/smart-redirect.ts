import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface RedirectRequest {
  unifiedId: string;
  strategy?: 'best_price' | 'best_availability' | 'fastest_shipping' | 'user_preference';
  userLocation?: string; // Para shipping strategy
  preferredStore?: string; // id1, id2, id3
}

interface StoreInfo {
  storeId: string;
  storeName: string;
  domain: string;
  productUrl: string;
  price: number;
  available: boolean;
  stock: number;
  shippingScore?: number; // Calculado baseado na localização
}

// Configurações de shipping por região (exemplo)
const SHIPPING_REGIONS = {
  'UK': { id1: 1, id2: 2, id3: 1 }, // Scores menores = mais rápido
  'EU': { id1: 2, id2: 1, id3: 2 },
  'US': { id1: 3, id2: 3, id3: 1 },
  'default': { id1: 2, id2: 2, id3: 2 }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 INICIANDO REDIRECIONAMENTO INTELIGENTE');
    console.log('='.repeat(50));

    const { 
      unifiedId, 
      strategy = 'best_price', 
      userLocation = 'UK',
      preferredStore 
    }: RedirectRequest = req.body;

    if (!unifiedId) {
      return res.status(400).json({ error: 'unifiedId é obrigatório' });
    }

    // Carrega mapa de correspondências
    const mapaCorrigido = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'mapa_correspondencia_unified_shopify_corrigido.json'),
        'utf8'
      )
    );

    // Busca correspondências para o produto
    const correspondencias = mapaCorrigido.correspondencias.filter(
      (corresp: any) => corresp.unified.id === unifiedId
    );

    if (correspondencias.length === 0) {
      return res.status(404).json({ 
        error: 'Produto não encontrado',
        unifiedId 
      });
    }

    console.log(`📦 Produto encontrado: ${correspondencias[0].unified.title}`);
    console.log(`🏪 Disponível em ${correspondencias.length} loja(s)`);

    // Converte correspondências em informações de loja
    const storesInfo: StoreInfo[] = correspondencias.map((corresp: any) => {
      const baseUrl = getStoreBaseUrl(corresp.shopify.storeId);
      const productHandle = corresp.unified.handle;
      
      return {
        storeId: corresp.shopify.storeId,
        storeName: corresp.shopify.storeName,
        domain: corresp.shopify.domain || baseUrl,
        productUrl: `https://${baseUrl}/products/${productHandle}`,
        price: parseFloat(corresp.shopify.price),
        available: corresp.shopify.available,
        stock: corresp.shopify.quantity,
        shippingScore: getShippingScore(corresp.shopify.storeId, userLocation)
      };
    });

    // Aplica estratégia de seleção
    let selectedStore: StoreInfo;
    let selectionReason: string;

    switch (strategy) {
      case 'user_preference':
        if (preferredStore) {
          selectedStore = storesInfo.find(store => store.storeId === preferredStore) || storesInfo[0];
          selectionReason = `Preferência do usuário: ${selectedStore.storeName}`;
        } else {
          selectedStore = storesInfo[0];
          selectionReason = 'Nenhuma preferência especificada, usando primeira opção';
        }
        break;

      case 'best_price':
        selectedStore = storesInfo.reduce((melhor, atual) => 
          atual.price < melhor.price ? atual : melhor
        );
        selectionReason = `Melhor preço: £${selectedStore.price}`;
        break;

      case 'best_availability':
        const disponivel = storesInfo.filter(store => store.available && store.stock > 0);
        if (disponivel.length > 0) {
          selectedStore = disponivel.reduce((melhor, atual) => 
            atual.stock > melhor.stock ? atual : melhor
          );
          selectionReason = `Melhor disponibilidade: ${selectedStore.stock} em estoque`;
        } else {
          selectedStore = storesInfo[0];
          selectionReason = 'Nenhuma loja com estoque, usando primeira opção';
        }
        break;

      case 'fastest_shipping':
        selectedStore = storesInfo.reduce((melhor, atual) => 
          (atual.shippingScore || 999) < (melhor.shippingScore || 999) ? atual : melhor
        );
        selectionReason = `Envio mais rápido para ${userLocation}`;
        break;

      default:
        selectedStore = storesInfo[0];
        selectionReason = 'Estratégia padrão';
    }

    // Cria URL de redirecionamento com parâmetros de tracking
    const redirectUrl = new URL(selectedStore.productUrl);
    redirectUrl.searchParams.set('utm_source', 'unified_catalog');
    redirectUrl.searchParams.set('utm_medium', 'smart_redirect');
    redirectUrl.searchParams.set('utm_campaign', strategy);
    redirectUrl.searchParams.set('unified_id', unifiedId);

    // Log da decisão
    console.log(`\\n🎯 DECISÃO DE REDIRECIONAMENTO:`);
    console.log(`   Estratégia: ${strategy}`);
    console.log(`   Loja selecionada: ${selectedStore.storeName} (${selectedStore.storeId})`);
    console.log(`   Razão: ${selectionReason}`);
    console.log(`   URL: ${redirectUrl.toString()}`);

    // Resposta com informações completas
    const response = {
      success: true,
      redirect: {
        url: redirectUrl.toString(),
        store: selectedStore,
        strategy,
        reason: selectionReason
      },
      alternatives: storesInfo.filter(store => store.storeId !== selectedStore.storeId).map(store => ({
        storeId: store.storeId,
        storeName: store.storeName,
        price: store.price,
        available: store.available,
        stock: store.stock,
        url: `https://${store.domain}/products/${correspondencias[0].unified.handle}?utm_source=unified_catalog&utm_medium=alternative&unified_id=${unifiedId}`
      })),
      product: {
        unifiedId,
        title: correspondencias[0].unified.title,
        handle: correspondencias[0].unified.handle,
        sku: correspondencias[0].unified.sku
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro no redirecionamento:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

function getStoreBaseUrl(storeId: string): string {
  const domains = {
    id1: process.env.SHOPIFY_DOMAIN_ID1 || 'euro-pride.myshopify.com',
    id2: process.env.SHOPIFY_DOMAIN_ID2 || 'perfumes-club.myshopify.com',
    id3: process.env.SHOPIFY_DOMAIN_ID3 || 'ae888e.myshopify.com'
  };
  
  return domains[storeId as keyof typeof domains] || domains.id3;
}

function getShippingScore(storeId: string, userLocation: string): number {
  const region = SHIPPING_REGIONS[userLocation as keyof typeof SHIPPING_REGIONS] || SHIPPING_REGIONS.default;
  return region[storeId as keyof typeof region] || 999;
}