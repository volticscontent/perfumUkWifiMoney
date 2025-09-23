// Checkout direto no client-side com detecção automática de loja
interface CartItem {
  shopifyId: string;
  quantity: number;
}

interface CheckoutResponse {
  checkoutUrl?: string;
  error?: string;
  details?: any;
}

// Configurações das lojas Shopify
const STORE_CONFIGS = {
  id1: {
    domain: 'ton-store-1656.myshopify.com',
    token: '71e03114bab95f02c71a70c7855fc0d0',
    name: 'EURO PRIDE'
  },
  id2: {
    domain: 'nkgzhm-1d.myshopify.com', 
    token: '9b421e903c88a8587d1c9130e772c8be',
    name: 'WIFI MONEY'
  },
  id3: {
    domain: 'ae888e.myshopify.com',
    token: '6e85113f1f88a97912c3cfb4e1bfab18',
    name: 'SADERSTORE'
  }
};

// Função para detectar qual loja um variant ID pertence
async function detectStoreFromVariantId(variantId: string): Promise<string> {
  try {
    // Tenta carregar o mapeamento de SKU para Shopify
    const skuMappingResponse = await fetch('/mapa_sku_para_shopify.json');
    if (skuMappingResponse.ok) {
      const skuMapping = await skuMappingResponse.json();
      
      // Procura o variant ID no mapeamento
      for (const [sku, data] of Object.entries(skuMapping.mapeamentos)) {
        if ((data as any).shopifyVariantId === variantId) {
          return (data as any).shopifyStoreId;
        }
      }
    }
    
    // Se não encontrar, tenta o mapeamento de handle
    const handleMappingResponse = await fetch('/mapa_handle_para_shopify.json');
    if (handleMappingResponse.ok) {
      const handleMapping = await handleMappingResponse.json();
      
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

export async function createClientCheckout(items: CartItem[], utmCampaign?: string): Promise<CheckoutResponse> {
  if (!items || items.length === 0) {
    return {
      error: 'Nenhum item fornecido para o checkout'
    };
  }

  console.log('🛒 [Client Checkout] Criando checkout com', items.length, 'itens');
  if (utmCampaign) {
    console.log('🎯 [Client Checkout] UTM Campaign:', utmCampaign);
  }

  try {
    // Usar nossa API route para evitar problemas de CORS
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        items: items.map(item => ({
          shopifyId: item.shopifyId,
          quantity: item.quantity
        })),
        utmCampaign 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Client Checkout] Erro HTTP:', response.status, errorText);
      return {
        error: `Erro HTTP ${response.status}`,
        details: errorText
      };
    }

    const data = await response.json();
    console.log('📦 [Client Checkout] Resposta da API:', data);

    if (data.error) {
      return {
        error: data.error,
        details: data.details
      };
    }

    if (!data.checkoutUrl) {
      return {
        error: 'URL de checkout não encontrada',
        details: data
      };
    }

    console.log('✅ [Client Checkout] Checkout criado com sucesso:', data.checkoutUrl);
    return {
      checkoutUrl: data.checkoutUrl
    };

  } catch (error) {
    console.error('❌ [Client Checkout] Erro de conexão:', error);
    return {
      error: 'Erro de conexão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função helper para redirecionar direto para o checkout
export async function redirectToCheckout(items: CartItem[], utmCampaign?: string): Promise<void> {
  try {
    const result = await createClientCheckout(items, utmCampaign);
    
    if (result.error) {
      console.error('Erro ao criar checkout:', result.error);
      alert('Erro ao processar checkout. Tente novamente.');
      return;
    }

    if (result.checkoutUrl) {
      console.log('Redirecionando para checkout:', result.checkoutUrl);
      window.location.href = result.checkoutUrl;
    } else {
      console.error('URL de checkout não encontrada');
      alert('Erro ao processar checkout. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro no redirecionamento:', error);
    alert('Erro ao processar checkout. Tente novamente.');
  }
}