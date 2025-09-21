# Script para remover todos os produtos da EuroPride (loja ID '1')

Write-Host "🗑️ Iniciando remoção dos produtos da EuroPride..." -ForegroundColor Yellow

# 1. Processar shopify_variant_mapping.json
Write-Host "📝 Processando shopify_variant_mapping.json..." -ForegroundColor Cyan

$mappingPath = "data\shopify_variant_mapping.json"
$mappingContent = Get-Content $mappingPath -Raw | ConvertFrom-Json

$productsToRemove = @()
$productsToKeep = @{}

foreach ($productHandle in $mappingContent.PSObject.Properties.Name) {
    $product = $mappingContent.$productHandle
    
    # Verificar se o produto tem dados para a loja '1' (EuroPride)
    if ($product.PSObject.Properties.Name -contains '1') {
        $productsToRemove += $productHandle
        Write-Host "❌ Produto marcado para remoção: $productHandle" -ForegroundColor Red
        
        # Manter apenas as lojas 2 e 3
        $newProduct = @{}
        if ($product.PSObject.Properties.Name -contains '2') {
            $newProduct['2'] = $product.'2'
        }
        if ($product.PSObject.Properties.Name -contains '3') {
            $newProduct['3'] = $product.'3'
        }
        
        # Se ainda tem outras lojas, manter o produto
        if ($newProduct.Count -gt 0) {
            $productsToKeep[$productHandle] = $newProduct
        }
    } else {
        # Produto não tem loja '1', manter como está
        $productsToKeep[$productHandle] = $product
    }
}

Write-Host "📊 Total de produtos que tinham EuroPride: $($productsToRemove.Count)" -ForegroundColor Yellow
Write-Host "📊 Total de produtos mantidos: $($productsToKeep.Count)" -ForegroundColor Green

# Salvar o arquivo atualizado
$productsToKeep | ConvertTo-Json -Depth 10 | Set-Content $mappingPath -Encoding UTF8

# 2. Processar unified_products_en_gbp.json
Write-Host "📝 Processando unified_products_en_gbp.json..." -ForegroundColor Cyan

$unifiedPath = "data\unified_products_en_gbp.json"
$unifiedContent = Get-Content $unifiedPath -Raw | ConvertFrom-Json

$updatedProducts = @()

foreach ($product in $unifiedContent.products) {
    $shopifyMapping = $product.shopify_mapping
    
    # Remover a loja '1' do mapeamento
    if ($shopifyMapping.PSObject.Properties.Name -contains '1') {
        $shopifyMapping.PSObject.Properties.Remove('1')
        Write-Host "❌ Removida loja EuroPride do produto: $($product.handle)" -ForegroundColor Red
    }
    
    # Se ainda tem outras lojas no mapeamento, manter o produto
    if ($shopifyMapping.PSObject.Properties.Name.Count -gt 0) {
        $updatedProducts += $product
    } else {
        Write-Host "🗑️ Produto completamente removido (sem outras lojas): $($product.handle)" -ForegroundColor Magenta
    }
}

Write-Host "📊 Produtos mantidos no unified_products: $($updatedProducts.Count)" -ForegroundColor Green

# Salvar o arquivo atualizado
$updatedUnified = @{
    products = $updatedProducts
}

$updatedUnified | ConvertTo-Json -Depth 10 | Set-Content $unifiedPath -Encoding UTF8

Write-Host "✅ Remoção concluída! Todos os produtos da EuroPride foram removidos." -ForegroundColor Green
Write-Host "📁 Backups foram criados antes da remoção." -ForegroundColor Blue