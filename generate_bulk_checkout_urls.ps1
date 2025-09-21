# Script para Gerar URLs de Checkout em Massa
# Cria URLs para todos os cenários possíveis de teste

Write-Host "💥 Gerando URLs de Checkout EM MASSA..." -ForegroundColor Red
Write-Host "=" * 60

# Ler dados
$mappingFile = "data/shopify_variant_mapping.json"
$mapping = Get-Content $mappingFile -Raw | ConvertFrom-Json

# Configurações das lojas
$stores = @{
    "2" = @{
        name = "WIFI MONEY"
        domain = "tpsfragrances.shop"
        myshopifyDomain = "nkgzhm-1d.myshopify.com"
    }
    "3" = @{
        name = "SADERSTORE"
        domain = "tpsperfumeshop.shop"
        myshopifyDomain = "ae888e.myshopify.com"
    }
}

# Arrays para diferentes tipos de URLs
$checkoutUrls = @()
$productUrls = @()
$apiUrls = @()
$testUrls = @()

$totalUrls = 0

Write-Host "🔄 Processando produtos..." -ForegroundColor Yellow

foreach ($productHandle in $mapping.PSObject.Properties.Name) {
    $product = $mapping.$productHandle
    
    foreach ($storeId in $product.PSObject.Properties.Name) {
        if ($storeId -eq "title") { continue }
        
        $storeData = $product.$storeId
        $store = $stores[$storeId]
        if (-not $store) { continue }
        
        $primaryVariant = $storeData.primary_variant_id
        if (-not $primaryVariant) { continue }
        
        # 1. URLs de Checkout Básicas
        $checkoutUrls += "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1"
        $checkoutUrls += "https://$($store.domain)/cart/$($primaryVariant):1"
        $checkoutUrls += "https://$($store.myshopifyDomain)/cart/add?id=$primaryVariant&quantity=1"
        $checkoutUrls += "https://$($store.domain)/cart/add?id=$primaryVariant&quantity=1"
        
        # 2. URLs com Quantidades Diferentes
        foreach ($qty in @(2, 3, 5, 10)) {
            $checkoutUrls += "https://$($store.myshopifyDomain)/cart/$($primaryVariant):$qty"
            $checkoutUrls += "https://$($store.domain)/cart/$($primaryVariant):$qty"
        }
        
        # 3. URLs de Produto
        $productUrls += "https://$($store.myshopifyDomain)/products/$($storeData.handle)"
        $productUrls += "https://$($store.domain)/products/$($storeData.handle)"
        $productUrls += "https://$($store.myshopifyDomain)/products/$($storeData.handle)?variant=$primaryVariant"
        $productUrls += "https://$($store.domain)/products/$($storeData.handle)?variant=$primaryVariant"
        
        # 4. URLs de API
        $apiUrls += "https://$($store.myshopifyDomain)/products/$($storeData.handle).json"
        $apiUrls += "https://$($store.myshopifyDomain)/variants/$primaryVariant.json"
        
        # 5. URLs com Parâmetros UTM
        $utmParams = @(
            "utm_source=test&utm_medium=direct&utm_campaign=checkout",
            "utm_source=email&utm_medium=newsletter&utm_campaign=promo",
            "utm_source=social&utm_medium=facebook&utm_campaign=ads",
            "utm_source=google&utm_medium=cpc&utm_campaign=search"
        )
        
        foreach ($utm in $utmParams) {
            $testUrls += "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1?$utm"
            $testUrls += "https://$($store.domain)/cart/$($primaryVariant):1?$utm"
        }
        
        # 6. URLs com Redirecionamento
        $testUrls += "https://$($store.myshopifyDomain)/cart/add?id=$primaryVariant&quantity=1&return_to=/checkout"
        $testUrls += "https://$($store.myshopifyDomain)/cart/add?id=$primaryVariant&quantity=1&return_to=/cart"
        $testUrls += "https://$($store.myshopifyDomain)/cart/add?id=$primaryVariant&quantity=1&return_to=/products/$($storeData.handle)"
        
        # 7. URLs com Desconto (exemplos)
        $discounts = @("SAVE10", "WELCOME", "FIRST20", "BULK15")
        foreach ($discount in $discounts) {
            $testUrls += "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1?discount=$discount"
        }
        
        # 8. URLs Mobile
        $testUrls += "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1?view=mobile"
        $testUrls += "https://$($store.domain)/cart/$($primaryVariant):1?view=mobile"
        
        # 9. URLs com Múltiplos Variants (se disponível)
        if ($storeData.variant_ids -and $storeData.variant_ids.Count -gt 1) {
            $variants = $storeData.variant_ids[0..([Math]::Min(2, $storeData.variant_ids.Count-1))]
            $multiCart = ($variants | ForEach-Object { "$_`:1" }) -join ","
            $testUrls += "https://$($store.myshopifyDomain)/cart/$multiCart"
            $testUrls += "https://$($store.domain)/cart/$multiCart"
        }
    }
}

