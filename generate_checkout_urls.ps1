# Script para gerar URLs de checkout direto da Shopify
# Este script cria URLs que levam diretamente ao processo de compra

Write-Host "🛒 Gerando URLs de Checkout Direto da Shopify..." -ForegroundColor Green
Write-Host "=" * 60

# Ler o arquivo de mapeamento de produtos
$mappingFile = "data/shopify_variant_mapping.json"
if (-not (Test-Path $mappingFile)) {
    Write-Host "❌ Arquivo de mapeamento não encontrado: $mappingFile" -ForegroundColor Red
    exit 1
}

$mapping = Get-Content $mappingFile -Raw | ConvertFrom-Json

# Configurações das lojas (baseado em shopifyStores.ts)
$stores = @{
    "2" = @{
        name = "WIFI MONEY"
        domain = "tpsfragrances.shop"
        myshopifyDomain = "nkgzhm-1d.myshopify.com"
        fallbackUrl = "https://nkgzhm-1d.myshopify.com"
    }
    "3" = @{
        name = "SADERSTORE"
        domain = "tpsperfumeshop.shop"
        myshopifyDomain = "ae888e.myshopify.com"
        fallbackUrl = "https://ae888e.myshopify.com"
    }
}

# Arquivo de saída
$outputFile = "checkout_urls_for_testing.txt"
$output = @()

$output += "🛒 URLs DE CHECKOUT DIRETO DA SHOPIFY"
$output += "=" * 60
$output += "Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += ""

$totalProducts = 0
$totalCheckoutUrls = 0

foreach ($productHandle in $mapping.PSObject.Properties.Name) {
    $product = $mapping.$productHandle
    $totalProducts++
    
    $output += "📦 PRODUTO: $productHandle"
    $output += "   Título: $($product.title)"
    $output += ""
    
    foreach ($storeId in $product.PSObject.Properties.Name) {
        if ($storeId -eq "title") { continue }
        
        $storeData = $product.$storeId
        $store = $stores[$storeId]
        
        if (-not $store) {
            Write-Host "⚠️ Loja $storeId não encontrada nas configurações" -ForegroundColor Yellow
            continue
        }
        
        $output += "   🏪 LOJA: $($store.name) (ID: $storeId)"
        $output += "      Product ID: $($storeData.product_id)"
        
        # URLs de checkout direto usando variant IDs
        if ($storeData.variant_ids -and $storeData.variant_ids.Count -gt 0) {
            $output += "      📋 CHECKOUT URLs (Cart API):"
            
            foreach ($variantId in $storeData.variant_ids) {
                # URL de checkout direto via Cart API (método moderno)
                $cartApiUrl = "https://$($store.myshopifyDomain)/cart/$($variantId):1"
                $output += "         • Cart Direct: $cartApiUrl"
                
                # URL de checkout via formulário (método alternativo)
                $formCheckoutUrl = "https://$($store.myshopifyDomain)/cart/add?id=$variantId&quantity=1"
                $output += "         • Form Add: $formCheckoutUrl"
                
                # URL de checkout com domínio personalizado
                if ($store.domain -ne $store.myshopifyDomain) {
                    $customCartUrl = "https://$($store.domain)/cart/$($variantId):1"
                    $output += "         • Custom Domain: $customCartUrl"
                }
                
                $totalCheckoutUrls += 3
            }
            
            # URL para múltiplos variants (primeiro variant como exemplo)
            $primaryVariant = $storeData.primary_variant_id
            if ($primaryVariant) {
                $multiCartUrl = "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1"
                $output += "      🎯 PRIMARY VARIANT CHECKOUT: $multiCartUrl"
                $totalCheckoutUrls++
            }
        }
        
        $output += ""
    }
    
    $output += "-" * 50
    $output += ""
}

