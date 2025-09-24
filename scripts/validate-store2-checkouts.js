const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Script para validar todas as URLs de checkout da Loja 2 (WIFI MONEY)
 * Testa cada link de checkout e verifica se está funcionando corretamente
 */

console.log('🔍 Validador de Checkout - Loja 2 (WIFI MONEY)');
console.log('================================================\n');

// Configurações
const TIMEOUT = 10000; // 10 segundos
const MAX_CONCURRENT = 5; // Máximo de requisições simultâneas
const DELAY_BETWEEN_REQUESTS = 1000; // 1 segundo entre requisições

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: true,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data,
          redirected: res.statusCode >= 300 && res.statusCode < 400,
          finalUrl: res.headers.location || url
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        statusCode: null,
        statusMessage: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        statusCode: null,
        statusMessage: null
      });
    });

    req.end();
  });
}

// Função para analisar resposta do checkout
function analyzeCheckoutResponse(response, productInfo) {
  const analysis = {
    isValid: false,
    isCheckoutPage: false,
    hasCartItems: false,
    hasErrors: false,
    redirectedToLogin: false,
    redirectedToHome: false,
    issues: []
  };

  if (!response.success) {
    analysis.issues.push(`Erro de conexão: ${response.error}`);
    return analysis;
  }

  // Verificar código de status
  if (response.statusCode === 200) {
    analysis.isValid = true;
  } else if (response.statusCode >= 300 && response.statusCode < 400) {
    analysis.issues.push(`Redirecionamento: ${response.statusCode} -> ${response.finalUrl}`);
    
    if (response.finalUrl.includes('/account/login')) {
      analysis.redirectedToLogin = true;
      analysis.issues.push('Redirecionado para página de login');
    } else if (response.finalUrl === '/' || response.finalUrl.includes('/collections')) {
      analysis.redirectedToHome = true;
      analysis.issues.push('Redirecionado para página inicial');
    }
  } else if (response.statusCode >= 400) {
    analysis.issues.push(`Erro HTTP: ${response.statusCode} - ${response.statusMessage}`);
    return analysis;
  }

  // Analisar conteúdo da página
  if (response.body) {
    const bodyLower = response.body.toLowerCase();
    
    // Verificar se é página de checkout/carrinho
    if (bodyLower.includes('checkout') || bodyLower.includes('cart') || bodyLower.includes('carrinho')) {
      analysis.isCheckoutPage = true;
    }
    
    // Verificar se tem itens no carrinho
    if (bodyLower.includes('cart-item') || bodyLower.includes('line-item') || 
        bodyLower.includes('product-title') || bodyLower.includes(productInfo.sku.toLowerCase())) {
      analysis.hasCartItems = true;
    }
    
    // Verificar erros comuns
    if (bodyLower.includes('product not found') || bodyLower.includes('variant not found') ||
        bodyLower.includes('404') || bodyLower.includes('not found')) {
      analysis.hasErrors = true;
      analysis.issues.push('Produto ou variante não encontrado');
    }
    
    if (bodyLower.includes('out of stock') || bodyLower.includes('sold out')) {
      analysis.issues.push('Produto fora de estoque');
    }
  }

  return analysis;
}

// Função para validar um produto
async function validateProduct(productHandle, productInfo, index, total) {
  // Gerar URL de checkout baseada nos dados reais
  const url = `https://tpsfragrances.shop/cart/${productInfo.variantId}:1`;
  
  console.log(`\n[${index + 1}/${total}] Testando produto: ${productInfo.title}`);
  console.log(`Handle: ${productHandle}`);
  console.log(`Variant ID: ${productInfo.variantId}`);
  console.log(`URL: ${url}`);
  
  const startTime = Date.now();
  const response = await makeRequest(url);
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  const analysis = analyzeCheckoutResponse(response, productInfo);
  
  const result = {
    productHandle,
    productInfo,
    url,
    response: {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      success: response.success,
      error: response.error,
      responseTime
    },
    analysis,
    timestamp: new Date().toISOString()
  };
  
  // Log do resultado
  if (analysis.isValid && analysis.isCheckoutPage) {
    console.log(`✅ SUCESSO (${responseTime}ms)`);
  } else if (analysis.redirectedToLogin) {
    console.log(`⚠️  REDIRECIONADO PARA LOGIN (${responseTime}ms)`);
  } else if (analysis.hasErrors) {
    console.log(`❌ ERRO: ${analysis.issues.join(', ')} (${responseTime}ms)`);
  } else {
    console.log(`⚠️  AVISO: ${analysis.issues.join(', ')} (${responseTime}ms)`);
  }
  
  return result;
}

