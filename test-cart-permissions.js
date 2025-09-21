// Usando fetch nativo do Node.js 18+

async function testCartCreate() {
  const url = 'https://ton-store-1656.myshopify.com/api/2023-10/graphql.json';
  const token = '558ae40610cf03ff1af53298eb953e03';
  
  // Primeiro, testar uma query simples
  console.log('🧪 Testando query simples...');
  const simpleQuery = `
    query {
      shop {
        name
        primaryDomain {
          url
        }
      }
    }
  `;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: simpleQuery })
    });
    
    console.log('📡 Status da query simples:', response.status);
    const result = await response.json();
    console.log('✅ Query simples funcionou:', result.data?.shop?.name);
  } catch (error) {
    console.error('❌ Erro na query simples:', error);
    return;
  }

  // Agora testar cartCreate
  console.log('\n🛒 Testando cartCreate...');
  const cartMutation = `
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

  const variables = {
    input: {
      lines: []
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ 
        query: cartMutation,
        variables 
      })
    });
    
    console.log('📡 Status do cartCreate:', response.status);
    const result = await response.json();
    console.log('📋 Resultado completo:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.log('❌ Erros encontrados:', result.errors);
    }
    
    if (result.data?.cartCreate?.userErrors?.length > 0) {
      console.log('⚠️ User errors:', result.data.cartCreate.userErrors);
    }
    
  } catch (error) {
    console.error('❌ Erro no cartCreate:', error);
  }
}

testCartCreate();