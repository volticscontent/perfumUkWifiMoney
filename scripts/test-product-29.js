require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testProduct29() {
  console.log('🧪 Testando produto 29 específico...');

  // Carregar mapeamento atualizado
  const mappingPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping.json');
  
  if (!fs.existsSync(mappingPath)) {
    console.log('❌ Arquivo de mapeamento não encontrado');
    return;
  }

  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  console.log(`📋 Mapeamento carregado com ${Object.keys(mapping).length} produtos`);

  // Verificar se o produto 29 está no mapeamento
  const product29Handle = '3-piece-premium-fragrance-collection-set-29';
  const variantId = mapping[product29Handle];

  if (!variantId) {
    console.log('❌ Produto 29 não encontrado no mapeamento');
    return;
  }

  console.log(`✅ Produto 29 encontrado no mapeamento:`);
  console.log(`   Handle: ${product29Handle}`);
  console.log(`   Variant ID: ${variantId}`);

  // Testar URL do carrinho
  const domain = process.env.SHOPIFY_DOMAIN;
  if (domain) {
    const cartUrl = `https://${domain}/cart/${variantId}:1`;
    console.log(`   URL do carrinho: ${cartUrl}`);

    try {
      const response = await fetch(cartUrl, { 
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (response.status === 302 || response.status === 200 || response.status === 301) {
        console.log(`✅ URL do carrinho válida (Status: ${response.status})`);
      } else {
        console.log(`⚠️  Status inesperado: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao testar URL: ${error.message}`);
    }
  }

  // Verificar se o produto existe nos dados unificados
  const unifiedPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
  if (fs.existsSync(unifiedPath)) {
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    const product29 = unifiedData.find(p => p.handle === product29Handle);
    
    if (product29) {
      console.log(`✅ Produto encontrado nos dados unificados:`);
      console.log(`   ID: ${product29.id}`);
      console.log(`   Título: ${product29.title}`);
      console.log(`   Preço: £${product29.price.regular}`);
    } else {
      console.log(`❌ Produto não encontrado nos dados unificados`);
    }
  }

  console.log('\n🎉 Teste do produto 29 concluído!');
}

testProduct29().catch(console.error);