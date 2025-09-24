const fs = require('fs');

// Carregar produtos válidos da Loja 2
const validProducts = JSON.parse(fs.readFileSync('./data/store2-valid-products-mapping.json', 'utf8'));

// Extrair todas as URLs de checkout
const checkoutUrls = Object.values(validProducts).map(product => ({
  handle: product.handle,
  title: product.title,
  url: product.checkout_url,
  price: product.price,
  currency: product.currency
}));

console.log('🛒 TODAS AS URLs DE CHECKOUT DA LOJA 2 (WIFI MONEY)\n');
console.log(`📦 Total de produtos: ${checkoutUrls.length}\n`);

console.log('📋 LISTA COMPLETA DE URLs:\n');

checkoutUrls.forEach((product, index) => {
  console.log(`${index + 1}. ${product.title}`);
  console.log(`   💰 Preço: £${product.price}`);
  console.log(`   🔗 URL: ${product.url}`);
  console.log('');
});

console.log('\n💡 COMO USAR:');
console.log('1. Copie qualquer URL acima e cole no seu navegador');
console.log('2. Teste o processo de checkout');
console.log('3. Verifique se o produto é adicionado corretamente ao carrinho');
console.log('4. Confirme se o redirecionamento para o checkout funciona');

console.log('\n🧪 URLS DE TESTE RECOMENDADAS:');
console.log('• Primeira URL:', checkoutUrls[0].url);
console.log('• URL do meio:', checkoutUrls[Math.floor(checkoutUrls.length / 2)].url);
console.log('• Última URL:', checkoutUrls[checkoutUrls.length - 1].url);

// Salvar lista em arquivo de texto
const urlList = checkoutUrls.map(product => `${product.title}: ${product.url}`).join('\n');
fs.writeFileSync('./reports/all-checkout-urls-list.txt', urlList);
console.log('\n💾 Lista salva em: ./reports/all-checkout-urls-list.txt');