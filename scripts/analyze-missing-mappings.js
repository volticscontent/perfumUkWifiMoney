const fs = require('fs');
const path = require('path');

// Carregar dados
const productsPath = path.join(__dirname, '../data/unified_products_en_gbp.json');
const mappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');

console.log('🔍 Analisando produtos que precisam ser mapeados...\n');

try {
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const products = productsData.products || productsData; // Suporta ambas as estruturas
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

  console.log(`📊 Total de produtos: ${products.length}`);
  console.log(`📊 Total de mapeamentos: ${Object.keys(mapping).length}\n`);

  // Encontrar produtos sem mapeamento
  const unmappedProducts = products.filter(product => !mapping[product.id]);
  
  console.log(`❌ Produtos sem mapeamento: ${unmappedProducts.length}\n`);

  // Agrupar por categoria para facilitar o mapeamento
  const byCategory = {};
  const byBrand = {};
  
  if (unmappedProducts.length > 0) {
    console.log('📋 Lista de produtos que precisam ser mapeados:\n');
    
    unmappedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}`);
      console.log(`   Nome: ${product.title || product.name}`);
      console.log(`   Handle: ${product.handle}`);
      console.log(`   Preço: £${product.price?.regular || product.price}`);
      console.log(`   Categoria: ${product.category || 'N/A'}`);
      console.log(`   Marca: ${(product.brands && product.brands[0]) || product.brand || 'N/A'}`);
      console.log('   ---');
    });

    unmappedProducts.forEach(product => {
      const category = product.category || 'Sem categoria';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(product);
    });

    console.log('\n📂 Produtos agrupados por categoria:\n');
    Object.entries(byCategory).forEach(([category, products]) => {
      console.log(`${category}: ${products.length} produtos`);
      products.forEach(product => {
        console.log(`  - ${product.title || product.name} (ID: ${product.id})`);
      });
      console.log('');
    });

    // Agrupar por marca
    unmappedProducts.forEach(product => {
      const brand = (product.brands && product.brands[0]) || product.brand || 'Sem marca';
      if (!byBrand[brand]) {
        byBrand[brand] = [];
      }
      byBrand[brand].push(product);
    });

    console.log('🏷️ Produtos agrupados por marca:\n');
    Object.entries(byBrand).forEach(([brand, products]) => {
      console.log(`${brand}: ${products.length} produtos`);
      products.forEach(product => {
        console.log(`  - ${product.title || product.name} (ID: ${product.id})`);
      });
      console.log('');
    });
  }

  // Verificar mapeamentos órfãos
  const orphanMappings = [];
  Object.entries(mapping).forEach(([productId, variantId]) => {
    const productExists = products.find(p => p.id === productId);
    if (!productExists) {
      orphanMappings.push({ productId, variantId });
    }
  });

  if (orphanMappings.length > 0) {
    console.log(`🔍 Mapeamentos órfãos encontrados: ${orphanMappings.length}\n`);
    orphanMappings.forEach((orphan, index) => {
      console.log(`${index + 1}. Produto ID: ${orphan.productId} -> Variant ID: ${orphan.variantId}`);
    });
  }

  // Salvar relatório detalhado
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalProducts: products.length,
      totalMappings: Object.keys(mapping).length,
      unmappedProducts: unmappedProducts.length,
      orphanMappings: orphanMappings.length
    },
    unmappedProducts: unmappedProducts.map(p => ({
      id: p.id,
      name: p.title || p.name,
      handle: p.handle,
      price: p.price?.regular || p.price,
      category: p.category,
      brand: (p.brands && p.brands[0]) || p.brand
    })),
    productsByCategory: byCategory,
    productsByBrand: byBrand,
    orphanMappings
  };

  const reportPath = path.join(__dirname, '../reports/missing-mappings-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);

} catch (error) {
  console.error('❌ Erro ao analisar mapeamentos:', error.message);
}