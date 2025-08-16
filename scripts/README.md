# 🧹 Perfume Scraper Scripts

Sistema completo para scrapear produtos da herenhuis.store e organizá-los para o projeto The Perfume Shop clone.

## 📋 Arquivos

### 🔧 Scripts Principais

- **`run_scraper.py`** - Script principal que executa todo o processo
- **`perfume_scraper.py`** - Scraper para extrair dados dos HTMLs
- **`simple_product_manager.py`** - Sistema simples de gerenciamento JSON

### 📦 Dependências

- **`requirements.txt`** - Dependências Python necessárias

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Executar Scraper Completo

```bash
python run_scraper.py
```

Este script vai:
1. 🔍 Scrapear produtos dos arquivos HTML
2. 📦 Organizar dados em sistema JSON simples
3. 🎨 Gerar dados otimizados para frontend
4. 🛍️ Criar dados para sincronização Shopify
5. 📥 Baixar imagens (opcional)

### 3. Usar Scripts Individuais

#### Scraper Individual
```bash
python perfume_scraper.py
```

#### Gerenciador de Produtos
```bash
python simple_product_manager.py
```

## 📁 Estrutura de Dados

### Produtos (JSON)
```json
{
  "products": [
    {
      "id": "produto-id",
      "handle": "produto-handle",
      "title": "Nome do Produto",
      "brand": "Marca",
      "category": "Categoria",
      "price": {
        "regular": 49.90,
        "sale": 279.90,
        "currency": "GBP",
        "discount_percent": 82.2,
        "on_sale": true
      },
      "images": [
        {
          "filename": "produto_1_hash.jpg",
          "alt": "Descrição da imagem",
          "url": "/images/products/produto_1_hash.jpg",
          "optimized": "/images/products/optimized/produto_1_opt.webp"
        }
      ],
      "variants": [
        {
          "id": "variant_100ml",
          "title": "100ml Bottle",
          "size": "100ml",
          "price": 49.90,
          "available": true,
          "sku": "produto-handle_100ml",
          "stock": 100
        }
      ],
      "tags": ["mens-fragrance", "gift-set"],
      "status": "active",
      "featured": false
    }
  ],
  "metadata": {
    "total": 50,
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

## 🎯 Funcionalidades

### ✅ Scraping
- [x] Extração de dados dos HTMLs
- [x] Limpeza e validação de dados
- [x] Remoção de duplicatas
- [x] Extração de imagens múltiplas
- [x] Parsing automático de preços
- [x] Detecção de marcas e categorias

### ✅ Processamento
- [x] Criação de variantes automáticas
- [x] SEO otimizado
- [x] Slugs amigáveis

### ✅ Organização
- [x] Sistema JSON simples
- [x] Índices por categoria e marca
- [x] Backups automáticos
- [x] Versionamento de dados

### ✅ Exportação
- [x] Dados para frontend (React/Next.js)
- [x] Dados para Shopify API
- [x] Estatísticas e relatórios
- [x] TypeScript types

## 📊 Dados Gerados

### Para Frontend (`frontend/src/data/`)
- `products.json` - Dados otimizados para React
- Inclui apenas campos necessários para UI
- Preços formatados
- Imagens otimizadas

### Para Backend (`data/`)
- `products.json` - Dados completos dos produtos
- `categories.json` - Categorias organizadas
- `brands.json` - Índice de marcas
- `config.json` - Configurações do sistema

### Para Shopify (`data/`)
- `shopify_products.json` - Formato para Shopify API
- Compatível com bulk import
- Metafields para SEO

## 🔧 Configuração

### Diretórios
```
perfumes/
├── data/                 # Dados JSON do sistema
├── scripts/             # Scripts Python
├── frontend/
│   ├── src/data/       # Dados para React
│   └── public/images/  # Imagens públicas
├── public/images/      # Imagens scrapeadas
└── scraped_data/       # Dados brutos do scraping
```

### Personalização

#### Marcas
Edite a lista em `perfume_scraper.py`:
```python
brands = [
    'Chanel', 'Dior', 'Paco Rabanne',
    # Adicione suas marcas aqui
]
```

#### Categorias
Edite o arquivo `data/categories.json` ou modifique `simple_product_manager.py`.

#### Preços
Configure markup e moeda em `data/config.json`.

## 🚨 Importante

1. **Origem dos Dados**: Os produtos são scrapeados da `herenhuis.store`, não da The Perfume Shop
2. **Uso Legal**: Certifique-se de ter permissão para usar os dados
3. **Imagens**: As imagens são baixadas e devem ser otimizadas para web
4. **Sincronização**: Os dados podem ser sincronizados com Shopify via API

## 🔄 Workflow Recomendado

1. Execute `run_scraper.py` para processo completo
2. Verifique dados em `data/products.json`
3. Ajuste categorias/marcas se necessário
4. Teste frontend com dados em `frontend/src/data/`
5. Sincronize com Shopify usando `shopify_products.json`

## 📞 Suporte

Para dúvidas sobre os scripts, consulte o código comentado ou execute com `--help` quando disponível.