# Estatísticas
$output += ""
$output += "📊 ESTATÍSTICAS DE CHECKOUT"
$output += "=" * 40
$output += "Total de produtos: $totalProducts"
$output += "Total de URLs de checkout: $totalCheckoutUrls"
$output += "Lojas ativas: $($stores.Count)"
$output += ""

# Exemplos de uso
$output += "🔧 COMO USAR AS URLs DE CHECKOUT"
$output += "=" * 40
$output += ""
$output += "1. CHECKOUT DIRETO (Cart API):"
$output += "   - Adiciona o produto ao carrinho e redireciona para checkout"
$output += "   - Formato: https://loja.myshopify.com/cart/VARIANT_ID:QUANTIDADE"
$output += "   - Exemplo: https://nkgzhm-1d.myshopify.com/cart/12345:1"
$output += ""
$output += "2. ADICIONAR AO CARRINHO (Form API):"
$output += "   - Adiciona o produto ao carrinho (sem redirecionamento automático)"
$output += "   - Formato: https://loja.myshopify.com/cart/add?id=VARIANT_ID&quantity=QUANTIDADE"
$output += "   - Exemplo: https://nkgzhm-1d.myshopify.com/cart/add?id=12345&quantity=1"
$output += ""
$output += "3. CHECKOUT MÚLTIPLOS PRODUTOS:"
$output += "   - Formato: https://loja.myshopify.com/cart/VARIANT1:QTD1,VARIANT2:QTD2"
$output += "   - Exemplo: https://nkgzhm-1d.myshopify.com/cart/12345:1,67890:2"
$output += ""

# Configurações das lojas
$output += "🏪 CONFIGURAÇÕES DAS LOJAS"
$output += "=" * 40
foreach ($storeId in $stores.Keys) {
    $store = $stores[$storeId]
    $output += ""
    $output += "LOJA $storeId - $($store.name):"
    $output += "  • Shopify Domain: $($store.myshopifyDomain)"
    $output += "  • Custom Domain: $($store.domain)"
    $output += "  • Fallback URL: $($store.fallbackUrl)"
}

$output += ""
$output += "🧪 COMANDOS DE TESTE"
$output += "=" * 40
$output += ""
$output += "# Testar checkout direto (PowerShell):"
$output += 'Start-Process "https://nkgzhm-1d.myshopify.com/cart/VARIANT_ID:1"'
$output += ""
$output += "# Testar com curl:"
$output += 'curl -I "https://nkgzhm-1d.myshopify.com/cart/VARIANT_ID:1"'
$output += ""
$output += "# Verificar se variant existe:"
$output += 'curl "https://nkgzhm-1d.myshopify.com/products/PRODUCT_HANDLE.json"'

# Salvar arquivo
$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✅ URLs de checkout geradas com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivo salvo: $outputFile" -ForegroundColor Cyan
Write-Host "📊 Total de produtos: $totalProducts" -ForegroundColor Yellow
Write-Host "🔗 Total de URLs de checkout: $totalCheckoutUrls" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 EXEMPLOS DE CHECKOUT DIRETO:" -ForegroundColor Magenta

# Mostrar alguns exemplos práticos
$exampleCount = 0
foreach ($productHandle in $mapping.PSObject.Properties.Name) {
    if ($exampleCount -ge 3) { break }
    
    $product = $mapping.$productHandle
    foreach ($storeId in $product.PSObject.Properties.Name) {
        if ($storeId -eq "title") { continue }
        if ($exampleCount -ge 3) { break }
        
        $storeData = $product.$storeId
        $store = $stores[$storeId]
        
        if ($store -and $storeData.primary_variant_id) {
            $exampleUrl = "https://$($store.myshopifyDomain)/cart/$($storeData.primary_variant_id):1"
            Write-Host "  • $($product.title) ($($store.name)): $exampleUrl" -ForegroundColor White
            $exampleCount++
        }
    }
}

Write-Host ""
Write-Host "💡 Dica: Use as URLs 'Cart Direct' para checkout imediato!" -ForegroundColor Green