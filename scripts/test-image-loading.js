const fs = require('fs');
const path = require('path');

// Carregar dados dos produtos
const productsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const products = data.products;

console.log('🔍 Testando carregamento de imagens...\n');

// Verificar os primeiros 5 produtos
for (let i = 0; i < Math.min(5, products.length); i++) {
  const product = products[i];
  console.log(`📦 Produto ${i + 1}: ${product.handle}`);
  
  let productImages = [];
  
  // Extrair todas as imagens do produto
  if (Array.isArray(product.images)) {
    productImages = product.images;
  } else if (product.images && typeof product.images === 'object') {
    productImages = [
      ...(product.images.main || []),
      ...(product.images.gallery || []),
      ...(product.images.individual_items?.map(item => item.url) || [])
    ];
  }
  
  console.log(`   Imagens encontradas: ${productImages.length}`);
  
  productImages.forEach((imageUrl, index) => {
    if (imageUrl && imageUrl.startsWith('/')) {
      // É um caminho local, verificar se o arquivo existe
      const fullPath = path.join(__dirname, '..', 'public', imageUrl);
      const exists = fs.existsSync(fullPath);
      console.log(`   ${index + 1}. ${imageUrl} - ${exists ? '✅ Existe' : '❌ Não encontrado'}`);
      
      if (exists) {
        const stats = fs.statSync(fullPath);
        console.log(`      Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
      }
    } else {
      console.log(`   ${index + 1}. ${imageUrl} - 🌐 URL externa`);
    }
  });
  
  console.log('');
}

console.log('✅ Teste concluído!');