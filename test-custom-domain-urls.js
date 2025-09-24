const fs = require('fs');
const https = require('https');
const http = require('http');

// Carregar mapeamento de variantes
const variantMapping = JSON.parse(fs.readFileSync('./data/shopify_variant_mapping.json', 'utf8'));

// Domínio personalizado da Loja 2 (WIFI MONEY)
const CUSTOM_DOMAIN = 'tpsfragrances.shop';

// Função para testar URL
function testUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 400,
        headers: res.headers,
        location: res.headers.location || null
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

async function testCustomDomainUrls() {
  console.log(`🧪 Testando URLs de checkout no domínio personalizado: ${CUSTOM_DOMAIN}\n`);
  
  const results = [];
  const products = Object.keys(variantMapping);
  
  console.log(`📦 Total de produtos a testar: ${products.length}\n`);
  
  // Testar apenas os primeiros 10 produtos para começar
  const testProducts = products.slice(0, 10);
  
  for (let i = 0; i < testProducts.length; i++) {
    const handle = testProducts[i];
    const variantId = variantMapping[handle];
    const checkoutUrl = `https://${CUSTOM_DOMAIN}/cart/${variantId}:1`;
    
    console.log(`[${i + 1}/${testProducts.length}] Testando: ${handle}`);
    console.log(`🔗 URL: ${checkoutUrl}`);
    
    const result = await testUrl(checkoutUrl);
    results.push({
      handle,
      variantId,
      ...result
    });
    
    if (result.success) {
      console.log(`✅ Status: ${result.status} - OK`);
      if (result.location) {
        console.log(`   Redirecionado para: ${result.location}`);
      }
    } else {
      console.log(`❌ Status: ${result.status} - ERRO`);
      if (result.error) {
        console.log(`   Erro: ${result.error}`);
      }
    }
    console.log('');
    
    // Pequena pausa para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Resumo dos resultados
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('📊 RESUMO DOS TESTES (Primeiros 10 produtos):');
  console.log(`✅ URLs funcionando: ${successful.length}`);
  console.log(`❌ URLs com erro: ${failed.length}`);
  console.log(`📈 Taxa de sucesso: ${((successful.length / results.length) * 100).toFixed(1)}%\n`);
  
  if (successful.length > 0) {
    console.log('✅ URLs funcionais encontradas:');
    successful.forEach(result => {
      console.log(`   - ${result.handle}: ${result.url}`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('❌ URLs com problemas:');
    failed.forEach(result => {
      console.log(`   - ${result.handle}: ${result.status} (${result.url})`);
    });
    console.log('');
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    domain: CUSTOM_DOMAIN,
    total_tested: results.length,
    successful_urls: successful.length,
    failed_urls: failed.length,
    success_rate: ((successful.length / results.length) * 100).toFixed(1) + '%',
    results: results
  };
  
  fs.writeFileSync('./reports/custom-domain-test-report.json', JSON.stringify(report, null, 2));
  console.log('💾 Relatório salvo em: ./reports/custom-domain-test-report.json');
  
  // Criar lista de URLs funcionais
  if (successful.length > 0) {
    const workingUrls = successful.map(r => r.url);
    fs.writeFileSync('./reports/working-custom-domain-urls.txt', workingUrls.join('\n'));
    console.log('🔗 URLs funcionais salvas em: ./reports/working-custom-domain-urls.txt');
    
    // Se encontrou URLs funcionais, testar todos os produtos
    if (successful.length > 0) {
      console.log('\n🚀 URLs funcionais encontradas! Testando todos os produtos...\n');
      await testAllProducts();
    }
  }
  
  return results;
}

async function testAllProducts() {
  const results = [];
  const products = Object.keys(variantMapping);
  
  for (let i = 0; i < products.length; i++) {
    const handle = products[i];
    const variantId = variantMapping[handle];
    const checkoutUrl = `https://${CUSTOM_DOMAIN}/cart/${variantId}:1`;
    
    console.log(`[${i + 1}/${products.length}] ${handle}: ${checkoutUrl}`);
    
    const result = await testUrl(checkoutUrl);
    results.push({
      handle,
      variantId,
      url: checkoutUrl,
      status: result.status,
      success: result.success
    });
    
    // Pequena pausa
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Salvar todas as URLs
  const allWorkingUrls = results.filter(r => r.success).map(r => r.url);
  fs.writeFileSync('./reports/all-working-urls.txt', allWorkingUrls.join('\n'));
  console.log(`\n✅ Total de URLs funcionais: ${allWorkingUrls.length}/${results.length}`);
  console.log('🔗 Todas as URLs funcionais salvas em: ./reports/all-working-urls.txt');
}

// Executar testes
testCustomDomainUrls().catch(console.error);