const fs = require('fs');
const path = require('path');

// Função para ler e parsear o arquivo .env
function parseEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ Arquivo .env não encontrado!');
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    // Parse das variáveis do .env
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    
    return envVars;
}

// Função para extrair tokens por store
function extractTokensByStore(envVars) {
    const stores = {
        store1: {
            name: "Store 1",
            domain: envVars.SHOPIFY_STORE_1_DOMAIN || 'N/A',
            myshopifyDomain: envVars.SHOPIFY_STORE_1_MYSHOPIFY_DOMAIN || 'N/A',
            tokens: {
                admin: {
                    key: envVars.SHOPIFY_STORE_1_API_KEY || 'N/A',
                    secret: envVars.SHOPIFY_STORE_1_API_SECRET || 'N/A',
                    token: envVars.SHOPIFY_STORE_1_ADMIN_TOKEN || 'N/A'
                },
                storefront: {
                    token: envVars.SHOPIFY_STORE_1_STOREFRONT_TOKEN || 'N/A'
                }
            }
        },
        store2: {
            name: "Store 2 (WIFI MONEY)",
            domain: envVars.SHOPIFY_STORE_2_DOMAIN || 'N/A',
            myshopifyDomain: envVars.SHOPIFY_STORE_2_MYSHOPIFY_DOMAIN || 'N/A',
            tokens: {
                admin: {
                    key: envVars.SHOPIFY_STORE_2_API_KEY || 'N/A',
                    secret: envVars.SHOPIFY_STORE_2_API_SECRET || 'N/A',
                    token: envVars.SHOPIFY_STORE_2_ADMIN_TOKEN || 'N/A'
                },
                storefront: {
                    token: envVars.SHOPIFY_STORE_2_STOREFRONT_TOKEN || 'N/A'
                }
            }
        },
        store3: {
            name: "Store 3",
            domain: envVars.SHOPIFY_STORE_3_DOMAIN || 'N/A',
            myshopifyDomain: envVars.SHOPIFY_STORE_3_MYSHOPIFY_DOMAIN || 'N/A',
            tokens: {
                admin: {
                    key: envVars.SHOPIFY_STORE_3_API_KEY || 'N/A',
                    secret: envVars.SHOPIFY_STORE_3_API_SECRET || 'N/A',
                    token: envVars.SHOPIFY_STORE_3_ADMIN_TOKEN || 'N/A'
                },
                storefront: {
                    token: envVars.SHOPIFY_STORE_3_STOREFRONT_TOKEN || 'N/A'
                }
            }
        }
    };
    
    return stores;
}

