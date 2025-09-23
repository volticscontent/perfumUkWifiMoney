/**
 * Script para testar URLs de checkout da loja 3 (SADERSTORE)
 * Verifica se as URLs estão funcionando corretamente
 */

const fs = require('fs');
const path = require('path');

async function testCheckoutUrls() {
  try {
    console.log('🔍 Testando URLs de checkout da loja 3...\n');

    // Carrega o mapeamento atual
    const mappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
    const variantMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

    // Carrega o mapeamento da loja 3 com URLs
    const store3Path = path.join(__dirname, '../data/store3_checkout_urls.json');
    const store3Mapping = JSON.parse(fs.readFileSync(store3Path, 'utf-8'));

    console.log('📊 Estatísticas:');
    console.log(`   • Produtos no mapeamento atual: ${Object.keys(variantMapping).length}`);
    console.log(`   • Produtos na loja 3: ${Object.keys(store3Mapping).length}\n`);

    // Testa algumas URLs de exemplo
    console.log('🔗 URLs de checkout válidas (primeiros 10 produtos):');
    console.log('─'.repeat(80));

    let count = 0;
    for (const [handle, variantId] of Object.entries(variantMapping)) {
      if (count >= 10) break;
      
      const checkoutUrl = `https://ae888e.myshopify.com/cart/${variantId}:1`;
      const store3Data = store3Mapping[handle];
      
      console.log(`${count + 1}. ${handle}`);
      console.log(`   Variant ID: ${variantId}`);
      console.log(`   URL: ${checkoutUrl}`);
      
      if (store3Data) {
        console.log(`   Preço: £${store3Data.variants[0].price}`);
        console.log(`   ✅ Produto encontrado na loja 3`);
      } else {
        console.log(`   ⚠️  Produto não encontrado na loja 3`);
      }
      console.log('');
      
      count++;
    }

    // Verifica se há variant IDs antigos ainda sendo usados
    console.log('🔍 Verificando variant IDs antigos...');
    const oldVariantId = '50377079914781';
    let foundOldId = false;
    
    for (const [handle, variantId] of Object.entries(variantMapping)) {
      if (variantId === oldVariantId) {
        console.log(`❌ ENCONTRADO ID ANTIGO: ${handle} → ${variantId}`);
        foundOldId = true;
      }
    }
    
    if (!foundOldId) {
      console.log('✅ Nenhum variant ID antigo encontrado no mapeamento atual');
    }

    // Gera URL de teste para o primeiro produto
    const firstHandle = Object.keys(variantMapping)[0];
    const firstVariantId = variantMapping[firstHandle];
    const testUrl = `https://ae888e.myshopify.com/cart/${firstVariantId}:1`;
    
    console.log('\n🧪 URL de teste recomendada:');
    console.log(`Produto: ${firstHandle}`);
    console.log(`URL: ${testUrl}`);
    
    // Salva um arquivo com URLs de teste
    const testUrls = {};
    let testCount = 0;
    for (const [handle, variantId] of Object.entries(variantMapping)) {
      if (testCount >= 5) break;
      testUrls[handle] = {
        variantId,
        checkoutUrl: `https://ae888e.myshopify.com/cart/${variantId}:1`,
        directUrl: `https://tpsperfumeshop.shop/cart/${variantId}:1`
      };
      testCount++;
    }
    
    const testUrlsPath = path.join(__dirname, '../data/test_checkout_urls.json');
    fs.writeFileSync(testUrlsPath, JSON.stringify(testUrls, null, 2));
    
    console.log(`\n📁 URLs de teste salvas em: ${testUrlsPath}`);
    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

// Executa o teste
testCheckoutUrls();