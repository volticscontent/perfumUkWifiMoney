// Checkout direto no client-side - muito mais simples!
interface CartItem {
  shopifyId: string;
  quantity: number;
}

interface CheckoutResponse {
  checkoutUrl?: string;
  error?: string;
  details?: any;
}

export async function createClientCheckout(items: CartItem[]): Promise<CheckoutResponse> {
  // Usar valores fixos da loja 1 para simplificar
  const domain = 'ton-store-1656.myshopify.com';
  const token = '558ae40610cf03ff1af53298eb953e03';

  if (!domain || !token) {
    return {
      error: 'Configuração do Shopify não encontrada',
      details: { domain: !!domain, token: !!token }
    };
  }

  // Converter itens para o formato do Shopify
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
      lines: lineItems
    }
  };

  try {
    const response = await fetch(`https://${domain}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      return {
        error: 'Erro GraphQL',
        details: data.errors
      };
    }

    if (data.data.cartCreate.userErrors.length > 0) {
      return {
        error: 'Erro ao criar carrinho',
        details: data.data.cartCreate.userErrors
      };
    }

    return {
      checkoutUrl: data.data.cartCreate.cart.checkoutUrl
    };

  } catch (error) {
    return {
      error: 'Erro de conexão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função helper para redirecionar direto para o checkout
export async function redirectToCheckout(items: CartItem[]): Promise<void> {
  const result = await createClientCheckout(items);
  
  if (result.checkoutUrl) {
    window.location.href = result.checkoutUrl;
  } else {
    console.error('Erro no checkout:', result.error, result.details);
    alert('Erro ao processar checkout. Tente novamente.');
  }
}