require('dotenv').config();

/**
 * Script para buscar todos os produtos e variants da Loja 3 (SADERSTORE)
 * e gerar um mapeamento JSON para o gerador de URLs de checkout
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_3_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_STORE_3_ADMIN_TOKEN;

if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Verifique se SHOPIFY_STORE_3_DOMAIN e SHOPIFY_STORE_3_ADMIN_TOKEN estão no .env');
  process.exit(1);
}

async function fetchAllProducts() {
  console.log('🔍 Buscando produtos da loja 3 (SADERSTORE)...');
  console.log(`📍 Domínio: ${SHOPIFY_DOMAIN}`);
  
  try {
    let allProducts = [];
    let nextPageInfo = null;
    let pageCount = 0;

    do {
      pageCount++;
      console.log(`📄 Buscando página ${pageCount}...`);
      
      // Construir URL com paginação
      let url = `https://${SHOPIFY_DOMAIN}/admin/api/2023-10/products.json?limit=250&fields=id,title,handle,variants,status,product_type`;
      
      if (nextPageInfo) {
        url += `&page_info=${nextPageInfo}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': ADMIN_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      allProducts = allProducts.concat(data.products);
      
      console.log(`✅ Página ${pageCount}: ${data.products.length} produtos encontrados`);

      // Verificar se há próxima página
      const linkHeader = response.headers.get('Link');
      nextPageInfo = null;
      
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        if (nextMatch) {
          nextPageInfo = nextMatch[1];
        }
      }

    } while (nextPageInfo);

    console.log(`\n📊 Total de produtos encontrados: ${allProducts.length}`);
    return allProducts;

  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    throw error;
  }
}

function generateProductMapping(products) {
  console.log('\n🔄 Gerando mapeamento de produtos e variants...');
  
  const mapping = {};
  let totalVariants = 0;

  products.forEach(product => {
    // Filtrar apenas produtos ativos
    if (product.status !== 'active') {
      console.log(`⚠️  Produto inativo ignorado: ${product.title}`);
      return;
    }

    const productData = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      product_type: product.product_type,
      variants: []
    };

    // Mapear variants
    product.variants.forEach(variant => {
      productData.variants.push({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        sku: variant.sku,
        inventory_quantity: variant.inventory_quantity,
        available: variant.available,
        checkout_url: `https://${SHOPIFY_DOMAIN}/cart/${variant.id}:1`
      });
      totalVariants++;
    });

    mapping[product.handle] = productData;
  });

  console.log(`✅ Mapeamento gerado:`);
  console.log(`   📦 ${Object.keys(mapping).length} produtos ativos`);
  console.log(`   🏷️  ${totalVariants} variants totais`);

  return mapping;
}

function saveMapping(mapping) {
  const fs = require('fs');
  const path = require('path');
  
  // Salvar na pasta data
  const outputPath = path.join(__dirname, '../data/store3_products_mapping.json');
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`\n💾 Mapeamento salvo em: ${outputPath}`);
    
    // Também salvar uma versão simplificada apenas com URLs de checkout
    const checkoutUrls = {};
    Object.keys(mapping).forEach(handle => {
      const product = mapping[handle];
      checkoutUrls[handle] = {
        title: product.title,
        variants: product.variants.map(v => ({
          id: v.id,
          title: v.title,
          price: v.price,
          checkout_url: v.checkout_url
        }))
      };
    });
    
    const checkoutPath = path.join(__dirname, '../data/store3_checkout_urls.json');
    fs.writeFileSync(checkoutPath, JSON.stringify(checkoutUrls, null, 2), 'utf8');
    console.log(`💾 URLs de checkout salvas em: ${checkoutPath}`);
    
    return { outputPath, checkoutPath };
    
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error.message);
    throw error;
  }
}

function displaySummary(mapping) {
  console.log('\n📋 RESUMO DOS PRODUTOS ENCONTRADOS:');
  console.log('=' .repeat(50));
  
  Object.keys(mapping).forEach((handle, index) => {
    const product = mapping[handle];
    console.log(`${index + 1}. ${product.title}`);
    console.log(`   Handle: ${handle}`);
    console.log(`   Variants: ${product.variants.length}`);
    console.log(`   Tipo: ${product.product_type}`);
    
    // Mostrar primeira variant como exemplo
    if (product.variants.length > 0) {
      const firstVariant = product.variants[0];
      console.log(`   Exemplo URL: ${firstVariant.checkout_url}`);
    }
    console.log('');
  });
}

async function main() {
  console.log('🚀 Iniciando busca de produtos da Loja 3 (SADERSTORE)');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar todos os produtos
    const products = await fetchAllProducts();
    
    // 2. Gerar mapeamento
    const mapping = generateProductMapping(products);
    
    // 3. Salvar arquivos
    const { outputPath, checkoutPath } = saveMapping(mapping);
    
    // 4. Exibir resumo
    displaySummary(mapping);
    
    console.log('✅ Script executado com sucesso!');
    console.log(`📁 Arquivos gerados:`);
    console.log(`   - ${outputPath}`);
    console.log(`   - ${checkoutPath}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante execução:', error.message);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = { fetchAllProducts, generateProductMapping, saveMapping };