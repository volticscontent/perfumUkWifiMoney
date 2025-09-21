const https = require('https');
const http = require('http');

async function testAPIEnvironment() {
  console.log('🧪 Testando variáveis de ambiente na API...\n');

  try {
    // Testar a API de teste de ambiente
    const response = await makeRequest('http://localhost:3001/api/test-env');
    console.log('✅ Resposta da API de teste:', JSON.stringify(response, null, 2));

    // Agora testar a API de checkout real
    console.log('\n🛒 Testando API de checkout real...');
    
    const checkoutData = {
      items: [
        {
          shopifyId: '51243679252767', // ID correto do produto teste
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

    console.log('✅ Resposta da API de checkout:', JSON.stringify(checkoutResponse, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
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

testAPIEnvironment().catch(console.error);