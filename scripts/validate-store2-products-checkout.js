const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configurações da Loja 2 (WIFI MONEY)
const STORE_CONFIG = {
  domain: 'nkgzhm-1d.myshopify.com',
  storefrontToken: process.env.SHOPIFY_STORE_2_STOREFRONT_TOKEN || '9b421e903c88a8587d1c9130e772c8be',
  adminToken: process.env.SHOPIFY_STORE_2_ADMIN_TOKEN,
  publicDomain: 'tpsfragrances.shop'
};

// Verificar se o token admin está configurado
if (!STORE_CONFIG.adminToken) {
  console.error('❌ ERRO: SHOPIFY_STORE_2_ADMIN_TOKEN não encontrado nas variáveis de ambiente');
  console.error('Configure a variável de ambiente antes de executar o script');
  process.exit(1);
}

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          redirected: res.statusCode >= 300 && res.statusCode < 400,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Função para buscar produtos via Admin API
async function fetchAllProductsAdmin() {
  let allProducts = [];
  let nextPageInfo = null;
  let page = 1;

  console.log('🔍 Buscando produtos via Admin API...');

  while (true) {
    try {
      let url = `https://${STORE_CONFIG.domain}/admin/api/2023-10/products.json?limit=250`;
      if (nextPageInfo) {
        url += `&page_info=${nextPageInfo}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': STORE_CONFIG.adminToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const products = result.products || [];
      
      allProducts = allProducts.concat(products);
      console.log(`📦 Página ${page}: ${products.length} produtos (Total: ${allProducts.length})`);

      // Verificar se há próxima página
      const linkHeader = response.headers.get('link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        if (nextMatch) {
          nextPageInfo = nextMatch[1];
          page++;
        } else {
          break;
        }
      } else {
        break;
      }

      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Erro ao buscar página ${page}:`, error.message);
      break;
    }
  }

  return allProducts;
}

// Função para testar URL de checkout
async function testCheckoutUrl(product, variant) {
  const variantId = variant.id;
  const productHandle = product.handle;
  
  const checkoutUrls = [
    // URLs de carrinho direto
    `https://${STORE_CONFIG.domain}/cart/${variantId}:1`,
    `https://${STORE_CONFIG.publicDomain}/cart/${variantId}:1`,
    
    // URLs de produto
    `https://${STORE_CONFIG.domain}/products/${productHandle}`,
    `https://${STORE_CONFIG.publicDomain}/products/${productHandle}`,
    
    // URLs de checkout com variant
    `https://${STORE_CONFIG.domain}/cart/add?id=${variantId}&quantity=1`,
    `https://${STORE_CONFIG.publicDomain}/cart/add?id=${variantId}&quantity=1`
  ];

  const results = [];

  for (const url of checkoutUrls) {
    try {
      const response = await makeRequest(url);
      
      const isWorking = response.statusCode === 200 || 
                       response.statusCode === 302 || 
                       response.statusCode === 303;
      
      const urlType = url.includes('/cart/') ? 'cart' : 
                     url.includes('/products/') ? 'product' : 'checkout';
      
      results.push({
        url,
        statusCode: response.statusCode,
        working: isWorking,
        redirected: response.redirected,
        type: urlType
      });

      if (isWorking) {
        console.log(`  ✅ ${urlType.toUpperCase()}: ${url} (${response.statusCode})`);
      } else {
        console.log(`  ❌ ${urlType.toUpperCase()}: ${url} (${response.statusCode})`);
      }
    } catch (error) {
      console.log(`  ❌ ERRO: ${url} - ${error.message}`);
      results.push({
        url,
        statusCode: null,
        working: false,
        error: error.message,
        type: url.includes('/cart/') ? 'cart' : 
              url.includes('/products/') ? 'product' : 'checkout'
      });
    }
  }

  return results;
}

