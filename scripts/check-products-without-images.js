const fs = require('fs');
const path = require('path');

// Carregar dados dos produtos
const productsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const products = data.products;

console.log('🔍 Verificando produtos sem imagens...\n');

let productsWithoutImages = [];
let productsWithImages = [];

products.forEach(product => {
  let hasImages = false;
  
  // Verificar se tem imagens
  if (Array.isArray(product.images)) {
    hasImages = product.images.length > 0 && product.images.some(img => img && img.trim() !== '');
  } else if (product.images && typeof product.images === 'object') {
    const mainImages = product.images.main || [];
    const galleryImages = product.images.gallery || [];
    const individualImages = product.images.individual_items || [];
    
    hasImages = mainImages.length > 0 || galleryImages.length > 0 || individualImages.length > 0;
  }
  
  if (hasImages) {
    productsWithImages.push({
      handle: product.handle,
      title: product.title,
      imageCount: Array.isArray(product.images) ? product.images.length : 
                  (product.images?.main?.length || 0) + (product.images?.gallery?.length || 0)
    });
  } else {
    productsWithoutImages.push({
      handle: product.handle,
      title: product.title,
      images: product.images
    });
  }
});

console.log(`📊 Resumo:`);
console.log(`✅ Produtos com imagens: ${productsWithImages.length}`);
console.log(`❌ Produtos sem imagens: ${productsWithoutImages.length}`);
console.log(`📈 Total de produtos: ${products.length}\n`);

if (productsWithoutImages.length > 0) {
  console.log('❌ Produtos sem imagens:');
  productsWithoutImages.forEach((product, index) => {
    console.log(`${index + 1}. ${product.handle} - "${product.title}"`);
    console.log(`   Imagens: ${JSON.stringify(product.images)}\n`);
  });
} else {
  console.log('🎉 Todos os produtos têm imagens!');
}

console.log('\n✅ Verificação concluída!');