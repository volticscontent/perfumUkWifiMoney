#!/usr/bin/env node

/**
 * Script para testar tokens Shopify e diagnosticar problemas de autenticação
 * 
 * Uso: node scripts/test-shopify-tokens.js
 */

require('dotenv').config();

const STORES = {
  '1': {
    name: 'EURO PRIDE',
    myshopifyDomain: 'ton-store-1656.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN,
    adminToken: process.env.SHOPIFY_STORE_1_ADMIN_TOKEN
  },
  '2': {
    name: 'WIFI MONEY', 
    myshopifyDomain: 'nkgzhm-1d.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_2_STOREFRONT_TOKEN,
    adminToken: process.env.SHOPIFY_STORE_2_ADMIN_TOKEN
  },
  '3': {
    name: 'SADERSTORE',
    myshopifyDomain: 'ae888e.myshopify.com', 
    storefrontToken: process.env.SHOPIFY_STORE_3_STOREFRONT_TOKEN,
    adminToken: process.env.SHOPIFY_STORE_3_ADMIN_TOKEN
  }
};

/**
 * Testa um token Storefront
 */
async function testStorefrontToken(myshopifyDomain, token, storeName) {
  console.log(`\n🧪 Testando Storefront Token para ${storeName} (${myshopifyDomain})`);
  console.log(`🔑 Token: ${token ? token.substring(0, 10) + '...' : 'AUSENTE'}`);
  
  if (!token) {
    console.log('❌ Token não configurado');
    return false;
  }

  const query = `
    query {
      shop {
        name
        primaryDomain {
          host
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${myshopifyDomain}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query })
    });

    console.log(`📡 Status HTTP: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro HTTP ${response.status}:`);
      console.log(errorText.substring(0, 500));
      return false;
    }

    const result = await response.json();
    
    if (result.errors) {
      console.log('❌ Erros GraphQL:', result.errors);
      return false;
    }

    if (result.data?.shop) {
      console.log(`✅ Token válido!`);
      console.log(`🏪 Loja: ${result.data.shop.name}`);
      console.log(`🌐 Domínio: ${result.data.shop.primaryDomain.host}`);
      return true;
    } else {
      console.log('❌ Resposta inesperada:', result);
      return false;
    }

  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
    return false;
  }
}

/**
 * Testa um token Admin
 */
async function testAdminToken(myshopifyDomain, token, storeName) {
  console.log(`\n🔧 Testando Admin Token para ${storeName} (${myshopifyDomain})`);
  console.log(`🔑 Token: ${token ? token.substring(0, 15) + '...' : 'AUSENTE'}`);
  
  if (!token) {
    console.log('❌ Token não configurado');
    return false;
  }

  try {
    const response = await fetch(`https://${myshopifyDomain}/admin/api/2023-10/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Status HTTP: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro HTTP ${response.status}:`);
      console.log(errorText.substring(0, 500));
      return false;
    }

    const result = await response.json();
    
    if (result.shop) {
      console.log(`✅ Token Admin válido!`);
      console.log(`🏪 Loja: ${result.shop.name}`);
      console.log(`📧 Email: ${result.shop.email}`);
      console.log(`💰 Moeda: ${result.shop.currency}`);
      return true;
    } else {
      console.log('❌ Resposta inesperada:', result);
      return false;
    }

  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
    return false;
  }
}

/**
 * Testa criação de carrinho
 */
async function testCartCreation(myshopifyDomain, token, storeName) {
  console.log(`\n🛒 Testando criação de carrinho para ${storeName}`);
  
  const mutation = `
    mutation {
      cartCreate(input: {}) {
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

  try {
    const response = await fetch(`https://${myshopifyDomain}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: mutation })
    });

    if (!response.ok) {
      console.log(`❌ Erro HTTP ${response.status}: ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    
    if (result.errors) {
      console.log('❌ Erros GraphQL:', result.errors);
      return false;
    }

    const cart = result.data?.cartCreate?.cart;
    const userErrors = result.data?.cartCreate?.userErrors;

    if (userErrors && userErrors.length > 0) {
      console.log('❌ Erros de usuário:', userErrors);
      return false;
    }

    if (cart?.id) {
      console.log(`✅ Carrinho criado com sucesso!`);
      console.log(`🆔 Cart ID: ${cart.id}`);
      console.log(`🔗 Checkout URL: ${cart.checkoutUrl}`);
      return true;
    } else {
      console.log('❌ Falha ao criar carrinho');
      return false;
    }

  } catch (error) {
    console.log('❌ Erro:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando teste de tokens Shopify...\n');
  console.log('=' .repeat(60));

  let allValid = true;

  for (const [storeId, store] of Object.entries(STORES)) {
    console.log(`\n📋 TESTANDO LOJA ${storeId}: ${store.name}`);
    console.log('=' .repeat(50));

    // Teste Storefront Token
    const storefrontValid = await testStorefrontToken(store.myshopifyDomain, store.storefrontToken, store.name);
    
    // Teste Admin Token
    const adminValid = await testAdminToken(store.myshopifyDomain, store.adminToken, store.name);
    
    // Teste criação de carrinho (só se Storefront for válido)
    let cartValid = false;
    if (storefrontValid) {
      cartValid = await testCartCreation(store.myshopifyDomain, store.storefrontToken, store.name);
    }

    console.log(`\n📊 RESUMO LOJA ${storeId}:`);
    console.log(`   Storefront Token: ${storefrontValid ? '✅' : '❌'}`);
    console.log(`   Admin Token: ${adminValid ? '✅' : '❌'}`);
    console.log(`   Criação de Cart: ${cartValid ? '✅' : '❌'}`);

    if (!storefrontValid || !cartValid) {
      allValid = false;
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 RESULTADO FINAL: ${allValid ? '✅ TODOS OS TOKENS VÁLIDOS' : '❌ ALGUNS TOKENS INVÁLIDOS'}`);
  
  if (!allValid) {
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Verifique se os tokens no .env estão corretos');
    console.log('2. Regenere tokens inválidos no Shopify Admin');
    console.log('3. Verifique permissões dos Private Apps');
    console.log('4. Consulte: docs/GERAR_TOKENS_STOREFRONT.md');
  }

  process.exit(allValid ? 0 : 1);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testStorefrontToken, testAdminToken, testCartCreation };