# URLs Especiais por Loja
foreach ($storeId in $stores.Keys) {
    $store = $stores[$storeId]
    
    # URLs Administrativas
    $apiUrls += "https://$($store.myshopifyDomain)/admin"
    $apiUrls += "https://$($store.myshopifyDomain)/admin/products"
    $apiUrls += "https://$($store.myshopifyDomain)/admin/orders"
    $apiUrls += "https://$($store.myshopifyDomain)/admin/customers"
    
    # URLs de API Geral
    $apiUrls += "https://$($store.myshopifyDomain)/products.json"
    $apiUrls += "https://$($store.myshopifyDomain)/collections.json"
    $apiUrls += "https://$($store.myshopifyDomain)/cart.json"
    $apiUrls += "https://$($store.myshopifyDomain)/sitemap.xml"
    
    # URLs de Teste de Conectividade
    $testUrls += "https://$($store.myshopifyDomain)/"
    $testUrls += "https://$($store.domain)/"
    $testUrls += "https://$($store.myshopifyDomain)/cart"
    $testUrls += "https://$($store.domain)/cart"
    $testUrls += "https://$($store.myshopifyDomain)/cart/clear"
    $testUrls += "https://$($store.domain)/cart/clear"
}

# Contar URLs
$totalUrls = $checkoutUrls.Count + $productUrls.Count + $apiUrls.Count + $testUrls.Count

# Gerar arquivo de saída
$outputFile = "bulk_checkout_urls.txt"
$output = @()

$output += "💥 URLS DE CHECKOUT EM MASSA"
$output += "=" * 60
$output += "Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += "Total de URLs: $totalUrls"
$output += ""

# Seção 1: URLs de Checkout
$output += "🛒 URLS DE CHECKOUT DIRETO ($($checkoutUrls.Count) URLs)"
$output += "=" * 50
foreach ($url in $checkoutUrls) {
    $output += $url
}
$output += ""

# Seção 2: URLs de Produto
$output += "🔗 URLS DE PRODUTO ($($productUrls.Count) URLs)"
$output += "=" * 50
foreach ($url in $productUrls) {
    $output += $url
}
$output += ""

# Seção 3: URLs de API
$output += "🔧 URLS DE API E ADMIN ($($apiUrls.Count) URLs)"
$output += "=" * 50
foreach ($url in $apiUrls) {
    $output += $url
}
$output += ""

# Seção 4: URLs de Teste
$output += "🧪 URLS DE TESTE E ESPECIAIS ($($testUrls.Count) URLs)"
$output += "=" * 50
foreach ($url in $testUrls) {
    $output += $url
}
$output += ""

# Estatísticas
$output += "📊 ESTATÍSTICAS DETALHADAS"
$output += "=" * 40
$output += "URLs de Checkout: $($checkoutUrls.Count)"
$output += "URLs de Produto: $($productUrls.Count)"
$output += "URLs de API: $($apiUrls.Count)"
$output += "URLs de Teste: $($testUrls.Count)"
$output += "TOTAL: $totalUrls"
$output += ""

# Scripts de teste
$output += "🚀 SCRIPTS DE TESTE EM LOTE"
$output += "=" * 40
$output += ""
$output += "# PowerShell - Testar primeiras 10 URLs de checkout:"
$output += '$checkoutUrls = @('
for ($i = 0; $i -lt [Math]::Min(10, $checkoutUrls.Count); $i++) {
    $output += "    `"$($checkoutUrls[$i])`","
}
$output += ")"
$output += 'foreach ($url in $checkoutUrls) { Start-Process $url; Start-Sleep 1 }'
$output += ""
$output += "# Bash - Testar conectividade:"
$output += "urls=("
for ($i = 0; $i -lt [Math]::Min(5, $testUrls.Count); $i++) {
    $output += "    `"$($testUrls[$i])`""
}
$output += ")"
$output += 'for url in "${urls[@]}"; do curl -I "$url"; done'

# Salvar arquivo
$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✅ URLs em massa geradas!" -ForegroundColor Green
Write-Host "📁 Arquivo: $outputFile" -ForegroundColor Cyan
Write-Host "🔗 Total de URLs: $totalUrls" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 BREAKDOWN:" -ForegroundColor Magenta
Write-Host "   🛒 Checkout: $($checkoutUrls.Count)" -ForegroundColor White
Write-Host "   🔗 Produto: $($productUrls.Count)" -ForegroundColor White
Write-Host "   🔧 API: $($apiUrls.Count)" -ForegroundColor White
Write-Host "   🧪 Teste: $($testUrls.Count)" -ForegroundColor White

# Criar arquivo CSV para fácil importação
$csvFile = "checkout_urls.csv"
$csvData = @()
$csvData += "Tipo,URL,Loja,Produto"

foreach ($url in $checkoutUrls) {
    $loja = if ($url -match "nkgzhm-1d") { "WIFI MONEY" } else { "SADERSTORE" }
    $csvData += "Checkout,$url,$loja,N/A"
}

foreach ($url in $productUrls) {
    $loja = if ($url -match "nkgzhm-1d") { "WIFI MONEY" } else { "SADERSTORE" }
    $csvData += "Produto,$url,$loja,N/A"
}

$csvData | Out-File -FilePath $csvFile -Encoding UTF8

Write-Host "📋 Arquivo CSV criado: $csvFile" -ForegroundColor Green
Write-Host "💡 Use o CSV para importar em planilhas ou ferramentas de teste!" -ForegroundColor Yellow