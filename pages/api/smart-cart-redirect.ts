import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface StoreConfig {
  domain: string;
  myshopify: string;
  name: string;
}

const stores: Record<string, StoreConfig> = {
  '1': { 
    domain: 'theperfumeshop.store', 
    myshopify: 'ton-store-1656.myshopify.com',
    name: 'EURO PRIDE'
  },
  '2': { 
    domain: 'tpsfragrances.shop', 
    myshopify: 'nkgzhm-1d.myshopify.com',
    name: 'WIFI MONEY'
  },
  '3': { 
    domain: 'tpsperfumeshop.shop', 
    myshopify: 'ae888e.myshopify.com',
    name: 'SADERSTORE'
  }
};

/**
 * API para redirecionamento inteligente de carrinho
 * Detecta automaticamente a loja correta baseada no variant_id
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { variant_id, quantity = '1', use_myshopify = 'false' } = req.query;

  if (!variant_id || typeof variant_id !== 'string') {
    return res.status(400).json({ error: 'variant_id is required' });
  }

  try {
    // Carregar mapeamento de variants
    const filePath = path.join(process.cwd(), 'data', 'shopify_variant_mapping.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn('Arquivo de mapeamento de variant IDs não encontrado');
      return res.status(404).json({ error: 'Variant mapping file not found' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const variantMapping = JSON.parse(fileContent);

    // Procurar em qual loja o variant existe
    let foundStore: string | null = null;
    let productHandle: string | null = null;

    for (const [handle, productData] of Object.entries(variantMapping)) {
      for (const [storeId, storeData] of Object.entries(productData as any)) {
        if (storeData && typeof storeData === 'object' && 'variant_ids' in storeData) {
          const variantIds = (storeData as any).variant_ids;
          if (Array.isArray(variantIds) && variantIds.includes(variant_id)) {
            foundStore = storeId;
            productHandle = handle;
            break;
          }
        }
      }
      if (foundStore) break;
    }

    if (!foundStore) {
      console.warn(`Variant ID ${variant_id} não encontrado em nenhuma loja`);
      return res.status(404).json({ 
        error: 'Variant not found',
        variant_id,
        message: 'Este variant não existe em nenhuma das lojas configuradas'
      });
    }

    const store = stores[foundStore];
    if (!store) {
      console.error(`Configuração da loja ${foundStore} não encontrada`);
      return res.status(500).json({ error: 'Store configuration not found' });
    }

    // Escolher domínio (myshopify ou personalizado)
    const useDomainMyShopify = use_myshopify === 'true';
    const domain = useDomainMyShopify ? store.myshopify : store.domain;
    const cartUrl = `https://${domain}/cart/${variant_id}:${quantity}`;

    console.log(`✅ Variant ${variant_id} encontrado na Loja ${foundStore} (${store.name})`);
    console.log(`🔗 Redirecionando para: ${cartUrl}`);

    // Retornar informações de redirecionamento
    res.status(200).json({
      success: true,
      variant_id,
      store_id: foundStore,
      store_name: store.name,
      product_handle: productHandle,
      domain: store.domain, // Sempre retornar o domínio personalizado
      myshopify: store.myshopify,
      redirect_url: cartUrl,
      checkout_url: cartUrl, // Alias para compatibilidade
      domain_used: domain,
      using_myshopify: useDomainMyShopify
    });

  } catch (error) {
    console.error('Erro ao processar redirecionamento inteligente:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}