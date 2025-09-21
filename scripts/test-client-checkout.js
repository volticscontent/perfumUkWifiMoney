// Teste da nova implementação client-side simplificada
require('dotenv').config();
const https = require('https');
const http = require('http');

async function testClientCheckout() {
  console.log('🧪 Testando novo checkout client-side simplificado...\n');

  try {
    // 1. Verificar se as variáveis de ambiente estão corretas
    console.log('📋 1. Verificando configuração...');
    const config = {
      SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN || 'NÃO DEFINIDO',
      SHOPIFY_STOREFRONT_TOKEN: process.env.SHOPIFY_STOREFRONT_TOKEN || 'NÃO DEFINIDO',
      SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || 'NÃO DEFINIDO',
      SHOPIFY_STORE_STOREFRONT_TOKEN: process.env.SHOPIFY_STORE_STOREFRONT_TOKEN || 'NÃO DEFINIDO',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    console.log('✅ Configuração:', JSON.stringify(config, null, 2));

    // 2. Testar um produto que sabemos que existe na SADERSTORE
    console.log('\n🛒 2. Testando checkout com produto da SADERSTORE...');
    
    const checkoutData = {
      items: [
        {
          shopifyId: '50377079488797', // Variant ID correto da loja 1
          quantity: 1
        }
      ]
    };

    const checkoutResponse = await makeRequest('http://localhost:3001/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });

    console.log('✅ Resposta do checkout:', JSON.stringify(checkoutResponse, null, 2));

    // 3. Verificar se o checkout foi criado com sucesso
    if (checkoutResponse.checkoutUrl) {
      console.log('\n🎉 SUCESSO! Checkout criado com URL:', checkoutResponse.checkoutUrl);
    } else if (checkoutResponse.error) {
      console.log('\n❌ ERRO:', checkoutResponse.error);
      if (checkoutResponse.details) {
        console.log('📝 Detalhes:', JSON.stringify(checkoutResponse.details, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

testClientCheckout().catch(console.error);