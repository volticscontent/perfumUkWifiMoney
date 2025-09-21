import { NextApiRequest, NextApiResponse } from 'next';

interface CartItem {
  shopifyId: string;
  quantity: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Configuração simplificada
    const domain = process.env.SHOPIFY_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

    if (!domain || !token) {
      console.error('❌ Configuração faltando:', { domain: !!domain, token: !!token });
      return res.status(500).json({ 
        error: 'Configuração do Shopify não encontrada',
        details: { domain: !!domain, token: !!token }
      });
    }

    const { items }: { items: CartItem[] } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' });
    }

    console.log('🛒 Criando checkout para:', domain);
    console.log('📦 Items:', items);

    // Converter para formato Shopify
    const lineItems = items.map(item => ({
      merchandiseId: `gid://shopify/ProductVariant/${item.shopifyId}`,
      quantity: item.quantity
    }));

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

    const response = await fetch(`https://${domain}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ 
        query, 
        variables: { input: { lines: lineItems } }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      return res.status(500).json({ 
        error: 'Erro GraphQL',
        details: data.errors
      });
    }

    if (data.data.cartCreate.userErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Erro ao criar carrinho',
        details: data.data.cartCreate.userErrors
      });
    }

    const checkoutUrl = data.data.cartCreate.cart.checkoutUrl;
    console.log('✅ Checkout criado:', checkoutUrl);

    return res.status(200).json({ checkoutUrl });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}