// Teste das variáveis de ambiente
console.log('🔍 Testando Variáveis de Ambiente...\n');

// Carregar variáveis de ambiente manualmente
require('dotenv').config();

console.log('📋 Variáveis de ambiente carregadas:');
console.log('SHOPIFY_STORE_1_DOMAIN:', process.env.SHOPIFY_STORE_1_DOMAIN || 'NÃO DEFINIDO');
console.log('SHOPIFY_STORE_1_STOREFRONT_TOKEN:', process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO');
console.log('SHOPIFY_STORE_1_ADMIN_TOKEN:', process.env.SHOPIFY_STORE_1_ADMIN_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO');

console.log('\n🔧 Configuração da API create-checkout:');
const STORE_CONFIG = {
  domain: process.env.SHOPIFY_STORE_1_DOMAIN || 'ton-store-1656.myshopify.com',
  storefrontAccessToken: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN || '',
  name: 'EURO PRIDE'
};

console.log('Domain:', STORE_CONFIG.domain);
console.log('Token:', STORE_CONFIG.storefrontAccessToken ? 'CARREGADO' : 'VAZIO');

if (!STORE_CONFIG.storefrontAccessToken) {
  console.log('\n❌ PROBLEMA ENCONTRADO: Token do Storefront está vazio!');
  console.log('💡 Soluções possíveis:');
  console.log('1. Verificar se o arquivo .env está na raiz do projeto');
  console.log('2. Reiniciar o servidor Next.js');
  console.log('3. Verificar se dotenv está instalado');
} else {
  console.log('\n✅ Configuração está correta!');
}