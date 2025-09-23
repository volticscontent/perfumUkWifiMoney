# 📋 **MAPEAMENTO COMPLETO DAS VARIÁVEIS SHOPIFY**

## 🔍 **RESUMO EXECUTIVO**
- **Total de Lojas**: 3 lojas Shopify configuradas
- **Loja Ativa**: Store 2 (WIFI MONEY) - `nkgzhm-1d.myshopify.com`
- **Variáveis Mapeadas**: 25+ variáveis de ambiente
- **Arquivos Analisados**: 15+ arquivos de configuração

---

## 🏪 **CONFIGURAÇÃO DAS LOJAS**

### **Store 1 - EURO PRIDE**
```env
SHOPIFY_STORE_1_DOMAIN=ton-store-1656.myshopify.com
SHOPIFY_STORE_1_ADMIN_TOKEN=shpat_[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_1_API_KEY=[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_1_API_SECRET=[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_1_STOREFRONT_TOKEN=[REDACTED_FOR_SECURITY]
```

### **Store 2 - WIFI MONEY (ATIVA)** ⭐
```env
SHOPIFY_STORE_2_DOMAIN=nkgzhm-1d.myshopify.com
SHOPIFY_STORE_2_ADMIN_TOKEN=shpat_[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_2_API_KEY=[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_2_API_SECRET=[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_2_STOREFRONT_TOKEN=[REDACTED_FOR_SECURITY]

# Variáveis públicas (frontend)
NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN=nkgzhm-1d.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_2_STOREFRONT_TOKEN=[REDACTED_FOR_SECURITY]
NEXT_PUBLIC_STORE_2_FALLBACK_URL=https://nkgzhm-1d.myshopify.com
```

### **Store 3 - SADERSTORE**
```env
SHOPIFY_STORE_3_DOMAIN=ae888e.myshopify.com
SHOPIFY_STORE_3_ADMIN_TOKEN=shpat_[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_3_API_KEY=[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_3_API_SECRET=[REDACTED_FOR_SECURITY]
SHOPIFY_STORE_3_STOREFRONT_TOKEN=[REDACTED_FOR_SECURITY]
```

---

## 🔧 **VARIÁVEIS LEGADAS (COMPATIBILIDADE)**

```env
# Configurações antigas mantidas para compatibilidade
SHOPIFY_STORE_DOMAIN=https://theperfumeshop.store/
SHOPIFY_STOREFRONT_ACCESS_TOKEN=[REDACTED_FOR_SECURITY]

# Configurações para scripts de upload (Admin API) - Store 1 como padrão
SHOPIFY_ADMIN_API_KEY=[REDACTED_FOR_SECURITY]
SHOPIFY_ADMIN_PASSWORD=shpat_[REDACTED_FOR_SECURITY]
SHOPIFY_API_VERSION=2023-10
```

---

## 📁 **MAPEAMENTO POR ARQUIVO**

### **1. Arquivo de Configuração Principal**
- **Arquivo**: `.env`
- **Variáveis**: 25 variáveis Shopify
- **Função**: Configuração central de todas as lojas

### **2. Configuração TypeScript**
- **Arquivo**: `lib/shopifyStores.ts`
- **Função**: Interface TypeScript para configuração das lojas
- **Exports**:
  - `SHOPIFY_STORES` - Objeto com configuração das lojas
  - `getStore2Config()` - Função para obter config da loja 2
  - `getStore3Config()` - Função para obter config da loja 3

### **3. APIs e Checkout**
- **Arquivo**: `pages/api/create-checkout.ts`
  - `SHOPIFY_STORE_2_DOMAIN`
  - `SHOPIFY_STORE_2_STOREFRONT_TOKEN`

- **Arquivo**: `lib/clientCheckout.ts`
  - Usa `getStore2Config()` para obter configuração

- **Arquivo**: `lib/simpleCheckout.ts`
  - `SHOPIFY_STORE_2_STOREFRONT_TOKEN`

### **4. Scripts de Automação**
- **fetch-store2-products.js**: `SHOPIFY_STORE_2_ADMIN_TOKEN`
- **fetch-all-store2-products.js**: `SHOPIFY_STORE_2_ADMIN_TOKEN`
- **test-store2-api.js**: Todas as variáveis da Store 2
- **test-store2-checkout.js**: `SHOPIFY_STORE_2_STOREFRONT_TOKEN`

### **5. Testes e Validação**
- **Arquivo**: `pages/api/test-env.ts`
- **Função**: Endpoint para verificar se variáveis estão definidas
- **Variáveis testadas**:
  - `SHOPIFY_DOMAIN`
  - `SHOPIFY_STOREFRONT_TOKEN`
  - `SHOPIFY_ADMIN_TOKEN`
  - `NEXT_PUBLIC_SHOPIFY_DOMAIN`
  - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`

---

## 🎯 **VARIÁVEIS POR CATEGORIA**

### **🔐 Tokens de Autenticação**
```
Admin Tokens (Backend):
- SHOPIFY_STORE_1_ADMIN_TOKEN
- SHOPIFY_STORE_2_ADMIN_TOKEN
- SHOPIFY_STORE_3_ADMIN_TOKEN

