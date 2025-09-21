const fs = require('fs');
const path = require('path');

async function checkMissingVariants() {
  console.log('🔍 Verificando produtos sem variant IDs...\n');

  try {
    // Carregar produtos
    const productsPath = path.join(process.cwd(), 'data', 'unified_products_en_gbp.json');
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.products || [];

    // Carregar mapeamento
    const mappingPath = path.join(process.cwd(), 'data', 'shopify_variant_mapping.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

    console.log(`📊 Total de produtos: ${products.length}`);
    console.log(`📊 Total de mapeamentos: ${Object.keys(mapping).length}\n`);

    // Verificar produtos sem mapeamento
    const productsWithoutVariants = [];
    const productsWithVariants = [];

    products.forEach(product => {
      if (mapping[product.handle]) {
        productsWithVariants.push({
          handle: product.handle,
          title: product.title,
          variantId: mapping[product.handle]
        });
      } else {
        productsWithoutVariants.push({
          handle: product.handle,
          title: product.title
        });
      }
    });

    console.log(`✅ Produtos COM variant ID: ${productsWithVariants.length}`);
    console.log(`❌ Produtos SEM variant ID: ${productsWithoutVariants.length}\n`);

    if (productsWithoutVariants.length > 0) {
      console.log('📋 Produtos sem variant ID:');
      productsWithoutVariants.forEach((product, index) => {
        console.log(`${index + 1}. ${product.handle} - ${product.title}`);
      });
    }

    console.log('\n📋 Primeiros 5 produtos com variant ID:');
    productsWithVariants.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ${product.handle} - ${product.variantId}`);
    });

    // Verificar se há mapeamentos órfãos (sem produto correspondente)
    const productHandles = new Set(products.map(p => p.handle));
    const orphanMappings = [];

    Object.keys(mapping).forEach(handle => {
      if (!productHandles.has(handle)) {
        orphanMappings.push(handle);
      }
    });

    if (orphanMappings.length > 0) {
      console.log(`\n⚠️  Mapeamentos órfãos (sem produto): ${orphanMappings.length}`);
      orphanMappings.slice(0, 5).forEach((handle, index) => {
        console.log(`${index + 1}. ${handle} - ${mapping[handle]}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkMissingVariants();