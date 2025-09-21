# Script Avançado para Gerar URLs de Checkout da Shopify
# Gera múltiplas variações de URLs para testes completos

Write-Host "🚀 Gerando URLs Avançadas de Checkout da Shopify..." -ForegroundColor Green
Write-Host "=" * 70

# Ler o arquivo de mapeamento de produtos
$mappingFile = "data/shopify_variant_mapping.json"
if (-not (Test-Path $mappingFile)) {
    Write-Host "❌ Arquivo de mapeamento não encontrado: $mappingFile" -ForegroundColor Red
    exit 1
}

$mapping = Get-Content $mappingFile -Raw | ConvertFrom-Json

# Configurações das lojas
$stores = @{
    "2" = @{
        name = "WIFI MONEY"
        domain = "tpsfragrances.shop"
        myshopifyDomain = "nkgzhm-1d.myshopify.com"
        fallbackUrl = "https://nkgzhm-1d.myshopify.com"
        storefrontToken = "SHOPIFY_STORE_2_STOREFRONT_TOKEN"
    }
    "3" = @{
        name = "SADERSTORE"
        domain = "tpsperfumeshop.shop"
        myshopifyDomain = "ae888e.myshopify.com"
        fallbackUrl = "https://ae888e.myshopify.com"
        storefrontToken = "SHOPIFY_STORE_3_STOREFRONT_TOKEN"
    }
}

# Arquivo de saída
$outputFile = "advanced_checkout_urls.txt"
$output = @()

$output += "🚀 URLs AVANÇADAS DE CHECKOUT DA SHOPIFY"
$output += "=" * 70
$output += "Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += ""

$totalUrls = 0
$productCount = 0