Storefront Tokens (Frontend):
- SHOPIFY_STORE_1_STOREFRONT_TOKEN
- SHOPIFY_STORE_2_STOREFRONT_TOKEN
- SHOPIFY_STORE_3_STOREFRONT_TOKEN
- NEXT_PUBLIC_SHOPIFY_STORE_2_STOREFRONT_TOKEN
```

### **🌐 Domínios e URLs**
```
Domínios MyShopify:
- SHOPIFY_STORE_1_DOMAIN (ton-store-1656.myshopify.com)
- SHOPIFY_STORE_2_DOMAIN (nkgzhm-1d.myshopify.com)
- SHOPIFY_STORE_3_DOMAIN (ae888e.myshopify.com)
- NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN

URLs de Fallback:
- NEXT_PUBLIC_STORE_2_FALLBACK_URL
```

### **🔑 Chaves de API**
```
API Keys:
- SHOPIFY_STORE_1_API_KEY
- SHOPIFY_STORE_2_API_KEY
- SHOPIFY_STORE_3_API_KEY

API Secrets:
- SHOPIFY_STORE_1_API_SECRET
- SHOPIFY_STORE_2_API_SECRET
- SHOPIFY_STORE_3_API_SECRET
```

### **⚙️ Configurações Gerais**
```
- SHOPIFY_API_VERSION (2023-10)
- SHOPIFY_ADMIN_API_KEY (legado)
- SHOPIFY_ADMIN_PASSWORD (legado)
```

---

## 🔄 **SISTEMA UTM MULTI-CHECKOUT**

O projeto implementa um sistema UTM que permite roteamento automático entre lojas:

```
Formato: utm_campaign=id[LOJA],[CAMPANHA]

Exemplos:
- utm_campaign=id1,promo-verao → Store 1 (EURO PRIDE)
- utm_campaign=id2,black-friday → Store 2 (WIFI MONEY)
- utm_campaign=id3,natal-2024 → Store 3 (SADERSTORE)
```

---

## 📊 **MAPEAMENTO DE PRODUTOS**

### **Estrutura shopify_mapping**
Cada produto possui um objeto `shopify_mapping` com configurações por loja:

```json
{
  "shopify_mapping": {
    "2": {
      "product_id": "9999999999999",
      "variant_id": "51141198741816",
      "handle": "produto-exemplo",
      "price": "29.99",
      "compare_at_price": "39.99"
    }
  }
}
```

### **Arquivos de Mapeamento**
- `data/unified_products_en_gbp.json` - Produtos unificados
- `data/shopify_variant_mapping.json` - Mapeamento de variantes
- `data/shopify_variant_mapping_complete.json` - Mapeamento completo

---

## 🛠️ **FERRAMENTAS E SCRIPTS**

### **Scripts de Sincronização**
- `fetch-store2-products.js` - Busca produtos da Store 2
- `fetch-all-store2-products.js` - Busca todos os produtos
- `update-mapping-to-store2.js` - Migra mapeamento para Store 2

### **Scripts de Teste**
- `test-store2-checkout.js` - Testa checkout da Store 2
- `test-domain-consistency.js` - Verifica consistência de domínios
- `test-all-checkout-urls.js` - Testa todas as URLs de checkout

### **Scripts de Correção**
- `fix-checkout-urls.js` - Corrige URLs de checkout
- `validate-all-checkout-urls.js` - Valida URLs

---

## ⚠️ **OBSERVAÇÕES IMPORTANTES**

### **Segurança**
- ✅ Tokens sensíveis estão no `.env` (não commitado)
- ✅ Variáveis públicas usam prefixo `NEXT_PUBLIC_`
- ✅ Tokens Admin não são expostos no frontend
- ✅ Documentação usa placeholders para tokens sensíveis

### **Configuração Atual**
- 🎯 **Loja Ativa**: Store 2 (WIFI MONEY)
- 🔄 **Sistema**: Multi-loja com roteamento UTM
- 📱 **Frontend**: Usa apenas variáveis públicas da Store 2

### **Compatibilidade**
- 🔧 Mantém variáveis legadas para compatibilidade
- 🔄 Sistema de fallback para Store 2 como padrão
- 📊 Mapeamento flexível de produtos por loja

---

## 📈 **ESTATÍSTICAS**

```
Total de Variáveis Shopify: 25+
Lojas Configuradas: 3
Loja Ativa: Store 2 (WIFI MONEY)
Arquivos com Variáveis: 15+
Scripts de Automação: 10+
APIs Configuradas: 3
```

---

**Relatório gerado em**: $(Get-Date)
**Versão**: 1.0
**Status**: ✅ Todas as variáveis mapeadas e funcionais
**Segurança**: ✅ Tokens sensíveis protegidos