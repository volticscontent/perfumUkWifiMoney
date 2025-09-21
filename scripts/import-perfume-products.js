const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração da API do Shopify
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

if (!SHOPIFY_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    console.error('❌ Erro: Variáveis de ambiente SHOPIFY_DOMAIN e SHOPIFY_ADMIN_TOKEN são obrigatórias');
    console.log('SHOPIFY_DOMAIN:', SHOPIFY_DOMAIN);
    console.log('SHOPIFY_ADMIN_TOKEN:', SHOPIFY_ADMIN_TOKEN ? 'Definido' : 'Não definido');
    process.exit(1);
}

// Função para fazer requisições à API do Shopify
async function shopifyRequest(endpoint, method = 'GET', data = null) {
    const url = `https://${SHOPIFY_DOMAIN}/admin/api/2023-10/graphql.json`;
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
        },
        body: JSON.stringify({ query: endpoint, variables: data })
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (result.errors) {
            console.error('Erro na API:', result.errors);
            return null;
        }
        
        return result.data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        return null;
    }
}

// Função para criar um produto no Shopify
async function createProduct(productData) {
    const mutation = `
        mutation productCreate($input: ProductInput!) {
            productCreate(input: $input) {
                product {
                    id
                    handle
                    title
                    variants(first: 10) {
                        edges {
                            node {
                                id
                                title
                                price
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
    }
    
    return null;
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
        price: price.toString(),
        inventoryManagement: 'SHOPIFY',
        inventoryPolicy: 'CONTINUE'
    };

    return await shopifyRequest(mutation, 'POST', { input });
}

// Função principal
async function importPerfumeProducts() {
    console.log('🚀 Iniciando importação de produtos de perfume...');
    
    // Carregar dados dos produtos unificados
    const unifiedProductsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
    
    if (!fs.existsSync(unifiedProductsPath)) {
        console.error('❌ Arquivo unified_products_en_gbp.json não encontrado');
        return;
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedProductsPath, 'utf8'));
    const products = unifiedData.products;
    
    console.log(`📦 Encontrados ${products.length} produtos para importar`);
    
    const results = {
        success: [],
        errors: [],
        mapping: {}
    };
    
    // Importar produtos um por um
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`\n[${i + 1}/${products.length}] Importando: ${product.title}`);
        
        try {
            const createdProduct = await createProduct(product);
            
            if (createdProduct) {
                console.log(`✅ Produto criado com sucesso: ${createdProduct.handle}`);
                console.log(`   ID: ${createdProduct.id}`);
                
                // Salvar mapeamento
                if (createdProduct.variants && createdProduct.variants.edges.length > 0) {
                    const variantId = createdProduct.variants.edges[0].node.id;
                    results.mapping[product.handle] = variantId;
                    console.log(`   Variant ID: ${variantId}`);
                }
                
                results.success.push({
                    handle: product.handle,
                    title: product.title,
                    shopifyId: createdProduct.id,
                    variantId: createdProduct.variants?.edges[0]?.node?.id
                });
            } else {
                console.log(`❌ Falha ao criar produto: ${product.title}`);
                results.errors.push({
                    handle: product.handle,
                    title: product.title,
                    error: 'Falha na criação'
                });
            }
        } catch (error) {
            console.error(`❌ Erro ao processar produto ${product.title}:`, error.message);
            results.errors.push({
                handle: product.handle,
                title: product.title,
                error: error.message
            });
        }
        
        // Pausa entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Salvar relatório de importação
    const reportPath = path.join(__dirname, '..', 'reports', 'import-perfume-products-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    // Atualizar mapeamento de variants
    if (Object.keys(results.mapping).length > 0) {
        const mappingPath = path.join(__dirname, '..', 'data', 'shopify_variant_mapping.json');
        let existingMapping = {};
        
        if (fs.existsSync(mappingPath)) {
            existingMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        }
        
        // Mesclar mapeamentos
        const updatedMapping = { ...existingMapping, ...results.mapping };
        
        // Criar backup
        const backupPath = `${mappingPath}.backup_${Date.now()}`;
        if (fs.existsSync(mappingPath)) {
            fs.copyFileSync(mappingPath, backupPath);
            console.log(`📋 Backup do mapeamento criado: ${backupPath}`);
        }
        
        // Salvar mapeamento atualizado
        fs.writeFileSync(mappingPath, JSON.stringify(updatedMapping, null, 2));
        console.log(`📋 Mapeamento atualizado salvo: ${mappingPath}`);
        
        // Copiar para pasta public
        const publicMappingPath = path.join(__dirname, '..', 'public', 'data', 'shopify_variant_mapping.json');
        fs.writeFileSync(publicMappingPath, JSON.stringify(updatedMapping, null, 2));
        console.log(`📋 Mapeamento copiado para public: ${publicMappingPath}`);
    }
    
    // Resumo final
    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Produtos criados com sucesso: ${results.success.length}`);
    console.log(`❌ Produtos com erro: ${results.errors.length}`);
    console.log(`📋 Relatório salvo em: ${reportPath}`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ ERROS ENCONTRADOS:');
        results.errors.forEach(error => {
            console.log(`   - ${error.title}: ${error.error}`);
        });
    }
    
    console.log('\n🎉 Importação concluída!');
}

// Executar script
if (require.main === module) {
    importPerfumeProducts().catch(console.error);
}

module.exports = { importPerfumeProducts };