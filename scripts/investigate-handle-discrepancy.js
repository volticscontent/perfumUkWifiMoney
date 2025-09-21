const fs = require('fs');
const path = require('path');

// Carregar dados
const unifiedProducts = JSON.parse(fs.readFileSync('data/unified_products_en_gbp.json', 'utf8'));
const shopifyMapping = JSON.parse(fs.readFileSync('data/shopify_variant_mapping.json', 'utf8'));

console.log('🔍 INVESTIGANDO DISCREPÂNCIAS DE HANDLES...\n');

// Analisar produtos locais vs mapeamento Shopify
const discrepancies = [];
const correctMappings = [];

unifiedProducts.forEach((product, index) => {
    const localId = product.id;
    const handle = product.handle;
    const shopifyVariantId = shopifyMapping[handle];
    
    // Extrair número do handle
    const handleMatch = handle.match(/(\d+)$/);
    const handleNumber = handleMatch ? parseInt(handleMatch[1]) : null;
    
    console.log(`[${index + 1}/${unifiedProducts.length}] Produto ID: ${localId}, Handle: ${handle}`);
    console.log(`  Handle Number: ${handleNumber}, Shopify Variant: ${shopifyVariantId || 'NÃO MAPEADO'}`);
    
    if (handleNumber && localId !== handleNumber) {
        discrepancies.push({
            localId,
            handle,
            handleNumber,
            shopifyVariantId,
            difference: handleNumber - localId,
            title: product.title
        });
        console.log(`  ⚠️  DISCREPÂNCIA: ID local ${localId} vs Handle number ${handleNumber} (diff: ${handleNumber - localId})`);
    } else {
        correctMappings.push({
            localId,
            handle,
            handleNumber,
            shopifyVariantId,
            title: product.title
        });
        console.log(`  ✅ CORRETO: ID e handle number coincidem`);
    }
    console.log('');
});

// Análise de padrões
console.log('\n📊 ANÁLISE DE DISCREPÂNCIAS:');
console.log(`Total de produtos: ${unifiedProducts.length}`);
console.log(`Produtos com handles corretos: ${correctMappings.length}`);
console.log(`Produtos com discrepâncias: ${discrepancies.length}`);

if (discrepancies.length > 0) {
    console.log('\n🔍 PADRÕES DE DISCREPÂNCIAS:');
    
    // Agrupar por diferença
    const differenceGroups = {};
    discrepancies.forEach(disc => {
        const diff = disc.difference;
        if (!differenceGroups[diff]) {
            differenceGroups[diff] = [];
        }
        differenceGroups[diff].push(disc);
    });
    
    Object.keys(differenceGroups).forEach(diff => {
        const group = differenceGroups[diff];
        console.log(`\nDiferença +${diff}: ${group.length} produtos`);
        group.forEach(item => {
            console.log(`  - ${item.handle} (ID: ${item.localId} → Handle: ${item.handleNumber})`);
        });
    });
}

// Verificar se há produtos no Shopify que não estão mapeados
console.log('\n🔍 VERIFICANDO MAPEAMENTOS SHOPIFY:');
const mappedHandles = Object.keys(shopifyMapping);
const localHandles = unifiedProducts.map(p => p.handle);

const unmappedInLocal = mappedHandles.filter(handle => !localHandles.includes(handle));
const unmappedInShopify = localHandles.filter(handle => !mappedHandles.includes(handle));

console.log(`Handles no Shopify mas não locais: ${unmappedInLocal.length}`);
if (unmappedInLocal.length > 0) {
    console.log('Handles órfãos no Shopify:');
    unmappedInLocal.forEach(handle => {
        console.log(`  - ${handle} → ${shopifyMapping[handle]}`);
    });
}

console.log(`\nHandles locais mas não no Shopify: ${unmappedInShopify.length}`);
if (unmappedInShopify.length > 0) {
    console.log('Handles não mapeados:');
    unmappedInShopify.forEach(handle => {
        const product = unifiedProducts.find(p => p.handle === handle);
        console.log(`  - ${handle} (ID: ${product.id}, Title: ${product.title})`);
    });
}

// Salvar relatório
const report = {
    timestamp: new Date().toISOString(),
    summary: {
        totalProducts: unifiedProducts.length,
        correctMappings: correctMappings.length,
        discrepancies: discrepancies.length,
        unmappedInLocal: unmappedInLocal.length,
        unmappedInShopify: unmappedInShopify.length
    },
    discrepancies,
    correctMappings,
    unmappedInLocal: unmappedInLocal.map(handle => ({
        handle,
        shopifyVariantId: shopifyMapping[handle]
    })),
    unmappedInShopify: unmappedInShopify.map(handle => {
        const product = unifiedProducts.find(p => p.handle === handle);
        return {
            handle,
            localId: product.id,
            title: product.title
        };
    }),
    differencePatterns: Object.keys(differenceGroups || {}).map(diff => ({
        difference: parseInt(diff),
        count: differenceGroups[diff].length,
        products: differenceGroups[diff]
    }))
};

const reportPath = 'reports/handle-discrepancy-analysis.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n💾 Relatório salvo em: ${reportPath}`);

if (discrepancies.length > 0) {
    console.log('\n🚨 AÇÃO NECESSÁRIA:');
    console.log('Foram encontradas discrepâncias entre IDs locais e números nos handles.');
    console.log('Isso pode causar problemas no mapeamento com o Shopify.');
    console.log('Recomenda-se corrigir os handles para corresponder aos IDs locais.');
} else {
    console.log('\n✅ TUDO CERTO:');
    console.log('Não foram encontradas discrepâncias nos handles.');
}