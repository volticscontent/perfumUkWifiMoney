const fs = require('fs');
const path = require('path');

console.log('🔄 OTIMIZANDO MAPAS DE CORRESPONDÊNCIA UNIFIED ↔ SHOPIFY');
console.log('=' .repeat(70));

try {
    // Carrega dados unified
    const unifiedPath = path.join(__dirname, 'data', 'unified_products_en_gbp.json');
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    
    // Carrega mapas das lojas Shopify
    const mapaId1Path = path.join(__dirname, 'mapa_produtos_id1.json');
    const mapaId2Path = path.join(__dirname, 'mapa_produtos_id2.json');
    const mapaId3Path = path.join(__dirname, 'mapa_produtos_id3.json');
    
    const mapaId1 = JSON.parse(fs.readFileSync(mapaId1Path, 'utf8'));
    const mapaId2 = JSON.parse(fs.readFileSync(mapaId2Path, 'utf8'));
    const mapaId3 = JSON.parse(fs.readFileSync(mapaId3Path, 'utf8'));
    
    console.log(`📊 DADOS CARREGADOS:`);
    console.log(`   Unified Products: ${unifiedData.products.length}`);
    console.log(`   Shopify ID1: ${mapaId1.totalProducts} produtos`);
    console.log(`   Shopify ID2: ${mapaId2.totalProducts} produtos`);
    console.log(`   Shopify ID3: ${mapaId3.totalProducts} produtos`);
    
    // Cria índices otimizados para busca rápida
    const shopifyBySku = {};
    const shopifyByHandle = {};
    const shopifyByTitle = {};
    
    // Indexa produtos Shopify por SKU, handle e title
    [mapaId1, mapaId2, mapaId3].forEach(mapa => {
        mapa.products.forEach(produto => {
            produto.variants.forEach(variant => {
                const key = variant.sku;
                if (key) {
                    shopifyBySku[key] = {
                        storeId: mapa.storeId,
                        storeName: mapa.storeName,
                        domain: mapa.domain,
                        productId: produto.id,
                        productTitle: produto.title,
                        productHandle: produto.handle,
                        variantId: variant.id,
                        variantTitle: variant.title,
                        sku: variant.sku,
                        price: variant.price,
                        available: variant.availableForSale,
                        quantity: variant.quantityAvailable
                    };
                }
            });
            
            // Indexa por handle
            if (produto.handle) {
                shopifyByHandle[produto.handle] = {
                    storeId: mapa.storeId,
                    storeName: mapa.storeName,
                    domain: mapa.domain,
                    productId: produto.id,
                    productTitle: produto.title,
                    productHandle: produto.handle,
                    variants: produto.variants
                };
            }
            
            // Indexa por title normalizado
            const normalizedTitle = produto.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            shopifyByTitle[normalizedTitle] = {
                storeId: mapa.storeId,
                storeName: mapa.storeName,
                domain: mapa.domain,
                productId: produto.id,
                productTitle: produto.title,
                productHandle: produto.handle,
                variants: produto.variants
            };
        });
    });
    
    console.log(`\n🔍 ÍNDICES CRIADOS:`);
    console.log(`   Por SKU: ${Object.keys(shopifyBySku).length} entradas`);
    console.log(`   Por Handle: ${Object.keys(shopifyByHandle).length} entradas`);
    console.log(`   Por Title: ${Object.keys(shopifyByTitle).length} entradas`);
    
    // Mapeia produtos unified com Shopify
    const correspondencias = [];
    const naoEncontrados = [];
    
    unifiedData.products.forEach((unifiedProduct, index) => {
        let encontrado = false;
        let shopifyMatch = null;
        
        // 1. Busca por SKU (mais preciso)
        if (unifiedProduct.sku && shopifyBySku[unifiedProduct.sku]) {
            shopifyMatch = shopifyBySku[unifiedProduct.sku];
            encontrado = true;
        }
        
        // 2. Busca por handle se não encontrou por SKU
        if (!encontrado && unifiedProduct.handle && shopifyByHandle[unifiedProduct.handle]) {
            shopifyMatch = shopifyByHandle[unifiedProduct.handle];
            encontrado = true;
        }
        
        // 3. Busca por title normalizado se ainda não encontrou
        if (!encontrado) {
            const normalizedUnifiedTitle = unifiedProduct.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (shopifyByTitle[normalizedUnifiedTitle]) {
                shopifyMatch = shopifyByTitle[normalizedUnifiedTitle];
                encontrado = true;
            }
        }
        
        if (encontrado && shopifyMatch) {
            correspondencias.push({
                unified: {
                    id: unifiedProduct.id,
                    handle: unifiedProduct.handle,
                    title: unifiedProduct.title,
                    sku: unifiedProduct.sku,
                    price: unifiedProduct.price,
                    brands: unifiedProduct.brands,
                    category: unifiedProduct.category,
                    images: unifiedProduct.images
                },
                shopify: shopifyMatch,
                matchType: unifiedProduct.sku && shopifyMatch.sku === unifiedProduct.sku ? 'sku' : 
                          unifiedProduct.handle && shopifyMatch.productHandle === unifiedProduct.handle ? 'handle' : 'title'
            });
        } else {
            naoEncontrados.push({
                id: unifiedProduct.id,
                handle: unifiedProduct.handle,
                title: unifiedProduct.title,
                sku: unifiedProduct.sku
            });
        }
        
        // Log de progresso
        if ((index + 1) % 10 === 0) {
            console.log(`   Processados: ${index + 1}/${unifiedData.products.length} produtos`);
        }
    });
    
    console.log(`\n📈 RESULTADOS DO MAPEAMENTO:`);
    console.log(`   ✅ Correspondências encontradas: ${correspondencias.length}`);
    console.log(`   ❌ Não encontrados: ${naoEncontrados.length}`);
    console.log(`   📊 Taxa de sucesso: ${((correspondencias.length / unifiedData.products.length) * 100).toFixed(1)}%`);
    
    // Agrupa correspondências por loja
    const porLoja = {
        id1: correspondencias.filter(c => c.shopify.storeId === 'id1'),
        id2: correspondencias.filter(c => c.shopify.storeId === 'id2'),
        id3: correspondencias.filter(c => c.shopify.storeId === 'id3')
    };
    
    console.log(`\n🏪 DISTRIBUIÇÃO POR LOJA:`);
    console.log(`   ID1 (EURO PRIDE): ${porLoja.id1.length} produtos`);
    console.log(`   ID2 (Perfumes Club): ${porLoja.id2.length} produtos`);
    console.log(`   ID3 (Perfumes & Co): ${porLoja.id3.length} produtos`);
    
    // Salva mapa de correspondências completo
    const mapaCompleto = {
        timestamp: new Date().toISOString(),
        estatisticas: {
            totalUnified: unifiedData.products.length,
            totalCorrespondencias: correspondencias.length,
            totalNaoEncontrados: naoEncontrados.length,
            taxaSucesso: ((correspondencias.length / unifiedData.products.length) * 100).toFixed(1) + '%',
            distribuicaoPorLoja: {
                id1: porLoja.id1.length,
                id2: porLoja.id2.length,
                id3: porLoja.id3.length
            }
        },
        correspondencias: correspondencias,
        naoEncontrados: naoEncontrados
    };
    
    const mapaCompletoPath = path.join(__dirname, 'mapa_correspondencia_unified_shopify.json');
    fs.writeFileSync(mapaCompletoPath, JSON.stringify(mapaCompleto, null, 2));
    
    // Cria mapas otimizados para busca rápida
    
    // 1. Mapa por SKU (para checkout)
    const mapaPorSku = {};
    correspondencias.forEach(corr => {
        if (corr.unified.sku) {
            mapaPorSku[corr.unified.sku] = {
                unifiedId: corr.unified.id,
                shopifyStoreId: corr.shopify.storeId,
                shopifyProductId: corr.shopify.productId,
                shopifyVariantId: corr.shopify.variantId,
                price: corr.shopify.price,
                available: corr.shopify.available,
                quantity: corr.shopify.quantity
            };
        }
    });
    
    const mapaPorSkuPath = path.join(__dirname, 'mapa_sku_para_shopify.json');
    fs.writeFileSync(mapaPorSkuPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalMapeamentos: Object.keys(mapaPorSku).length,
        mapeamentos: mapaPorSku
    }, null, 2));
    
    // 2. Mapa por handle (para URLs)
    const mapaPorHandle = {};
    correspondencias.forEach(corr => {
        if (corr.unified.handle) {
            mapaPorHandle[corr.unified.handle] = {
                unifiedId: corr.unified.id,
                shopifyStoreId: corr.shopify.storeId,
                shopifyProductId: corr.shopify.productId,
                shopifyHandle: corr.shopify.productHandle,
                variants: corr.shopify.variants || [{
                    id: corr.shopify.variantId,
                    sku: corr.shopify.sku,
                    price: corr.shopify.price,
                    available: corr.shopify.available,
                    quantity: corr.shopify.quantity
                }]
            };
        }
    });
    
    const mapaPorHandlePath = path.join(__dirname, 'mapa_handle_para_shopify.json');
    fs.writeFileSync(mapaPorHandlePath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalMapeamentos: Object.keys(mapaPorHandle).length,
        mapeamentos: mapaPorHandle
    }, null, 2));
    
    // 3. Mapa reverso (Shopify para Unified)
    const mapaReverso = {};
    correspondencias.forEach(corr => {
        const key = `${corr.shopify.storeId}_${corr.shopify.productId}`;
        mapaReverso[key] = {
            unifiedId: corr.unified.id,
            unifiedHandle: corr.unified.handle,
            unifiedTitle: corr.unified.title,
            unifiedSku: corr.unified.sku,
            unifiedPrice: corr.unified.price,
            unifiedBrands: corr.unified.brands,
            unifiedCategory: corr.unified.category,
            unifiedImages: corr.unified.images
        };
    });
    
    const mapaReversoPath = path.join(__dirname, 'mapa_shopify_para_unified.json');
    fs.writeFileSync(mapaReversoPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalMapeamentos: Object.keys(mapaReverso).length,
        mapeamentos: mapaReverso
    }, null, 2));
    
    console.log(`\n📁 ARQUIVOS GERADOS:`);
    console.log(`   📋 mapa_correspondencia_unified_shopify.json - Mapa completo`);
    console.log(`   🔍 mapa_sku_para_shopify.json - Busca por SKU (checkout)`);
    console.log(`   🔗 mapa_handle_para_shopify.json - Busca por handle (URLs)`);
    console.log(`   ↩️  mapa_shopify_para_unified.json - Mapa reverso`);
    
    // Cria arquivo de exemplo de uso
    const exemploUso = {
        "como_usar": {
            "buscar_por_sku": {
                "descricao": "Para encontrar produto Shopify a partir do SKU unified",
                "arquivo": "mapa_sku_para_shopify.json",
                "exemplo": "const shopifyData = mapa.mapeamentos['FRAG-0001-183239']"
            },
            "buscar_por_handle": {
                "descricao": "Para encontrar produto Shopify a partir do handle unified",
                "arquivo": "mapa_handle_para_shopify.json", 
                "exemplo": "const shopifyData = mapa.mapeamentos['3-piece-premium-fragrance-collection-set-28']"
            },
            "buscar_unified_por_shopify": {
                "descricao": "Para encontrar dados unified a partir do produto Shopify",
                "arquivo": "mapa_shopify_para_unified.json",
                "exemplo": "const unifiedData = mapa.mapeamentos['id1_gid://shopify/Product/9976055071005']"
            }
        },
        "exemplos_praticos": {
            "checkout": "Use mapa_sku_para_shopify.json para converter SKU em variant ID",
            "navegacao": "Use mapa_handle_para_shopify.json para redirecionar URLs",
            "sincronizacao": "Use mapa_shopify_para_unified.json para atualizar dados"
        }
    };
    
    const exemploUsoPath = path.join(__dirname, 'como_usar_mapas.json');
    fs.writeFileSync(exemploUsoPath, JSON.stringify(exemploUso, null, 2));
    
    console.log(`   📖 como_usar_mapas.json - Guia de uso`);
    console.log(`\n✅ OTIMIZAÇÃO CONCLUÍDA COM SUCESSO!`);
    
} catch (error) {
    console.error('❌ Erro ao otimizar mapas:', error.message);
    process.exit(1);
}