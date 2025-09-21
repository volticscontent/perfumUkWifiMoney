const fs = require('fs');
const path = require('path');

console.log('🛒 Testando funcionalidade do carrinho para produto específico\n');

async function testProductCart() {
  try {
    // Simular a função getShopifyVariantIdByHandle
    const mappingPath = path.join(__dirname, '../data/shopify_variant_mapping.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    
    function getShopifyVariantIdByHandle(handle) {
      return mapping[handle] || null;
    }
    
    // Testar o produto problemático
    const productHandle = '3-piece-premium-fragrance-collection-set-29';
    
    console.log(`🔍 Testando produto: ${productHandle}`);
    
    // Simular o que acontece na função handleAddToCart
    const shopifyVariantId = getShopifyVariantIdByHandle(productHandle);
    
    if (!shopifyVariantId) {
      console.log(`❌ ERRO: Variant ID não encontrado para o produto: ${productHandle}`);
      return false;
    }
    
    console.log(`✅ Variant ID encontrado: ${shopifyVariantId}`);
    
    // Simular criação do item do carrinho
    const cartItem = {
      id: '2', // ID do produto
      shopifyId: shopifyVariantId,
      storeId: "1",
      title: '3-Piece Fragrance Set: 212 VIP Rose, Olympea & Coco Mademoiselle',
      subtitle: 'Eau de Parfum Spray - 100ML',
      price: 49.99,
      image: 'placeholder.jpg'
    };
    
    console.log('✅ Item do carrinho criado com sucesso:');
    console.log(`   - ID: ${cartItem.id}`);
    console.log(`   - Shopify ID: ${cartItem.shopifyId}`);
    console.log(`   - Título: ${cartItem.title}`);
    console.log(`   - Preço: £${cartItem.price}`);
    
    // Testar outros produtos também
    console.log('\n🔍 Testando outros produtos:');
    
    const productsPath = path.join(__dirname, '../data/unified_products_en_gbp.json');
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.products || productsData;
    
    const testProducts = products.slice(0, 5); // Primeiros 5 produtos
    
    let successCount = 0;
    let errorCount = 0;
    
    testProducts.forEach((product, index) => {
      const variantId = getShopifyVariantIdByHandle(product.handle);
      
      if (variantId) {
        console.log(`${index + 1}. ✅ ${product.handle} -> ${variantId}`);
        successCount++;
      } else {
        console.log(`${index + 1}. ❌ ${product.handle} -> SEM VARIANT ID`);
        errorCount++;
      }
    });
    
    console.log(`\n📊 Resumo do teste:`);
    console.log(`✅ Produtos funcionando: ${successCount}`);
    console.log(`❌ Produtos com erro: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 TODOS OS PRODUTOS TESTADOS ESTÃO FUNCIONANDO!');
      return true;
    } else {
      console.log('\n⚠️  Alguns produtos ainda têm problemas.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

testProductCart().then(success => {
  if (success) {
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
  } else {
    console.log('\n❌ Teste falhou!');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});