foreach ($productHandle in $mapping.PSObject.Properties.Name) {
    $product = $mapping.$productHandle
    $productCount++
    
    $output += "🎯 PRODUTO: $productHandle"
    $output += "   Título: $($product.title)"
    $output += ""
    
    foreach ($storeId in $product.PSObject.Properties.Name) {
        if ($storeId -eq "title") { continue }
        
        $storeData = $product.$storeId
        $store = $stores[$storeId]
        
        if (-not $store) { continue }
        
        $output += "   🏪 LOJA: $($store.name) (ID: $storeId)"
        $output += "      Product ID: $($storeData.product_id)"
        $output += "      Handle: $($storeData.handle)"
        
        if ($storeData.variant_ids -and $storeData.variant_ids.Count -gt 0) {
            $primaryVariant = $storeData.primary_variant_id
            
            # 1. URLs de Checkout Direto
            $output += "      🛒 CHECKOUT DIRETO:"
            $cartUrl = "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1"
            $output += "         • Shopify: $cartUrl"
            $totalUrls++
            
            $customCartUrl = "https://$($store.domain)/cart/$($primaryVariant):1"
            $output += "         • Custom: $customCartUrl"
            $totalUrls++
            
            # 2. URLs de Adicionar ao Carrinho
            $output += "      ➕ ADICIONAR AO CARRINHO:"
            $addUrl = "https://$($store.myshopifyDomain)/cart/add?id=$primaryVariant&quantity=1"
            $output += "         • Form Add: $addUrl"
            $totalUrls++
            
            $addCustomUrl = "https://$($store.domain)/cart/add?id=$primaryVariant&quantity=1"
            $output += "         • Custom Add: $addCustomUrl"
            $totalUrls++
            
            # 3. URLs com Diferentes Quantidades
            $output += "      📦 QUANTIDADES VARIADAS:"
            foreach ($qty in @(2, 3, 5)) {
                $qtyUrl = "https://$($store.myshopifyDomain)/cart/$($primaryVariant):$qty"
                $output += "         • Qty $qty`: $qtyUrl"
                $totalUrls++
            }
            
            # 4. URLs de Produto Direto
            $output += "      🔗 PRODUTO DIRETO:"
            $productUrl = "https://$($store.myshopifyDomain)/products/$($storeData.handle)"
            $output += "         • Shopify: $productUrl"
            $totalUrls++
            
            $customProductUrl = "https://$($store.domain)/products/$($storeData.handle)"
            $output += "         • Custom: $customProductUrl"
            $totalUrls++
            
            # 5. URLs de Checkout com Parâmetros UTM
            $output += "      📊 COM UTM TRACKING:"
            $utmParams = "utm_source=test&utm_medium=direct&utm_campaign=checkout_test"
            $utmCartUrl = "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1?$utmParams"
            $output += "         • UTM Cart: $utmCartUrl"
            $totalUrls++
            
            # 6. URLs de API para Testes
            $output += "      🔧 APIs DE TESTE:"
            $apiProductUrl = "https://$($store.myshopifyDomain)/products/$($storeData.handle).json"
            $output += "         • Product API: $apiProductUrl"
            $totalUrls++
            
            $apiCartUrl = "https://$($store.myshopifyDomain)/cart.json"
            $output += "         • Cart API: $apiCartUrl"
            $totalUrls++
            
            # 7. URLs de Checkout com Múltiplos Produtos
            if ($storeData.variant_ids.Count -gt 1) {
                $output += "      🎁 MÚLTIPLOS VARIANTS:"
                $multiVariants = $storeData.variant_ids[0..([Math]::Min(2, $storeData.variant_ids.Count-1))] -join ":1,"
                $multiUrl = "https://$($store.myshopifyDomain)/cart/$multiVariants`:1"
                $output += "         • Multi Cart: $multiUrl"
                $totalUrls++
            }
            
            # 8. URLs de Checkout com Desconto (exemplo)
            $output += "      💰 COM DESCONTO (EXEMPLO):"
            $discountUrl = "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1?discount=TEST10"
            $output += "         • Discount: $discountUrl"
            $totalUrls++
            
            # 9. URLs de Checkout Mobile
            $output += "      📱 MOBILE OPTIMIZED:"
            $mobileUrl = "https://$($store.myshopifyDomain)/cart/$($primaryVariant):1?view=mobile"
            $output += "         • Mobile: $mobileUrl"
            $totalUrls++
            
            # 10. URLs de Checkout com Redirecionamento
            $output += "      🔄 COM REDIRECIONAMENTO:"
            $redirectUrl = "https://$($store.myshopifyDomain)/cart/add?id=$primaryVariant&quantity=1&return_to=/checkout"
            $output += "         • Auto Checkout: $redirectUrl"
            $totalUrls++
        }
        
        $output += ""
    }
    
    $output += "-" * 60
    $output += ""
}

# Seção de URLs Especiais
$output += ""
$output += "🌟 URLs ESPECIAIS E UTILITÁRIAS"
$output += "=" * 50

foreach ($storeId in $stores.Keys) {
    $store = $stores[$storeId]
    $output += ""
    $output += "🏪 $($store.name) (ID: $storeId):"
    
    # URLs administrativas
    $output += "   📋 ADMINISTRATIVAS:"
    $output += "      • Admin: https://$($store.myshopifyDomain)/admin"
    $output += "      • Products: https://$($store.myshopifyDomain)/admin/products"
    $output += "      • Orders: https://$($store.myshopifyDomain)/admin/orders"
    $totalUrls += 3
    
    # URLs de API
    $output += "   🔧 APIs:"
    $output += "      • Shop Info: https://$($store.myshopifyDomain)/api/2023-10/shop.json"
    $output += "      • Products: https://$($store.myshopifyDomain)/products.json"
    $output += "      • Collections: https://$($store.myshopifyDomain)/collections.json"
    $totalUrls += 3
    
    # URLs de teste de conectividade
    $output += "   🌐 CONECTIVIDADE:"
    $output += "      • Health Check: https://$($store.myshopifyDomain)/"
    $output += "      • Custom Domain: https://$($store.domain)/"
    $output += "      • Sitemap: https://$($store.myshopifyDomain)/sitemap.xml"
    $totalUrls += 3
    
    # URLs de carrinho vazio
    $output += "   🛒 CARRINHO:"
    $output += "      • Empty Cart: https://$($store.myshopifyDomain)/cart"
    $output += "      • Clear Cart: https://$($store.myshopifyDomain)/cart/clear"
    $output += "      • Cart JSON: https://$($store.myshopifyDomain)/cart.json"
    $totalUrls += 3
}