// Função para gerar relatório
function generateReport(results) {
  const report = {
    summary: {
      total: results.length,
      successful: 0,
      failed: 0,
      warnings: 0,
      redirectedToLogin: 0,
      hasErrors: 0,
      averageResponseTime: 0
    },
    details: results,
    issues: {},
    recommendations: [],
    generatedAt: new Date().toISOString()
  };
  
  let totalResponseTime = 0;
  
  results.forEach(result => {
    totalResponseTime += result.response.responseTime;
    
    if (result.analysis.isValid && result.analysis.isCheckoutPage) {
      report.summary.successful++;
    } else if (result.analysis.hasErrors) {
      report.summary.failed++;
    } else {
      report.summary.warnings++;
    }
    
    if (result.analysis.redirectedToLogin) {
      report.summary.redirectedToLogin++;
    }
    
    if (result.analysis.hasErrors) {
      report.summary.hasErrors++;
    }
    
    // Agrupar issues
    result.analysis.issues.forEach(issue => {
      if (!report.issues[issue]) {
        report.issues[issue] = 0;
      }
      report.issues[issue]++;
    });
  });
  
  report.summary.averageResponseTime = Math.round(totalResponseTime / results.length);
  
  // Gerar recomendações
  if (report.summary.redirectedToLogin > 0) {
    report.recommendations.push('Verificar se os IDs de variantes estão corretos na Loja 2');
    report.recommendations.push('Confirmar se os produtos existem na loja WIFI MONEY');
  }
  
  if (report.summary.hasErrors > 0) {
    report.recommendations.push('Verificar produtos com erro "not found"');
    report.recommendations.push('Validar mapeamento de variantes com a API da Shopify');
  }
  
  if (report.summary.averageResponseTime > 5000) {
    report.recommendations.push('Tempo de resposta alto - verificar performance da loja');
  }
  
  return report;
}

// Função principal
async function validateAllCheckouts() {
  try {
    // Carregar mapeamento de checkout
    const mappingPath = path.join(__dirname, '..', 'data', 'store2-checkout-mapping.json');
    
    if (!fs.existsSync(mappingPath)) {
      throw new Error('Arquivo de mapeamento não encontrado: ' + mappingPath);
    }
    
    const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    const productIds = Object.keys(mappings);
    
    console.log(`🏪 Loja: WIFI MONEY (Store 2)`);
    console.log(`📍 Domínio: tpsfragrances.shop`);
    console.log(`📦 Total de produtos para validar: ${productIds.length}\n`);
    
    const results = [];
    
    // Validar produtos em lotes
    for (let i = 0; i < productIds.length; i++) {
      const productHandle = productIds[i];
      const productInfo = mappings[productHandle];
      
      const result = await validateProduct(productHandle, productInfo, i, productIds.length);
      results.push(result);
      
      // Delay entre requisições para não sobrecarregar o servidor
      if (i < productIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }
    
    // Gerar relatório
    console.log('\n📊 Gerando relatório...');
    const report = generateReport(results);
    
    // Salvar relatório
    const reportPath = path.join(__dirname, '..', 'data', 'store2-checkout-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Salvar relatório resumido
    const summaryPath = path.join(__dirname, '..', 'data', 'store2-validation-summary.json');
    const summary = {
      store: {
        storeName: 'WIFI MONEY (Store 2)',
        domain: 'tpsfragrances.shop',
        myshopifyDomain: 'nkgzhm-1d.myshopify.com'
      },
      summary: report.summary,
      issues: report.issues,
      recommendations: report.recommendations,
      generatedAt: report.generatedAt
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Exibir relatório final
    console.log('\n📋 RELATÓRIO FINAL:');
    console.log('==================');
    console.log(`✅ Sucessos: ${report.summary.successful}/${report.summary.total}`);
    console.log(`❌ Falhas: ${report.summary.failed}/${report.summary.total}`);
    console.log(`⚠️  Avisos: ${report.summary.warnings}/${report.summary.total}`);
    console.log(`🔐 Redirecionados para login: ${report.summary.redirectedToLogin}`);
    console.log(`⏱️  Tempo médio de resposta: ${report.summary.averageResponseTime}ms`);
    
    if (Object.keys(report.issues).length > 0) {
      console.log('\n🚨 ISSUES ENCONTRADAS:');
      Object.entries(report.issues).forEach(([issue, count]) => {
        console.log(`   ${issue}: ${count} ocorrências`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n📄 Relatório completo salvo em: ${reportPath}`);
    console.log(`📄 Resumo salvo em: ${summaryPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
    throw error;
  }
}

// Executar o script
if (require.main === module) {
  console.log('🚀 Iniciando validação de checkouts da Loja 2...\n');
  
  validateAllCheckouts()
    .then((report) => {
      console.log('\n✅ Validação concluída com sucesso!');
      
      const successRate = Math.round((report.summary.successful / report.summary.total) * 100);
      console.log(`📊 Taxa de sucesso: ${successRate}%`);
      
      if (successRate < 80) {
        console.log('⚠️  Taxa de sucesso baixa - revisar configurações');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.log('\n❌ Falha na validação');
      process.exit(1);
    });
}

module.exports = { validateAllCheckouts };