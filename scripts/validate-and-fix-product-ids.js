/**
 * Script para validar e corrigir IDs dos produtos no gerador de URL
 * Verifica se estamos usando variant IDs corretos e testa as URLs geradas
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurações
const STORE2_DOMAIN = 'nkgzhm-1d.myshopify.com';
const TIMEOUT = 10000;

/**
 * Carrega os dados dos produtos da Store 2
 */
function loadStore2Products() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'store2-products-detailed-report.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erro ao carregar produtos da Store 2:', error.message);
    return null;
  }
}

/**
 * Testa se uma URL de checkout funciona
 */
function testCheckoutUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        success: true,
        statusCode: res.statusCode,
        redirected: res.statusCode >= 300 && res.statusCode < 400,
        finalUrl: res.headers.location || url
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

/**
 * Gera URL de checkout usando variant ID
 */
function generateCheckoutUrl(variantId, quantity = 1) {
  return `https://${STORE2_DOMAIN}/cart/${variantId}:${quantity}`;
}

/**
 * Valida todos os produtos e seus IDs
 */
async function validateProductIds() {
  console.log('🔍 Validando IDs dos produtos da Store 2...\n');
  
  const data = loadStore2Products();
  if (!data || !data.products) {
    console.log('❌ Não foi possível carregar os dados dos produtos');
    return;
  }

  const products = data.products;
  console.log(`📊 Total de produtos: ${products.length}`);
  console.log(`🏪 Domínio: ${STORE2_DOMAIN}\n`);

  const results = {
    valid: [],
    invalid: [],
    summary: {
      total: products.length,
      validCount: 0,
      invalidCount: 0,
      productIdVsVariantId: {
        same: 0,
        different: 0
      }
    }
  };

  // Testa cada produto
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;
    
    console.log(`${progress} Testando: ${product.handle}`);
    
    // Pega o primeiro variant (assumindo que cada produto tem apenas 1 variant)
    const variant = product.variants[0];
    
    if (!variant) {
      console.log(`  ❌ Produto sem variants`);
      continue;
    }

    // Compara product ID vs variant ID
    const productId = product.productId;
    const variantId = variant.variantId;
    const idsAreSame = productId === variantId;
    
    if (idsAreSame) {
      results.summary.productIdVsVariantId.same++;
    } else {
      results.summary.productIdVsVariantId.different++;
    }

    // Gera URLs para testar
    const variantUrl = generateCheckoutUrl(variantId);
    const productUrl = generateCheckoutUrl(productId);

    // Testa URL com variant ID
    console.log(`  🧪 Testando variant ID: ${variantId}`);
    const variantResult = await testCheckoutUrl(variantUrl);
    
    // Testa URL com product ID (se diferente)
    let productResult = null;
    if (!idsAreSame) {
      console.log(`  🧪 Testando product ID: ${productId}`);
      productResult = await testCheckoutUrl(productUrl);
    }

    const productData = {
      handle: product.handle,
      title: product.title,
      productId: productId,
      variantId: variantId,
      sku: variant.sku,
      price: variant.price,
      idsAreSame: idsAreSame,
      variantUrl: variantUrl,
      variantTest: variantResult,
      productUrl: idsAreSame ? null : productUrl,
      productTest: productResult,
      recommendedId: variantId, // Sempre recomendamos variant ID
      recommendedUrl: variantUrl
    };

    // Determina se é válido (variant ID deve funcionar)
    if (variantResult.success && (variantResult.statusCode === 200 || variantResult.redirected)) {
      results.valid.push(productData);
      results.summary.validCount++;
      console.log(`  ✅ Válido (${variantResult.statusCode})`);
    } else {
      results.invalid.push(productData);
      results.summary.invalidCount++;
      console.log(`  ❌ Inválido (${variantResult.error || variantResult.statusCode})`);
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Salva resultados
  const outputPath = path.join(__dirname, '..', 'data', 'product-ids-validation-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Exibe resumo
  console.log('\n' + '='.repeat(60));
  console.log('📋 RELATÓRIO DE VALIDAÇÃO DE IDs');
  console.log('='.repeat(60));
  console.log(`📊 Total de produtos: ${results.summary.total}`);
  console.log(`✅ URLs válidas: ${results.summary.validCount} (${(results.summary.validCount/results.summary.total*100).toFixed(1)}%)`);
  console.log(`❌ URLs inválidas: ${results.summary.invalidCount} (${(results.summary.invalidCount/results.summary.total*100).toFixed(1)}%)`);
  console.log(`\n🔍 Comparação Product ID vs Variant ID:`);
  console.log(`   Iguais: ${results.summary.productIdVsVariantId.same}`);
  console.log(`   Diferentes: ${results.summary.productIdVsVariantId.different}`);
  console.log(`\n💾 Relatório salvo em: ${outputPath}`);

  // Recomendações
  console.log('\n🎯 RECOMENDAÇÕES:');
  console.log('1. ✅ Sempre usar VARIANT ID para URLs de checkout');
  console.log('2. ✅ Domínio myshopify.com já corrigido no clientCheckout.ts');
  console.log('3. ✅ Testar URLs antes de usar em produção');
  
  if (results.summary.productIdVsVariantId.different > 0) {
    console.log(`4. ⚠️  ${results.summary.productIdVsVariantId.different} produtos têm Product ID ≠ Variant ID`);
  }

  return results;
}

// Executa validação
if (require.main === module) {
  validateProductIds().catch(console.error);
}

module.exports = { validateProductIds, generateCheckoutUrl };