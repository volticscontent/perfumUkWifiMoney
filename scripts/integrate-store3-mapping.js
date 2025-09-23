/**
 * Script para integrar o mapeamento da loja 3 ao sistema principal
 * Converte o formato do store3_checkout_urls.json para o formato usado pelo shopifyMapping.ts
 */

const fs = require('fs');
const path = require('path');

async function integrateStore3Mapping() {
  try {
    console.log('🔄 Iniciando integração do mapeamento da loja 3...');

    // Carrega o mapeamento da loja 3
    const store3MappingPath = path.join(__dirname, '../data/store3_checkout_urls.json');
    const store3Mapping = JSON.parse(fs.readFileSync(store3MappingPath, 'utf-8'));

    // Carrega o mapeamento de variant IDs existente (se existir)
    const variantMappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
    let variantMapping = {};
    
    if (fs.existsSync(variantMappingPath)) {
      variantMapping = JSON.parse(fs.readFileSync(variantMappingPath, 'utf-8'));
      console.log('📂 Mapeamento existente carregado');
    } else {
      console.log('📂 Criando novo arquivo de mapeamento');
    }

    // Converte o mapeamento da loja 3 para o formato do sistema
    let updatedCount = 0;
    let newCount = 0;

    for (const [handle, productData] of Object.entries(store3Mapping)) {
      // Pega o primeiro variant ID (assumindo que cada produto tem apenas uma variant)
      const firstVariant = productData.variants[0];
      if (firstVariant && firstVariant.id) {
        const variantId = firstVariant.id.toString();
        
        if (variantMapping[handle]) {
          if (variantMapping[handle] !== variantId) {
            console.log(`🔄 Atualizando ${handle}: ${variantMapping[handle]} → ${variantId}`);
            updatedCount++;
          }
        } else {
          console.log(`➕ Adicionando ${handle}: ${variantId}`);
          newCount++;
        }
        
        variantMapping[handle] = variantId;
      }
    }

    // Salva o mapeamento atualizado
    fs.writeFileSync(variantMappingPath, JSON.stringify(variantMapping, null, 2));

    console.log('\n✅ Integração concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   • Produtos novos: ${newCount}`);
    console.log(`   • Produtos atualizados: ${updatedCount}`);
    console.log(`   • Total de produtos: ${Object.keys(variantMapping).length}`);
    console.log(`📁 Arquivo salvo: ${variantMappingPath}`);

    // Verifica se alguns produtos específicos foram mapeados
    const sampleProducts = Object.keys(variantMapping).slice(0, 5);
    console.log('\n🔍 Amostra de produtos mapeados:');
    sampleProducts.forEach(handle => {
      console.log(`   • ${handle} → ${variantMapping[handle]}`);
    });

  } catch (error) {
    console.error('❌ Erro na integração:', error);
    process.exit(1);
  }
}

// Executa a integração
integrateStore3Mapping();