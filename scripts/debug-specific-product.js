const fs = require('fs');
const path = require('path');

console.log('🔍 Debugando produto específico: 3-piece-premium-fragrance-collection-set-29\n');

try {
  // Carregar dados
  const productsPath = path.join(__dirname, '../data/unified_products_en_gbp.json');
  const mappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
  
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const products = productsData.products || productsData;
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

  const targetHandle = '3-piece-premium-fragrance-collection-set-29';
  
  console.log('📊 Informações gerais:');
  console.log(`- Total de produtos: ${products.length}`);
  console.log(`- Total de mapeamentos: ${Object.keys(mapping).length}\n`);

  // Encontrar o produto
  const product = products.find(p => p.handle === targetHandle);
  
  console.log('🔍 Procurando produto por handle:', targetHandle);
  if (product) {
    console.log('✅ Produto encontrado:');
    console.log(`- ID: ${product.id}`);
    console.log(`- Handle: ${product.handle}`);
    console.log(`- Título: ${product.title}`);
    console.log(`- Preço: £${product.price?.regular || product.price}`);
  } else {
    console.log('❌ Produto NÃO encontrado com esse handle');
    
    // Procurar handles similares
    console.log('\n🔍 Procurando handles similares:');
    const similarProducts = products.filter(p => 
      p.handle.includes('29') || p.handle.includes('premium-fragrance-collection')
    );
    
    similarProducts.forEach(p => {
      console.log(`- ${p.handle} (ID: ${p.id})`);
    });
  }

  // Verificar mapeamento
  console.log('\n🗺️ Verificando mapeamento:');
  const variantId = mapping[targetHandle];
  
  if (variantId) {
    console.log(`✅ Variant ID encontrado: ${variantId}`);
  } else {
    console.log('❌ Variant ID NÃO encontrado no mapeamento');
    
    // Mostrar todos os mapeamentos que contêm "29"
    console.log('\n🔍 Mapeamentos que contêm "29":');
    Object.entries(mapping).forEach(([handle, vId]) => {
      if (handle.includes('29')) {
        console.log(`- ${handle} -> ${vId}`);
      }
    });
  }

  // Verificar se existe produto com ID 2 (que deveria ter esse handle)
  console.log('\n🔍 Verificando produto com ID 2:');
  const productId2 = products.find(p => p.id === '2');
  if (productId2) {
    console.log('✅ Produto ID 2 encontrado:');
    console.log(`- Handle: ${productId2.handle}`);
    console.log(`- Título: ${productId2.title}`);
    console.log(`- Variant ID no mapeamento: ${mapping[productId2.handle] || 'NÃO ENCONTRADO'}`);
  }

  // Verificar função getShopifyVariantInfo
  console.log('\n🔧 Testando função getShopifyVariantInfo:');
  
  // Simular a função
  function getShopifyVariantInfo(handle) {
    return mapping[handle] || null;
  }
  
  const testResult = getShopifyVariantInfo(targetHandle);
  console.log(`Resultado da função: ${testResult || 'null'}`);

  // Verificar arquivo público
  console.log('\n📁 Verificando arquivo público:');
  const publicMappingPath = path.join(__dirname, '../public/data/shopify_variant_mapping.json');
  
  if (fs.existsSync(publicMappingPath)) {
    const publicMapping = JSON.parse(fs.readFileSync(publicMappingPath, 'utf8'));
    console.log(`✅ Arquivo público existe com ${Object.keys(publicMapping).length} mapeamentos`);
    
    const publicVariantId = publicMapping[targetHandle];
    if (publicVariantId) {
      console.log(`✅ Variant ID no arquivo público: ${publicVariantId}`);
    } else {
      console.log('❌ Variant ID NÃO encontrado no arquivo público');
    }
  } else {
    console.log('❌ Arquivo público NÃO existe');
  }

} catch (error) {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
}