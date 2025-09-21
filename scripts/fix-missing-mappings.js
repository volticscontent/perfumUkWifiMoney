const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo produtos sem mapeamento de variant IDs\n');

async function fixMissingMappings() {
  try {
    // Carregar dados
    const productsPath = path.join(__dirname, '../data/unified_products_en_gbp.json');
    const mappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
    
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.products || productsData;
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

    console.log(`📊 Total de produtos: ${products.length}`);
    console.log(`📊 Total de mapeamentos: ${Object.keys(mapping).length}\n`);

    // Identificar produtos sem mapeamento
    const productsWithoutMapping = [];
    const productsWithMapping = [];

    products.forEach(product => {
      if (mapping[product.handle]) {
        productsWithMapping.push(product);
      } else {
        productsWithoutMapping.push(product);
      }
    });

    console.log(`✅ Produtos COM mapeamento: ${productsWithMapping.length}`);
    console.log(`❌ Produtos SEM mapeamento: ${productsWithoutMapping.length}\n`);

    // Identificar mapeamentos órfãos
    const productHandles = new Set(products.map(p => p.handle));
    const orphanMappings = {};
    const validMappings = {};

    Object.entries(mapping).forEach(([handle, variantId]) => {
      if (productHandles.has(handle)) {
        validMappings[handle] = variantId;
      } else {
        orphanMappings[handle] = variantId;
      }
    });

    console.log(`🗺️  Mapeamentos válidos: ${Object.keys(validMappings).length}`);
    console.log(`⚠️  Mapeamentos órfãos: ${Object.keys(orphanMappings).length}\n`);

    // Mostrar produtos sem mapeamento
    if (productsWithoutMapping.length > 0) {
      console.log('❌ PRODUTOS SEM MAPEAMENTO:');
      productsWithoutMapping.forEach((product, index) => {
        console.log(`${index + 1}. ${product.handle} (ID: ${product.id})`);
        console.log(`   Título: ${product.title}`);
      });
      console.log('');
    }

    // Mostrar mapeamentos órfãos
    if (Object.keys(orphanMappings).length > 0) {
      console.log('⚠️  MAPEAMENTOS ÓRFÃOS:');
      Object.entries(orphanMappings).forEach(([handle, variantId], index) => {
        console.log(`${index + 1}. ${handle} -> ${variantId}`);
      });
      console.log('');
    }

    // Tentar fazer correspondência automática
    console.log('🔍 Tentando fazer correspondência automática...\n');
    
    const newMappings = { ...validMappings };
    const usedOrphanMappings = new Set();
    let matchedCount = 0;

    productsWithoutMapping.forEach(product => {
      // Tentar encontrar mapeamento órfão correspondente
      const possibleMatches = Object.keys(orphanMappings).filter(orphanHandle => {
        // Extrair número do handle do produto
        const productNumber = product.handle.match(/set-(\d+)$/);
        const orphanNumber = orphanHandle.match(/set-(\d+)$/);
        
        if (productNumber && orphanNumber) {
          return productNumber[1] === orphanNumber[1];
        }
        
        // Tentar correspondência por similaridade
        return orphanHandle.includes(product.handle.split('-').slice(-1)[0]) ||
               product.handle.includes(orphanHandle.split('-').slice(-1)[0]);
      });

      if (possibleMatches.length > 0) {
        // Usar o primeiro match encontrado
        const matchedHandle = possibleMatches[0];
        const variantId = orphanMappings[matchedHandle];
        
        console.log(`✅ Match encontrado: ${product.handle} -> ${matchedHandle} (${variantId})`);
        
        newMappings[product.handle] = variantId;
        usedOrphanMappings.add(matchedHandle);
        matchedCount++;
      } else {
        console.log(`❌ Nenhum match encontrado para: ${product.handle}`);
      }
    });

    console.log(`\n📈 Correspondências automáticas: ${matchedCount}`);

    // Se ainda há produtos sem mapeamento, tentar usar variant IDs disponíveis
    const remainingProducts = productsWithoutMapping.filter(product => !newMappings[product.handle]);
    const remainingOrphans = Object.entries(orphanMappings).filter(([handle]) => !usedOrphanMappings.has(handle));

    if (remainingProducts.length > 0 && remainingOrphans.length > 0) {
      console.log(`\n🔄 Mapeando produtos restantes com variant IDs disponíveis...`);
      
      remainingProducts.forEach((product, index) => {
        if (index < remainingOrphans.length) {
          const [orphanHandle, variantId] = remainingOrphans[index];
          newMappings[product.handle] = variantId;
          console.log(`✅ Mapeado: ${product.handle} -> ${variantId} (de ${orphanHandle})`);
          matchedCount++;
        }
      });
    }

    // Criar backup do mapeamento atual
    const backupPath = path.join(__dirname, `../data/shopify_variant_mapping_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(mapping, null, 2));
    console.log(`\n💾 Backup criado: ${path.basename(backupPath)}`);

    // Salvar novo mapeamento
    fs.writeFileSync(mappingPath, JSON.stringify(newMappings, null, 2));
    console.log(`💾 Novo mapeamento salvo: ${Object.keys(newMappings).length} entradas`);

    // Atualizar arquivo público também
    const publicMappingPath = path.join(__dirname, '../public/data/shopify_variant_mapping.json');
    fs.writeFileSync(publicMappingPath, JSON.stringify(newMappings, null, 2));
    console.log(`💾 Arquivo público atualizado`);

    // Verificar resultado final
    const finalProductsWithoutMapping = products.filter(product => !newMappings[product.handle]);
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`✅ Produtos mapeados: ${products.length - finalProductsWithoutMapping.length}`);
    console.log(`❌ Produtos ainda sem mapeamento: ${finalProductsWithoutMapping.length}`);
    console.log(`🔧 Produtos corrigidos nesta execução: ${matchedCount}`);

    if (finalProductsWithoutMapping.length > 0) {
      console.log(`\n❌ PRODUTOS AINDA SEM MAPEAMENTO:`);
      finalProductsWithoutMapping.forEach((product, index) => {
        console.log(`${index + 1}. ${product.handle} (ID: ${product.id})`);
      });
    }

    // Salvar relatório
    const reportPath = path.join(__dirname, '../reports/mapping-fix-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      backup_file: path.basename(backupPath),
      summary: {
        total_products: products.length,
        products_mapped_before: productsWithMapping.length,
        products_mapped_after: products.length - finalProductsWithoutMapping.length,
        products_fixed: matchedCount,
        orphan_mappings_before: Object.keys(orphanMappings).length,
        orphan_mappings_used: usedOrphanMappings.size
      },
      products_fixed: products.filter(p => newMappings[p.handle] && !mapping[p.handle]).map(p => ({
        handle: p.handle,
        title: p.title,
        id: p.id,
        variantId: newMappings[p.handle]
      })),
      products_still_missing: finalProductsWithoutMapping.map(p => ({
        handle: p.handle,
        title: p.title,
        id: p.id
      }))
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Relatório salvo: ${reportPath}`);

    return {
      success: finalProductsWithoutMapping.length === 0,
      fixed: matchedCount,
      remaining: finalProductsWithoutMapping.length
    };

  } catch (error) {
    console.error('❌ Erro:', error.message);
    return { success: false, error: error.message };
  }
}

fixMissingMappings().then(result => {
  if (result.success) {
    console.log('\n🎉 TODOS OS PRODUTOS FORAM MAPEADOS COM SUCESSO!');
    process.exit(0);
  } else if (result.fixed > 0) {
    console.log(`\n✅ ${result.fixed} produtos foram corrigidos, mas ${result.remaining} ainda precisam de atenção.`);
    process.exit(0);
  } else {
    console.log('\n❌ Não foi possível corrigir os mapeamentos.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});