# Estatísticas finais
$output += ""
$output += "📊 ESTATÍSTICAS COMPLETAS"
$output += "=" * 40
$output += "Total de produtos analisados: $productCount"
$output += "Total de URLs geradas: $totalUrls"
$output += "Lojas ativas: $($stores.Count)"
$output += "Média de URLs por produto: $([Math]::Round($totalUrls / $productCount, 2))"
$output += ""

# Guia de uso
$output += "📖 GUIA DE USO DAS URLs"
$output += "=" * 40
$output += ""
$output += "🛒 CHECKOUT DIRETO:"
$output += "   - Leva diretamente ao checkout com produto no carrinho"
$output += "   - Ideal para campanhas de marketing direto"
$output += ""
$output += "➕ ADICIONAR AO CARRINHO:"
$output += "   - Adiciona produto sem redirecionar automaticamente"
$output += "   - Permite continuar comprando"
$output += ""
$output += "📦 QUANTIDADES VARIADAS:"
$output += "   - Testa diferentes quantidades automaticamente"
$output += "   - Útil para produtos em kit ou promoções"
$output += ""
$output += "🔗 PRODUTO DIRETO:"
$output += "   - Leva à página do produto"
$output += "   - Permite ver detalhes antes da compra"
$output += ""
$output += "📊 COM UTM TRACKING:"
$output += "   - Inclui parâmetros de rastreamento"
$output += "   - Essencial para análise de campanhas"
$output += ""
$output += "🔧 APIs DE TESTE:"
$output += "   - Endpoints para verificar dados"
$output += "   - Útil para debugging e integração"
$output += ""

# Comandos de teste
$output += "🧪 COMANDOS DE TESTE AVANÇADOS"
$output += "=" * 40
$output += ""
$output += "# Testar checkout em lote (PowerShell):"
$output += '$urls = @('
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
            $url = "https://$($store.myshopifyDomain)/cart/$($storeData.primary_variant_id):1"
            $output += "    `"$url`","
            $exampleCount++
        }
    }
}
$output += ")"
$output += 'foreach ($url in $urls) { Start-Process $url; Start-Sleep 2 }'
$output += ""
$output += "# Testar conectividade (curl):"
$output += 'curl -I "https://nkgzhm-1d.myshopify.com/"'
$output += 'curl -I "https://ae888e.myshopify.com/"'
$output += ""
$output += "# Testar API de produtos:"
$output += 'curl "https://nkgzhm-1d.myshopify.com/products.json" | ConvertFrom-Json'

# Salvar arquivo
$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✅ URLs avançadas geradas com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivo salvo: $outputFile" -ForegroundColor Cyan
Write-Host "📊 Total de produtos: $productCount" -ForegroundColor Yellow
Write-Host "🔗 Total de URLs: $totalUrls" -ForegroundColor Yellow
Write-Host "🎯 Média por produto: $([Math]::Round($totalUrls / $productCount, 2)) URLs" -ForegroundColor Magenta

Write-Host ""
Write-Host "🚀 TIPOS DE URLs GERADAS:" -ForegroundColor Green
Write-Host "   • Checkout Direto" -ForegroundColor White
Write-Host "   • Adicionar ao Carrinho" -ForegroundColor White
Write-Host "   • Quantidades Variadas" -ForegroundColor White
Write-Host "   • Produto Direto" -ForegroundColor White
Write-Host "   • Com UTM Tracking" -ForegroundColor White
Write-Host "   • APIs de Teste" -ForegroundColor White
Write-Host "   • Múltiplos Variants" -ForegroundColor White
Write-Host "   • Com Desconto" -ForegroundColor White
Write-Host "   • Mobile Optimized" -ForegroundColor White
Write-Host "   • Auto Redirecionamento" -ForegroundColor White
Write-Host "   • URLs Administrativas" -ForegroundColor White
Write-Host "   • URLs de Conectividade" -ForegroundColor White