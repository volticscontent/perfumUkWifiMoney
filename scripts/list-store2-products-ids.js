const fs = require('fs');
const path = require('path');

// Função para carregar os produtos da Store 2
function loadStore2Products() {
    const productsPath = path.join(__dirname, '..', 'data', 'store2-products-with-variants.json');
    
    if (!fs.existsSync(productsPath)) {
        console.error('❌ Arquivo store2-products-with-variants.json não encontrado!');
        process.exit(1);
    }
    
    const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    return data.products;
}

// Função para extrair informações dos produtos
function extractProductInfo(products) {
    const productList = [];
    
    products.forEach((product, index) => {
        const productInfo = {
            index: index + 1,
            productId: product.id,
            handle: product.handle,
            title: product.title,
            vendor: product.vendor,
            variants: product.variants.map(variant => ({
                variantId: variant.id,
                title: variant.title,
                sku: variant.sku,
                price: variant.price,
                availableForSale: variant.availableForSale
            })),
            priceRange: product.priceRange,
            images: product.images,
            tags: product.tags
        };
        
        productList.push(productInfo);
    });
    
    return productList;
}

// Função para gerar relatório detalhado
function generateDetailedReport(productList) {
    const report = {
        summary: {
            totalProducts: productList.length,
            totalVariants: productList.reduce((sum, product) => sum + product.variants.length, 0),
            priceRange: {
                min: Math.min(...productList.map(p => p.priceRange.min)),
                max: Math.max(...productList.map(p => p.priceRange.max))
            },
            vendors: [...new Set(productList.map(p => p.vendor))],
            tags: [...new Set(productList.flatMap(p => p.tags || []))]
        },
        products: productList,
        variantMapping: {},
        handleMapping: {}
    };
    
    // Criar mapeamentos para fácil acesso
    productList.forEach(product => {
        // Mapeamento por handle
        report.handleMapping[product.handle] = {
            productId: product.productId,
            variants: product.variants
        };
        
        // Mapeamento por variant ID
        product.variants.forEach(variant => {
            report.variantMapping[variant.variantId] = {
                productId: product.productId,
                handle: product.handle,
                title: product.title,
                variantTitle: variant.title,
                sku: variant.sku,
                price: variant.price
            };
        });
    });
    
    return report;
}

// Função para exibir resumo no console
function displaySummary(report) {
    console.log('📦 PRODUTOS DA STORE 2 (WIFI MONEY)\n');
    
    console.log('📊 RESUMO:');
    console.log(`Total de produtos: ${report.summary.totalProducts}`);
    console.log(`Total de variantes: ${report.summary.totalVariants}`);
    console.log(`Faixa de preços: £${report.summary.priceRange.min} - £${report.summary.priceRange.max}`);
    console.log(`Fornecedores: ${report.summary.vendors.join(', ')}`);
    console.log(`Tags: ${report.summary.tags.slice(0, 10).join(', ')}${report.summary.tags.length > 10 ? '...' : ''}\n`);
    
    console.log('🛍️ LISTA DE PRODUTOS:\n');
    
    report.products.forEach(product => {
        console.log(`${product.index}. ${product.title}`);
        console.log(`   Product ID: ${product.productId}`);
        console.log(`   Handle: ${product.handle}`);
        console.log(`   Preço: £${product.priceRange.min}${product.priceRange.min !== product.priceRange.max ? ` - £${product.priceRange.max}` : ''}`);
        
        if (product.variants.length > 1) {
            console.log(`   Variantes (${product.variants.length}):`);
            product.variants.forEach((variant, vIndex) => {
                console.log(`     ${vIndex + 1}. ID: ${variant.variantId} | SKU: ${variant.sku} | £${variant.price}`);
            });
        } else {
            console.log(`   Variant ID: ${product.variants[0].variantId} | SKU: ${product.variants[0].sku}`);
        }
        console.log('');
    });
}

// Função principal
function main() {
    console.log('🔍 Carregando produtos da Store 2...\n');
    
    try {
        // Carregar produtos
        const products = loadStore2Products();
        console.log('✅ Produtos carregados com sucesso');
        
        // Extrair informações
        const productList = extractProductInfo(products);
        console.log('✅ Informações extraídas');
        
        // Gerar relatório
        const report = generateDetailedReport(productList);
        console.log('✅ Relatório gerado\n');
        
        // Salvar relatório completo
        const reportPath = path.join(__dirname, '..', 'data', 'store2-products-detailed-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`✅ Relatório detalhado salvo em: ${reportPath}\n`);
        
        // Exibir resumo
        displaySummary(report);
        
        console.log('🎯 Lista completa gerada! Verifique o arquivo JSON para mapeamentos detalhados.');
        
    } catch (error) {
        console.error('❌ Erro durante o processamento:', error.message);
        process.exit(1);
    }
}

// Executar script
main();