// Função principal
async function validateAllProducts() {
  console.log('🚀 Iniciando validação completa dos produtos da Loja 2');
  console.log('=' .repeat(60));

  const startTime = Date.now();
  
  try {
    // 1. Buscar todos os produtos via Admin API
    const products = await fetchAllProductsAdmin();
    console.log(`\n📊 Total de produtos encontrados: ${products.length}`);

    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado. Verifique as credenciais.');
      return;
    }

    const validationResults = {
      totalProducts: products.length,
      validProducts: [],
      invalidProducts: [],
      summary: {
        workingCheckouts: 0,
        brokenCheckouts: 0,
        workingProductPages: 0,
        brokenProductPages: 0,
        totalVariants: 0
      },
      timestamp: new Date().toISOString(),
      store: 'WIFI MONEY (Store 2)',
      domain: STORE_CONFIG.domain
    };

    // 2. Testar cada produto
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `[${i + 1}/${products.length}]`;
      
      console.log(`\n${progress} 🧪 ${product.title}`);
      console.log(`  Handle: ${product.handle}`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Status: ${product.status}`);
      console.log(`  Variantes: ${product.variants.length}`);

      if (!product.variants || product.variants.length === 0) {
        console.log('  ⚠️  Produto sem variantes, pulando...');
        validationResults.invalidProducts.push({
          product: {
            id: product.id,
            handle: product.handle,
            title: product.title,
            status: product.status
          },
          reason: 'No variants available',
          checkoutResults: []
        });
        continue;
      }

      // Testar primeira variante disponível
      const availableVariant = product.variants.find(v => v.inventory_quantity > 0) || product.variants[0];
      validationResults.summary.totalVariants += product.variants.length;

      console.log(`  Testando variante: ${availableVariant.id} (${availableVariant.title || 'Default'})`);
      console.log(`  Preço: ${availableVariant.price} | Estoque: ${availableVariant.inventory_quantity}`);

      // Testar URLs de checkout
      const checkoutResults = await testCheckoutUrl(product, availableVariant);
      
      // Verificar se pelo menos uma URL funciona
      const hasWorkingCheckout = checkoutResults.some(r => r.working && r.type === 'cart');
      const hasWorkingProductPage = checkoutResults.some(r => r.working && r.type === 'product');

      const productData = {
        product: {
          id: product.id,
          handle: product.handle,
          title: product.title,
          vendor: product.vendor,
          product_type: product.product_type,
          status: product.status,
          created_at: product.created_at,
          updated_at: product.updated_at,
          tags: product.tags
        },
        variant: {
          id: availableVariant.id,
          title: availableVariant.title,
          sku: availableVariant.sku,
          price: availableVariant.price,
          inventory_quantity: availableVariant.inventory_quantity,
          weight: availableVariant.weight,
          requires_shipping: availableVariant.requires_shipping
        },
        checkoutResults,
        hasWorkingCheckout,
        hasWorkingProductPage,
        allVariants: product.variants.map(v => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          price: v.price,
          inventory_quantity: v.inventory_quantity
        }))
      };

      if (hasWorkingCheckout || hasWorkingProductPage) {
        validationResults.validProducts.push(productData);
        validationResults.summary.workingCheckouts += hasWorkingCheckout ? 1 : 0;
        validationResults.summary.workingProductPages += hasWorkingProductPage ? 1 : 0;
        console.log(`  ✅ VÁLIDO - Checkout: ${hasWorkingCheckout ? 'OK' : 'FALHA'}, Página: ${hasWorkingProductPage ? 'OK' : 'FALHA'}`);
      } else {
        validationResults.invalidProducts.push(productData);
        validationResults.summary.brokenCheckouts++;
        console.log(`  ❌ INVÁLIDO - Nenhuma URL funcionando`);
      }

      // Pausa entre produtos
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Gerar relatório
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('='.repeat(60));
    console.log(`⏱️  Tempo de execução: ${duration} segundos`);
    console.log(`📦 Total de produtos: ${validationResults.totalProducts}`);
    console.log(`🔢 Total de variantes: ${validationResults.summary.totalVariants}`);
    console.log(`✅ Produtos válidos: ${validationResults.validProducts.length}`);
    console.log(`❌ Produtos inválidos: ${validationResults.invalidProducts.length}`);
    console.log(`🛒 Checkouts funcionando: ${validationResults.summary.workingCheckouts}`);
    console.log(`📄 Páginas funcionando: ${validationResults.summary.workingProductPages}`);
    
    const successRate = ((validationResults.validProducts.length / validationResults.totalProducts) * 100).toFixed(1);
    console.log(`📈 Taxa de sucesso: ${successRate}%`);

    // 4. Salvar resultados detalhados
    const reportPath = path.join(__dirname, '..', 'data', 'store2-checkout-validation-detailed.json');
    fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
    console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);

    // 5. Gerar mapeamento apenas dos produtos válidos
    const validMapping = {};
    validationResults.validProducts.forEach(item => {
      const workingCartUrl = item.checkoutResults.find(r => r.working && r.type === 'cart');
      const workingProductUrl = item.checkoutResults.find(r => r.working && r.type === 'product');
      
      validMapping[item.product.handle] = {
        product_id: item.product.id,
        variant_id: item.variant.id,
        handle: item.product.handle,
        title: item.product.title,
        price: parseFloat(item.variant.price),
        currency: 'GBP',
        sku: item.variant.sku,
        domain: STORE_CONFIG.publicDomain,
        store_name: "WIFI MONEY (Store 2)",
        checkout_url: workingCartUrl ? workingCartUrl.url : null,
        product_url: workingProductUrl ? workingProductUrl.url : null,
        inventory: item.variant.inventory_quantity,
        validated_at: new Date().toISOString(),
        all_variants: item.allVariants
      };
    });

    const mappingPath = path.join(__dirname, '..', 'data', 'store2-valid-products-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(validMapping, null, 2));
    console.log(`💾 Mapeamento de produtos válidos salvo em: ${mappingPath}`);

    // 6. Gerar resumo executivo
    const summaryPath = path.join(__dirname, '..', 'data', 'store2-validation-summary.json');
    const summary = {
      validation_date: new Date().toISOString(),
      store: 'WIFI MONEY (Store 2)',
      domain: STORE_CONFIG.domain,
      total_products: validationResults.totalProducts,
      valid_products: validationResults.validProducts.length,
      invalid_products: validationResults.invalidProducts.length,
      success_rate: successRate + '%',
      execution_time: duration + ' seconds',
      working_checkouts: validationResults.summary.workingCheckouts,
      working_product_pages: validationResults.summary.workingProductPages,
      total_variants: validationResults.summary.totalVariants
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`💾 Resumo executivo salvo em: ${summaryPath}`);

    console.log('\n🎉 Validação concluída com sucesso!');
    console.log(`\n📋 Próximos passos:`);
    console.log(`   1. Revisar produtos inválidos em: ${reportPath}`);
    console.log(`   2. Usar mapeamento válido em: ${mappingPath}`);
    console.log(`   3. Atualizar sistema com apenas produtos funcionais`);
    
    return validationResults;

  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  validateAllProducts()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { validateAllProducts, testCheckoutUrl, fetchAllProductsAdmin };