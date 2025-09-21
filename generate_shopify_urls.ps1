# Script para gerar URLs da Shopify para teste dos produtos
# Após remoção da EuroPride, restaram apenas as lojas 2 (WIFI MONEY) e 3 (SADERSTORE)

Write-Host "🔗 Gerando URLs da Shopify para teste dos produtos..." -ForegroundColor Cyan

# Configurações das lojas
$stores = @{
    "2" = @{
        "name" = "WIFI MONEY"
        "domain" = "nkgzhm-1d.myshopify.com"
        "custom_domain" = "tpsfragrances.shop"
    }
    "3" = @{
        "name" = "SADERSTORE"
        "domain" = "ae888e.myshopify.com"
        "custom_domain" = "tpsperfumeshop.shop"
    }
}

# Ler o arquivo de mapeamento
$mappingPath = "data/shopify_variant_mapping.json"
if (-not (Test-Path $mappingPath)) {
    Write-Host "❌ Arquivo de mapeamento não encontrado: $mappingPath" -ForegroundColor Red
    exit 1
}

$mapping = Get-Content $mappingPath | ConvertFrom-Json

# Criar arquivo de saída
$outputFile = "shopify_urls_for_testing.txt"
$urls = @()

Write-Host "📊 Analisando produtos..." -ForegroundColor Yellow

$productCount = 0
$urlCount = 0

foreach ($productHandle in $mapping.PSObject.Properties.Name) {
    $productCount++
    $product = $mapping.$productHandle
    
    Write-Host "🔍 Produto: $productHandle" -ForegroundColor White
    
    foreach ($storeId in $product.PSObject.Properties.Name) {
        if ($stores.ContainsKey($storeId)) {
            $storeInfo = $stores[$storeId]
            $productData = $product.$storeId
            
            # URL do produto na loja Shopify
            $shopifyUrl = "https://$($storeInfo.domain)/products/$($productData.title)"
            $customUrl = "https://$($storeInfo.custom_domain)/products/$($productData.title)"
            
            # URL do admin para verificar o produto
            $adminUrl = "https://$($storeInfo.domain)/admin/products/$($productData.product_id)"
            
            $urls += ""
            $urls += "=== PRODUTO: $productHandle ==="
            $urls += "Loja: $($storeInfo.name) (ID: $storeId)"
            $urls += "Product ID: $($productData.product_id)"
            $urls += "Primary Variant ID: $($productData.primary_variant_id)"
            $urls += ""
            $urls += "🌐 URL Shopify: $shopifyUrl"
            $urls += "🌐 URL Custom Domain: $customUrl"
            $urls += "⚙️  URL Admin: $adminUrl"
            $urls += ""
            $urls += "🛒 Teste de Carrinho (Cart API):"
            $urls += "POST https://$($storeInfo.domain)/cart/add.js"
            $urls += "Body: {`"id`": `"$($productData.primary_variant_id)`", `"quantity`": 1}"
            $urls += ""
            $urls += "🛒 URL Direta do Carrinho:"
            $urls += "https://$($storeInfo.domain)/cart/$($productData.primary_variant_id):1"
            $urls += ""
            
            $urlCount++
            
            Write-Host "  ✅ $($storeInfo.name): $shopifyUrl" -ForegroundColor Green
        }
    }
}

# Adicionar estatísticas
$urls = @(
    "🔗 URLS DA SHOPIFY PARA TESTE DOS PRODUTOS",
    "Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "",
    "📊 ESTATÍSTICAS:",
    "Total de produtos: $productCount",
    "Total de URLs geradas: $urlCount",
    "Lojas ativas: 2 (WIFI MONEY, SADERSTORE)",
    "",
    "🏪 CONFIGURAÇÕES DAS LOJAS:",
    "Loja 2 - WIFI MONEY:",
    "  - Domínio Shopify: nkgzhm-1d.myshopify.com",
    "  - Domínio Custom: tpsfragrances.shop",
    "",
    "Loja 3 - SADERSTORE:",
    "  - Domínio Shopify: ae888e.myshopify.com",
    "  - Domínio Custom: tpsperfumeshop.shop",
    "",
    "=" * 80,
    ""
) + $urls

# Salvar no arquivo
$urls | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✅ URLs geradas com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivo salvo: $outputFile" -ForegroundColor Cyan
Write-Host "📊 Total de produtos: $productCount" -ForegroundColor Yellow
Write-Host "🔗 Total de URLs: $urlCount" -ForegroundColor Yellow

# Mostrar algumas URLs de exemplo
Write-Host "`n🔍 EXEMPLOS DE URLS GERADAS:" -ForegroundColor Magenta
$exampleCount = 0
foreach ($line in $urls) {
    if ($line -like "*URL Shopify:*" -and $exampleCount -lt 5) {
        Write-Host "  $line" -ForegroundColor White
        $exampleCount++
    }
}

Write-Host "`n💡 DICAS PARA TESTE:" -ForegroundColor Yellow
Write-Host "1. Use as URLs Shopify (.myshopify.com) para testes diretos" -ForegroundColor White
Write-Host "2. Use as URLs Custom Domain para testes de produção" -ForegroundColor White
Write-Host "3. Use as URLs Admin para verificar configurações" -ForegroundColor White
Write-Host "4. Teste as URLs de carrinho para validar a funcionalidade" -ForegroundColor White