require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configuração da API do Shopify
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

if (!SHOPIFY_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    console.error('❌ Variáveis de ambiente obrigatórias não definidas:');
    console.error('   SHOPIFY_DOMAIN:', SHOPIFY_DOMAIN ? '✅' : '❌');
    console.error('   SHOPIFY_ADMIN_TOKEN:', SHOPIFY_ADMIN_TOKEN ? '✅' : '❌');
    process.exit(1);
}

// Função para fazer requisições à API do Shopify
async function shopifyRequest(query, method = 'POST', variables = {}) {
    try {
        const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2023-10/graphql.json`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        
        if (data.errors) {
            console.error('Erros GraphQL:', data.errors);
            return null;
        }
        
        return data.data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        return null;
    }
}

// Função para adicionar imagem genérica ao produto
async function addGenericImage(productId) {
    const mutation = `
        mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
            productCreateMedia(productId: $productId, media: $media) {
                media {
                    id
                    alt
                    mediaContentType
                    status
                }
                mediaUserErrors {
                    field
                    message
                }
            }
        }
    `;

    const media = [{
        originalSource: "https://cdn.shopify.com/s/files/1/0703/6534/8125/files/imagem_dos_produtos.jpg",
        alt: "Perfume Premium Collection",
        mediaContentType: "IMAGE"
    }];

    try {
        const result = await shopifyRequest(mutation, 'POST', { productId, media });
        if (result && result.productCreateMedia && result.productCreateMedia.mediaUserErrors.length === 0) {
            console.log(`   ✅ Imagem genérica adicionada`);
            return true;
        } else {
            console.log(`   ⚠️ Erro ao adicionar imagem:`, result?.productCreateMedia?.mediaUserErrors);
            return false;
        }
    } catch (error) {
        console.log(`   ⚠️ Erro ao adicionar imagem:`, error.message);
        return false;
    }
}

// Função para atualizar preço da variante
async function updateVariantPrice(variantId, price) {
    const mutation = `
        mutation productVariantUpdate($input: ProductVariantInput!) {
            productVariantUpdate(input: $input) {
                productVariant {
                    id
                    price
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const input = {
        id: variantId,
        price: price.toString()
    };

    try {
        const result = await shopifyRequest(mutation, 'POST', { input });
        if (result && result.productVariantUpdate && result.productVariantUpdate.productVariant) {
            console.log(`   ✅ Preço atualizado: £${price}`);
            return true;
        } else {
            console.log(`   ⚠️ Erro ao atualizar preço:`, result?.productVariantUpdate?.userErrors);
            return false;
        }
    } catch (error) {
        console.log(`   ⚠️ Erro ao atualizar preço:`, error.message);
        return false;
    }
}

// Função para criar produto no Shopify
async function createProduct(productData) {
    const mutation = `
        mutation productCreate($input: ProductInput!) {
            productCreate(input: $input) {
                product {
                    id
                    handle
                    title
                    variants(first: 5) {
                        edges {
                            node {
                                id
                                title
                                price
                                sku
                                availableForSale
                            }
                        }
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const input = {
        title: productData.handle,
        handle: productData.handle,
        descriptionHtml: `${productData.handle}Produto premium disponível.`,
        productType: productData.category,
        vendor: productData.primary_brand,
        tags: ['collection', 'premium'],
        status: 'ACTIVE',
        seo: {
            title: productData.handle,
            description: `${productData.handle}Produto premium disponível.`
        }
    };

    const result = await shopifyRequest(mutation, 'POST', { input });
    
    if (result && result.productCreate && result.productCreate.product) {
        const product = result.productCreate.product;
        
        // Preço será definido posteriormente via Admin API REST
        console.log(`   ℹ️ Produto criado, preço padrão: £${productData.price.regular}`);
        
        // Adicionar imagem genérica
        await addGenericImage(product.id);
        
        return product;
    } else if (result && result.productCreate && result.productCreate.userErrors.length > 0) {
        console.error('Erros do usuário:', result.productCreate.userErrors);
        return null;
    } else {
        console.error('Resposta inesperada:', result);
        return null;
    }
}

// Função principal para testar importação
async function testImportFewProducts() {
    console.log('🧪 TESTE DE IMPORTAÇÃO - POUCOS PRODUTOS');
    console.log('==========================================');
    
    // Carregar dados dos produtos
    const dataPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Pegar apenas os primeiros 3 produtos para teste
    const products = data.products.slice(0, 3);
    
    console.log(`📦 Testando importação de ${products.length} produtos...`);
    
    const results = {
        success: [],
        errors: []
    };
    
    // Importar produtos um por um
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`\n[${i + 1}/${products.length}] Testando: ${product.handle}`);
        
        try {
            const createdProduct = await createProduct(product);
            
            if (createdProduct) {
                console.log(`✅ Produto criado com sucesso: ${createdProduct.handle}`);
                console.log(`   ID: ${createdProduct.id}`);
                console.log(`   Título: ${createdProduct.title}`);
                
                results.success.push({
                    handle: product.handle,
                    title: createdProduct.title,
                    shopifyId: createdProduct.id,
                    variantId: createdProduct.variants?.edges[0]?.node?.id
                });
            } else {
                console.log(`❌ Falha ao criar produto: ${product.handle}`);
                results.errors.push({
                    handle: product.handle,
                    error: 'Falha na criação'
                });
            }
        } catch (error) {
            console.error(`❌ Erro ao processar produto ${product.handle}:`, error.message);
            results.errors.push({
                handle: product.handle,
                error: error.message
            });
        }
        
        // Pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Resumo do teste
    console.log('\n📊 RESUMO DO TESTE:');
    console.log(`✅ Produtos criados com sucesso: ${results.success.length}`);
    console.log(`❌ Produtos com erro: ${results.errors.length}`);
    
    if (results.success.length > 0) {
        console.log('\n✅ PRODUTOS CRIADOS:');
        results.success.forEach(product => {
            console.log(`   - ${product.handle} (${product.title})`);
        });
    }
    
    if (results.errors.length > 0) {
        console.log('\n❌ ERROS ENCONTRADOS:');
        results.errors.forEach(error => {
            console.log(`   - ${error.handle}: ${error.error}`);
        });
    }
    
    console.log('\n🧪 Teste concluído!');
}

// Executar teste
if (require.main === module) {
    testImportFewProducts().catch(console.error);
}

module.exports = { testImportFewProducts };