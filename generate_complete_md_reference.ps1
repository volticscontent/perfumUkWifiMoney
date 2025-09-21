# Script para gerar referência completa em Markdown
# Gera arquivo com todos os produtos e suas URLs de checkout

Write-Host "🚀 Gerando referência completa em Markdown..." -ForegroundColor Green

# Carregar dados dos produtos
$products = Get-Content "data/shopify_variant_mapping.json" | ConvertFrom-Json
$productNames = $products.PSObject.Properties.Name | Sort-Object

# Configurações das lojas
$stores = @{
    "2" = @{
        "name" = "WIFI MONEY"
        "shopify_domain" = "nkgzhm-1d.myshopify.com"
        "custom_domain" = "tpsfragrances.shop"
    }
    "3" = @{
        "name" = "SADERSTORE"
        "shopify_domain" = "ae888e.myshopify.com"
        "custom_domain" = "tpsperfumeshop.shop"
    }
}

# Início do arquivo Markdown
$markdown = @"
# 🛒 Referência Completa: Checkout URLs e Slugs dos Produtos

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Lojas Configuradas](#lojas-configuradas)
- [Todos os Produtos](#todos-os-produtos)
- [Tipos de URLs](#tipos-de-urls)
- [Comandos de Teste](#comandos-de-teste)

---

## 🎯 Visão Geral

Este documento apresenta uma referência visual completa entre os **slugs das páginas** dos produtos e suas respectivas **URLs de checkout** nas lojas Shopify configuradas.

### 📊 Estatísticas
- **Total de Produtos**: $($productNames.Count)
- **Lojas Ativas**: 2 (WIFI MONEY e SADERSTORE)
- **URLs de Checkout por Produto**: 6 (3 tipos × 2 lojas)
- **Total de URLs Documentadas**: $($productNames.Count * 6)

---

## 🏪 Lojas Configuradas

### 🟢 WIFI MONEY (Store ID: 2)
- **Shopify Domain**: ``nkgzhm-1d.myshopify.com``
- **Custom Domain**: ``tpsfragrances.shop``
- **Status**: ✅ Ativa

### 🔵 SADERSTORE (Store ID: 3)
- **Shopify Domain**: ``ae888e.myshopify.com``
- **Custom Domain**: ``tpsperfumeshop.shop``
- **Status**: ✅ Ativa

---

## 🛍️ Todos os Produtos

"@

# Processar cada produto
$count = 0
foreach ($productSlug in $productNames) {
    $count++
    $product = $products.$productSlug
    
    $markdown += @"

### 📦 Produto $count`: ``$productSlug``
**Página do Produto**: ``/products/$productSlug``

| Loja | Variant ID | Checkout Direto | Add to Cart | Custom Domain |
|------|------------|-----------------|-------------|---------------|
"@

    # Processar cada loja para este produto
    foreach ($storeId in @("2", "3")) {
        if ($product.$storeId) {
            $storeInfo = $stores[$storeId]
            $variantId = $product.$storeId.primary_variant_id
            $shopifyDomain = $storeInfo.shopify_domain
            $customDomain = $storeInfo.custom_domain
            
            $checkoutUrl = "https://$shopifyDomain/cart/$variantId`:1"
            $addToCartUrl = "https://$shopifyDomain/cart/add?id=$variantId&quantity=1"
            $customUrl = "https://$customDomain/cart/$variantId`:1"
            
            $markdown += @"
| **$($storeInfo.name)** | ``$variantId`` | [🛒 Checkout]($checkoutUrl) | [➕ Add]($addToCartUrl) | [🌐 Custom]($customUrl) |
"@
        }
    }
    
    $markdown += @"

---
"@
}

# Adicionar seções finais
$markdown += @"

## 🔧 Tipos de URLs de Checkout

### 1. 🎯 **Checkout Direto** (Recomendado)
``````
https://{store}.myshopify.com/cart/{variant_id}:1
``````
- ✅ Mais rápido
- ✅ Menos cliques
- ✅ Melhor conversão

### 2. ➕ **Add to Cart**
``````
https://{store}.myshopify.com/cart/add?id={variant_id}&quantity=1
``````
- ✅ Permite customização de quantidade
- ✅ Compatível com JavaScript
- ⚠️ Requer redirecionamento adicional

### 3. 🌐 **Custom Domain**
``````
https://{custom_domain}/cart/{variant_id}:1
``````
- ✅ Branding consistente
- ✅ Melhor para SEO
- ✅ Experiência unificada

---

## 🧪 Comandos de Teste

### PowerShell (Teste Rápido)
``````powershell
# Testar URL específica
Invoke-WebRequest -Uri "https://ae888e.myshopify.com/cart/51243680956703:1" -Method HEAD

# Testar múltiplas URLs de um arquivo
Get-Content "checkout_urls_for_testing.txt" | Select-String "Cart Direct" | ForEach-Object { 
    `$url = (`$_ -split ": ")[1]
    Write-Host "Testando: `$url"
    try { 
        Invoke-WebRequest -Uri `$url -Method HEAD -TimeoutSec 5 
        Write-Host "✅ OK" -ForegroundColor Green
    } catch { 
        Write-Host "❌ Erro: `$_" -ForegroundColor Red
    }
}
``````

### cURL (Teste Individual)
``````bash
# Testar checkout direto
curl -I "https://ae888e.myshopify.com/cart/51243680956703:1"

# Testar add to cart
curl -I "https://ae888e.myshopify.com/cart/add?id=51243680956703&quantity=1"
``````

---

## 🎨 Legenda Visual

| Ícone | Significado |
|-------|-------------|
| 🛒 | Checkout Direto |
| ➕ | Add to Cart |
| 🌐 | Custom Domain |
| 📦 | Produto |
| 🟢 | WIFI MONEY |
| 🔵 | SADERSTORE |
| ✅ | Funcional |
| ⚠️ | Atenção |

---

## 📁 Arquivos Relacionados

- ``checkout_urls_for_testing.txt`` - URLs básicas (352 URLs)
- ``advanced_checkout_urls.txt`` - URLs avançadas (1,344 URLs)  
- ``bulk_checkout_urls.txt`` - URLs em massa (3,108 URLs)
- ``checkout_urls.csv`` - Formato CSV para análise
- ``data/shopify_variant_mapping.json`` - Mapeamento de produtos

---

*Documento gerado automaticamente em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
*Total de produtos documentados: $($productNames.Count)*
*Total de URLs de checkout: $($productNames.Count * 6)*
"@

# Salvar arquivo
$outputFile = "complete_checkout_reference.md"
$markdown | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✅ Arquivo gerado com sucesso: $outputFile" -ForegroundColor Green
Write-Host "📊 Produtos processados: $($productNames.Count)" -ForegroundColor Cyan
Write-Host "🔗 URLs documentadas: $($productNames.Count * 6)" -ForegroundColor Cyan
Write-Host "📄 Tamanho do arquivo: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan

# Mostrar primeiras linhas como preview
Write-Host "`n📖 Preview do arquivo gerado:" -ForegroundColor Yellow
Get-Content $outputFile | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
Write-Host "..." -ForegroundColor Gray
Write-Host "`n🎯 Arquivo completo salvo em: $outputFile" -ForegroundColor Green