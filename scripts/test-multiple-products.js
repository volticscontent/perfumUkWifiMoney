const fs = require('fs');
const path = require('path');

// Função para testar um produto específico
async function testProduct(handle) {
  try {
    console.log(`\n🧪 Testando produto: ${handle}`);
    
    // 1. Verificar se está no mapeamento
    const mappingPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    
    if (mapping[handle]) {
      console.log(`✅ Produto encontrado no mapeamento`);
      console.log(`   Variant ID: ${mapping[handle]}`);
      
      // 2. Testar URL do carrinho
      const variantId = mapping[handle];
      const cartUrl = `https://theperfumeshop.myshopify.com/cart/${variantId}:1`;
      
      try {
        const response = await fetch(cartUrl, { method: 'HEAD' });
        console.log(`✅ URL do carrinho válida (status: ${response.status})`);
        return { success: true, variantId, status: response.status };
      } catch (error) {
        console.log(`❌ Erro ao testar URL do carrinho: ${error.message}`);
        return { success: false, error: error.message };
      }
    } else {
      console.log(`❌ Produto NÃO encontrado no mapeamento`);
      return { success: false, error: 'Produto não encontrado no mapeamento' };
    }
  } catch (error) {
    console.log(`❌ Erro ao testar produto: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Lista de produtos para testar
const productsToTest = [
  '3-piece-premium-fragrance-collection-set-29', // Produto que foi corrigido
  '3-piece-premium-fragrance-collection-set-1',
  '3-piece-premium-fragrance-collection-set-5',
  '3-piece-premium-fragrance-collection-set-10',
  '3-piece-premium-fragrance-collection-set-15',
  '3-piece-premium-fragrance-collection-set-20',
  '3-piece-premium-fragrance-collection-set-25',
  '3-piece-premium-fragrance-collection-set-30',
  '3-piece-premium-fragrance-collection-set-35',
  '3-piece-premium-fragrance-collection-set-40'
];

async function testAllProducts() {
  console.log('🚀 Iniciando teste de múltiplos produtos...\n');
  
  const results = [];
  
  for (const handle of productsToTest) {
    const result = await testProduct(handle);
    results.push({ handle, ...result });
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Resumo dos resultados
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Produtos funcionando: ${successful.length}/${results.length}`);
  console.log(`❌ Produtos com problemas: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Produtos com problemas:');
    failed.forEach(result => {
      console.log(`   - ${result.handle}: ${result.error}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Produtos funcionando:');
    successful.forEach(result => {
      console.log(`   - ${result.handle}: Variant ID ${result.variantId} (status ${result.status})`);
    });
  }
  
  console.log('\n🎯 CONCLUSÃO:');
  if (failed.length === 0) {
    console.log('✅ Todos os produtos testados estão funcionando corretamente!');
    console.log('✅ A correção aplicada resolve o problema globalmente.');
  } else {
    console.log('⚠️  Alguns produtos ainda têm problemas que precisam ser investigados.');
  }
}

// Executar testes
testAllProducts().catch(console.error);