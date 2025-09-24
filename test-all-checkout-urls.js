const fs = require('fs');
const https = require('https');
const http = require('http');

// Carregar mapeamento de variantes
const variantMapping = JSON.parse(fs.readFileSync('./data/shopify_variant_mapping.json', 'utf8'));

// Domínio da Loja 2 (WIFI MONEY)
const STORE_DOMAIN = 'nkgzhm-1d.myshopify.com';

// Função para testar URL
function testUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 400,
        headers: res.headers
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
    
    req.end();
  });
}

async function testAllCheckoutUrls() {
  console.log('🧪 Testando todas as URLs de checkout da Loja 2 (WIFI MONEY)...\n');
  
  const results = [];
  const products = Object.keys(variantMapping);
  
  console.log(`📦 Total de produtos a testar: ${products.length}\n`);
  
  for (let i = 0; i < products.length; i++) {
    const handle = products[i];
    const variantId = variantMapping[handle];
    const checkoutUrl = `https://${STORE_DOMAIN}/cart/${variantId}:1`;
    
    console.log(`[${i + 1}/${products.length}] Testando: ${handle}`);
    console.log(`🔗 URL: ${checkoutUrl}`);
    
    const result = await testUrl(checkoutUrl);
    results.push({
      handle,
      variantId,
      ...result
    });
    
    if (result.success) {
      console.log(`✅ Status: ${result.status} - OK`);
    } else {
      console.log(`❌ Status: ${result.status} - ERRO`);
      if (result.error) {
        console.log(`   Erro: ${result.error}`);
      }
    }
    console.log('');
    
    // Pequena pausa para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Resumo dos resultados
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('📊 RESUMO DOS TESTES:');
  console.log(`✅ URLs funcionando: ${successful.length}`);
  console.log(`❌ URLs com erro: ${failed.length}`);
  console.log(`📈 Taxa de sucesso: ${((successful.length / results.length) * 100).toFixed(1)}%\n`);
  
  if (failed.length > 0) {
    console.log('❌ URLs com problemas:');
    failed.forEach(result => {
      console.log(`   - ${result.handle}: ${result.status} (${result.url})`);
    });
    console.log('');
  }
  
  // Salvar relatório detalhado
  const report = {
    timestamp: new Date().toISOString(),
    store_domain: STORE_DOMAIN,
    total_products: results.length,
    successful_urls: successful.length,
    failed_urls: failed.length,
    success_rate: ((successful.length / results.length) * 100).toFixed(1) + '%',
    results: results
  };
  
  fs.writeFileSync('./reports/checkout-urls-test-report.json', JSON.stringify(report, null, 2));
  console.log('💾 Relatório salvo em: ./reports/checkout-urls-test-report.json');
  
  // Criar lista de URLs funcionais para abrir no navegador
  const workingUrls = successful.map(r => r.url);
  fs.writeFileSync('./reports/working-checkout-urls.txt', workingUrls.join('\n'));
  console.log('🔗 URLs funcionais salvas em: ./reports/working-checkout-urls.txt');
  
  return results;
}

// Executar testes
testAllCheckoutUrls().catch(console.error);