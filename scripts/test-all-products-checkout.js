const fs = require('fs');
const path = require('path');

console.log('🛒 Testando checkout para TODOS os produtos\n');

async function testAllProductsCheckout() {
  try {
    // Carregar dados
    const productsPath = path.join(__dirname, '../data/unified_products_en_gbp.json');
    const mappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
    
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.products || productsData;
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

    console.log(`📊 Total de produtos: ${products.length}`);
    console.log(`📊 Total de mapeamentos: ${Object.keys(mapping).length}\n`);

    // Testar cada produto
    const results = {
      working: [],
      notWorking: [],
      errors: []
    };

    console.log('🔍 Testando cada produto:\n');

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `[${i + 1}/${products.length}]`;
      
      try {
        // Simular a função getShopifyVariantIdByHandle
        const variantId = mapping[product.handle];
        
        if (!variantId) {
          console.log(`${progress} ❌ ${product.handle} - SEM VARIANT ID`);
          results.notWorking.push({
            handle: product.handle,
            title: product.title,
            id: product.id,
            reason: 'Sem variant ID no mapeamento'
          });
          continue;
        }

        // Verificar se o variant ID é válido (numérico)
        if (!/^\d+$/.test(variantId)) {
          console.log(`${progress} ❌ ${product.handle} - VARIANT ID INVÁLIDO: ${variantId}`);
          results.notWorking.push({
            handle: product.handle,
            title: product.title,
            id: product.id,
            variantId: variantId,
            reason: 'Variant ID não é numérico'
          });
          continue;
        }

        // Simular criação do item do carrinho
        const cartItem = {
          id: product.id,
          shopifyId: variantId,
          storeId: "1",
          title: product.title,
          subtitle: 'Eau de Parfum Spray - 100ML',
          price: typeof product.price?.regular === 'string' ? parseFloat(product.price.regular) : (product.price?.regular || product.price || 0),
          image: Array.isArray(product.images) ? product.images[0] : (product.images?.main?.[0] || 'placeholder.jpg')
        };

        console.log(`${progress} ✅ ${product.handle} - OK (${variantId})`);
        results.working.push({
          handle: product.handle,
          title: product.title,
          id: product.id,
          variantId: variantId,
          cartItem: cartItem
        });

      } catch (error) {
        console.log(`${progress} 💥 ${product.handle} - ERRO: ${error.message}`);
        results.errors.push({
          handle: product.handle,
          title: product.title,
          id: product.id,
          error: error.message
        });
      }
    }

    // Relatório final
    console.log('\n📈 RELATÓRIO FINAL:\n');
    console.log(`✅ Produtos funcionando: ${results.working.length}`);
    console.log(`❌ Produtos com problemas: ${results.notWorking.length}`);
    console.log(`💥 Produtos com erros: ${results.errors.length}`);

    // Mostrar produtos com problemas
    if (results.notWorking.length > 0) {
      console.log('\n❌ PRODUTOS COM PROBLEMAS:');
      results.notWorking.forEach((product, index) => {
        console.log(`${index + 1}. ${product.handle}`);
        console.log(`   Título: ${product.title}`);
        console.log(`   Razão: ${product.reason}`);
        if (product.variantId) {
          console.log(`   Variant ID: ${product.variantId}`);
        }
        console.log('');
      });
    }

    // Mostrar produtos com erros
    if (results.errors.length > 0) {
      console.log('\n💥 PRODUTOS COM ERROS:');
      results.errors.forEach((product, index) => {
        console.log(`${index + 1}. ${product.handle}`);
        console.log(`   Título: ${product.title}`);
        console.log(`   Erro: ${product.error}`);
        console.log('');
      });
    }

    // Verificar mapeamentos órfãos
    console.log('\n🔍 VERIFICANDO MAPEAMENTOS ÓRFÃOS:');
    const productHandles = new Set(products.map(p => p.handle));
    const orphanMappings = [];

    Object.keys(mapping).forEach(handle => {
      if (!productHandles.has(handle)) {
        orphanMappings.push(handle);
      }
    });

    if (orphanMappings.length > 0) {
      console.log(`⚠️  Encontrados ${orphanMappings.length} mapeamentos órfãos:`);
      orphanMappings.slice(0, 10).forEach((handle, index) => {
        console.log(`${index + 1}. ${handle} -> ${mapping[handle]}`);
      });
      if (orphanMappings.length > 10) {
        console.log(`   ... e mais ${orphanMappings.length - 10} mapeamentos órfãos`);
      }
    } else {
      console.log('✅ Nenhum mapeamento órfão encontrado');
    }

    // Salvar relatório detalhado
    const reportPath = path.join(__dirname, '../reports/checkout-test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_products: products.length,
        working: results.working.length,
        not_working: results.notWorking.length,
        errors: results.errors.length,
        orphan_mappings: orphanMappings.length
      },
      working_products: results.working,
      problematic_products: results.notWorking,
      error_products: results.errors,
      orphan_mappings: orphanMappings
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Relatório salvo em: ${reportPath}`);

    // Retornar resultado
    return {
      success: results.notWorking.length === 0 && results.errors.length === 0,
      workingCount: results.working.length,
      problemCount: results.notWorking.length + results.errors.length
    };

  } catch (error) {
    console.error('❌ Erro fatal no teste:', error.message);
    return { success: false, error: error.message };
  }
}

testAllProductsCheckout().then(result => {
  if (result.success) {
    console.log('\n🎉 TODOS OS PRODUTOS ESTÃO FUNCIONANDO!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${result.problemCount} produtos ainda têm problemas.`);
    console.log('Verifique o relatório para mais detalhes.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});