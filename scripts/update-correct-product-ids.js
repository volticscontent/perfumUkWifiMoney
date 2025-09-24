const fs = require('fs');
const path = require('path');

/**
 * Script para atualizar o mapeamento principal com os IDs corretos validados
 * Usa os dados da validação real para corrigir os IDs incorretos
 */

console.log('🔄 Atualizando mapeamento com IDs corretos validados...');

async function updateProductMapping() {
  try {
    // 1. Carregar dados validados
    const validatedDataPath = path.join(__dirname, '..', 'data', 'store2-valid-products-mapping.json');
    const unifiedProductsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
    
    if (!fs.existsSync(validatedDataPath)) {
      throw new Error('Arquivo de dados validados não encontrado: ' + validatedDataPath);
    }
    
    if (!fs.existsSync(unifiedProductsPath)) {
      throw new Error('Arquivo de produtos unificados não encontrado: ' + unifiedProductsPath);
    }

    console.log('📂 Carregando dados validados...');
    const validatedData = JSON.parse(fs.readFileSync(validatedDataPath, 'utf8'));
    
    console.log('📂 Carregando produtos unificados...');
    const unifiedData = JSON.parse(fs.readFileSync(unifiedProductsPath, 'utf8'));
    
    console.log(`✅ ${Object.keys(validatedData).length} produtos validados carregados`);
    console.log(`✅ ${unifiedData.products.length} produtos unificados carregados`);

    // 2. Criar mapeamento por handle
    const validatedByHandle = {};
    Object.entries(validatedData).forEach(([handle, data]) => {
      validatedByHandle[handle] = data;
    });

    console.log('\n🔄 Iniciando atualização dos produtos...');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // 3. Atualizar cada produto unificado
    unifiedData.products.forEach((product, index) => {
      try {
        const validatedProduct = validatedByHandle[product.handle];
        
        if (validatedProduct) {
          // Atualizar mapeamento da Loja 2 com dados corretos
          if (!product.shopify_mapping) {
            product.shopify_mapping = {};
          }
          
          product.shopify_mapping['2'] = {
            product_id: validatedProduct.product_id,
            variant_id: validatedProduct.variant_id,
            handle: validatedProduct.handle,
            domain: validatedProduct.domain,
            store_name: validatedProduct.store_name,
            sku: validatedProduct.sku,
            title: validatedProduct.title,
            price: validatedProduct.price,
            currency: validatedProduct.currency,
            checkout_url: validatedProduct.checkout_url,
            product_url: validatedProduct.product_url,
            inventory: validatedProduct.inventory,
            validated_at: validatedProduct.validated_at
          };
          
          updatedCount++;
          console.log(`✅ [${index + 1}/${unifiedData.products.length}] ${product.handle} - ID: ${validatedProduct.variant_id}`);
        } else {
          notFoundCount++;
          console.log(`⚠️  [${index + 1}/${unifiedData.products.length}] ${product.handle} - Não encontrado na validação`);
        }
      } catch (error) {
        errorCount++;
        console.log(`❌ [${index + 1}/${unifiedData.products.length}] ${product.handle} - Erro: ${error.message}`);
      }
    });

    // 4. Salvar arquivo atualizado
    console.log('\n💾 Salvando arquivo atualizado...');
    const backupPath = path.join(__dirname, '..', 'data', `unified_products_en_gbp_backup_${Date.now()}.json`);
    
    // Criar backup
    fs.writeFileSync(backupPath, JSON.stringify(unifiedData, null, 2));
    console.log(`📋 Backup criado: ${backupPath}`);
    
    // Salvar arquivo principal atualizado
    fs.writeFileSync(unifiedProductsPath, JSON.stringify(unifiedData, null, 2));
    console.log(`✅ Arquivo principal atualizado: ${unifiedProductsPath}`);

    // 5. Criar relatório de atualização
    const reportData = {
      update_date: new Date().toISOString(),
      source_file: 'store2-valid-products-mapping.json',
      target_file: 'unified_products_en_gbp.json',
      statistics: {
        total_products: unifiedData.products.length,
        updated_products: updatedCount,
        not_found_products: notFoundCount,
        error_products: errorCount,
        success_rate: `${((updatedCount / unifiedData.products.length) * 100).toFixed(1)}%`
      },
      validation_source: {
        store: 'WIFI MONEY (Store 2)',
        domain: 'tpsfragrances.shop',
        myshopify_domain: 'nkgzhm-1d.myshopify.com',
        validated_products: Object.keys(validatedData).length,
        validation_date: validatedData[Object.keys(validatedData)[0]]?.validated_at
      }
    };

    const reportPath = path.join(__dirname, '..', 'data', 'product-ids-update-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // 6. Relatório final
    console.log('\n📊 RELATÓRIO DE ATUALIZAÇÃO:');
    console.log('============================================================');
    console.log(`📦 Total de produtos: ${unifiedData.products.length}`);
    console.log(`✅ Produtos atualizados: ${updatedCount}`);
    console.log(`⚠️  Produtos não encontrados: ${notFoundCount}`);
    console.log(`❌ Produtos com erro: ${errorCount}`);
    console.log(`📈 Taxa de sucesso: ${reportData.statistics.success_rate}`);
    console.log('============================================================');
    
    if (updatedCount > 0) {
      console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('\n📋 Próximos passos:');
      console.log('   1. Verificar arquivo atualizado: unified_products_en_gbp.json');
      console.log('   2. Testar checkout com IDs corretos');
      console.log('   3. Verificar funcionamento no frontend');
      console.log(`   4. Revisar relatório: ${reportPath}`);
    } else {
      console.log('\n⚠️  NENHUM PRODUTO FOI ATUALIZADO');
      console.log('   Verifique se os handles coincidem entre os arquivos');
    }

    return {
      success: true,
      updated: updatedCount,
      total: unifiedData.products.length,
      report: reportData
    };

  } catch (error) {
    console.error('❌ Erro durante atualização:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar atualização
updateProductMapping()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    } else {
      console.log('\n❌ Script falhou:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });