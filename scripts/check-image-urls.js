const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Carregar dados dos produtos
const productsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const products = data.products;

console.log('🔍 Verificando URLs de imagens dos produtos...\n');

// Função para verificar se uma URL é válida
function checkImageUrl(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      resolve({ url, status: 'empty', error: 'URL vazia ou inválida' });
      return;
    }

    const protocol = url.startsWith('https:') ? https : http;
    const request = protocol.get(url, (response) => {
      resolve({ 
        url, 
        status: response.statusCode, 
        contentType: response.headers['content-type'] 
      });
    });

    request.on('error', (error) => {
      resolve({ url, status: 'error', error: error.message });
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve({ url, status: 'timeout', error: 'Timeout' });
    });
  });
}

async function checkAllImages() {
  let totalImages = 0;
  let validImages = 0;
  let invalidImages = 0;
  let emptyImages = 0;
  let problemProducts = [];

  for (let i = 0; i < Math.min(10, products.length); i++) {
    const product = products[i];
    console.log(`\n📦 Produto ${i + 1}: ${product.handle}`);
    console.log(`   Título: ${product.title}`);
    
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
    
    console.log(`   Total de imagens: ${productImages.length}`);
    
    if (productImages.length === 0) {
      console.log('   ❌ Nenhuma imagem encontrada');
      problemProducts.push({ handle: product.handle, issue: 'no_images' });
      continue;
    }
    
    let productValidImages = 0;
    let productInvalidImages = 0;
    
    for (let j = 0; j < Math.min(3, productImages.length); j++) {
      const imageUrl = productImages[j];
      totalImages++;
      
      if (!imageUrl || imageUrl.trim() === '') {
        emptyImages++;
        console.log(`   🔸 Imagem ${j + 1}: URL vazia`);
        continue;
      }
      
      console.log(`   🔍 Verificando imagem ${j + 1}: ${imageUrl.substring(0, 50)}...`);
      
      const result = await checkImageUrl(imageUrl);
      
      if (result.status === 200) {
        validImages++;
        productValidImages++;
        console.log(`   ✅ Imagem ${j + 1}: OK (${result.contentType})`);
      } else {
        invalidImages++;
        productInvalidImages++;
        console.log(`   ❌ Imagem ${j + 1}: ${result.status} - ${result.error || 'Erro'}`);
      }
    }
    
    if (productValidImages === 0) {
      problemProducts.push({ 
        handle: product.handle, 
        issue: 'all_images_broken',
        imageCount: productImages.length 
      });
    }
  }

  console.log('\n📊 Resumo da verificação:');
  console.log(`🔍 Total de imagens verificadas: ${totalImages}`);
  console.log(`✅ Imagens válidas: ${validImages}`);
  console.log(`❌ Imagens inválidas: ${invalidImages}`);
  console.log(`🔸 URLs vazias: ${emptyImages}`);
  console.log(`🚨 Produtos com problemas: ${problemProducts.length}`);
  
  if (problemProducts.length > 0) {
    console.log('\n🚨 Produtos com problemas de imagem:');
    problemProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.handle} - ${product.issue}`);
    });
  }
}

checkAllImages().catch(console.error);