// Função para analisar tokens
function analyzeTokens(stores) {
    const analysis = {
        summary: {
            totalStores: 3,
            storesWithTokens: 0,
            missingTokens: [],
            duplicateTokens: [],
            tokenLengths: {}
        },
        details: {}
    };
    
    const allTokens = [];
    
    Object.keys(stores).forEach(storeKey => {
        const store = stores[storeKey];
        const storeAnalysis = {
            name: store.name,
            domain: store.domain,
            myshopifyDomain: store.myshopifyDomain,
            hasAllTokens: true,
            missingTokens: [],
            tokenInfo: {}
        };
        
        // Verificar Admin tokens
        if (store.tokens.admin.key === 'N/A') {
            storeAnalysis.hasAllTokens = false;
            storeAnalysis.missingTokens.push('API_KEY');
        } else {
            storeAnalysis.tokenInfo.apiKey = {
                value: store.tokens.admin.key,
                length: store.tokens.admin.key.length,
                type: 'API_KEY'
            };
            allTokens.push({
                store: storeKey,
                type: 'API_KEY',
                value: store.tokens.admin.key
            });
        }
        
        if (store.tokens.admin.secret === 'N/A') {
            storeAnalysis.hasAllTokens = false;
            storeAnalysis.missingTokens.push('API_SECRET');
        } else {
            storeAnalysis.tokenInfo.apiSecret = {
                value: store.tokens.admin.secret,
                length: store.tokens.admin.secret.length,
                type: 'API_SECRET'
            };
            allTokens.push({
                store: storeKey,
                type: 'API_SECRET',
                value: store.tokens.admin.secret
            });
        }
        
        if (store.tokens.admin.token === 'N/A') {
            storeAnalysis.hasAllTokens = false;
            storeAnalysis.missingTokens.push('ADMIN_TOKEN');
        } else {
            storeAnalysis.tokenInfo.adminToken = {
                value: store.tokens.admin.token,
                length: store.tokens.admin.token.length,
                type: 'ADMIN_TOKEN'
            };
            allTokens.push({
                store: storeKey,
                type: 'ADMIN_TOKEN',
                value: store.tokens.admin.token
            });
        }
        
        // Verificar Storefront token
        if (store.tokens.storefront.token === 'N/A') {
            storeAnalysis.hasAllTokens = false;
            storeAnalysis.missingTokens.push('STOREFRONT_TOKEN');
        } else {
            storeAnalysis.tokenInfo.storefrontToken = {
                value: store.tokens.storefront.token,
                length: store.tokens.storefront.token.length,
                type: 'STOREFRONT_TOKEN'
            };
            allTokens.push({
                store: storeKey,
                type: 'STOREFRONT_TOKEN',
                value: store.tokens.storefront.token
            });
        }
        
        if (storeAnalysis.hasAllTokens) {
            analysis.summary.storesWithTokens++;
        }
        
        if (storeAnalysis.missingTokens.length > 0) {
            analysis.summary.missingTokens.push({
                store: storeKey,
                missing: storeAnalysis.missingTokens
            });
        }
        
        analysis.details[storeKey] = storeAnalysis;
    });
    
    // Verificar tokens duplicados
    const tokenValues = allTokens.map(t => t.value);
    const duplicates = tokenValues.filter((token, index) => tokenValues.indexOf(token) !== index);
    
    if (duplicates.length > 0) {
        duplicates.forEach(dupToken => {
            const stores = allTokens.filter(t => t.value === dupToken);
            analysis.summary.duplicateTokens.push({
                token: dupToken,
                usedBy: stores
            });
        });
    }
    
    // Análise de comprimentos de tokens
    allTokens.forEach(token => {
        if (!analysis.summary.tokenLengths[token.type]) {
            analysis.summary.tokenLengths[token.type] = [];
        }
        analysis.summary.tokenLengths[token.type].push({
            store: token.store,
            length: token.value.length
        });
    });
    
    return analysis;
}

// Função principal
function main() {
    console.log('🔍 Extraindo todos os tokens do arquivo .env...\n');
    
    try {
        // Parse do arquivo .env
        const envVars = parseEnvFile();
        console.log('✅ Arquivo .env carregado com sucesso');
        
        // Extrair tokens por store
        const stores = extractTokensByStore(envVars);
        console.log('✅ Tokens extraídos por store');
        
        // Analisar tokens
        const analysis = analyzeTokens(stores);
        console.log('✅ Análise de tokens concluída');
        
        // Criar resultado final
        const result = {
            timestamp: new Date().toISOString(),
            stores: stores,
            analysis: analysis
        };
        
        // Salvar em arquivo JSON
        const outputPath = path.join(__dirname, '..', 'data', 'all-tokens-analysis.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`✅ Resultado salvo em: ${outputPath}`);
        
        // Exibir resumo
        console.log('\n📊 RESUMO DA ANÁLISE:');
        console.log(`Total de stores: ${analysis.summary.totalStores}`);
        console.log(`Stores com todos os tokens: ${analysis.summary.storesWithTokens}`);
        
        if (analysis.summary.missingTokens.length > 0) {
            console.log('\n❌ TOKENS FALTANDO:');
            analysis.summary.missingTokens.forEach(item => {
                console.log(`  ${item.store}: ${item.missing.join(', ')}`);
            });
        }
        
        if (analysis.summary.duplicateTokens.length > 0) {
            console.log('\n⚠️  TOKENS DUPLICADOS:');
            analysis.summary.duplicateTokens.forEach(item => {
                console.log(`  Token: ${item.token.substring(0, 10)}...`);
                console.log(`  Usado por: ${item.usedBy.map(s => s.store).join(', ')}`);
            });
        }
        
        console.log('\n📋 COMPRIMENTOS DOS TOKENS:');
        Object.keys(analysis.summary.tokenLengths).forEach(tokenType => {
            console.log(`  ${tokenType}:`);
            analysis.summary.tokenLengths[tokenType].forEach(info => {
                console.log(`    ${info.store}: ${info.length} caracteres`);
            });
        });
        
        console.log('\n🎯 Análise completa! Verifique o arquivo JSON para detalhes completos.');
        
    } catch (error) {
        console.error('❌ Erro durante a análise:', error.message);
        process.exit(1);
    }
}

// Executar script
main();