# 🔑 Como Criar Tokens da Storefront API - Guia Prático

## ⚠️ PROBLEMA IDENTIFICADO

Os tokens Storefront atuais no arquivo `.env` são tokens Admin (prefixo `shpat_`), não tokens Storefront válidos. Isso causa erros 401 nas requisições para a Storefront API.

**Tokens Admin vs Storefront:**
- **Admin Token** (`shpat_`): Para operações administrativas (backend)
- **Storefront Token** (`shpca_` ou similar): Para acessar produtos/carrinho (frontend)

## 🔐 PERMISSÕES NECESSÁRIAS

Para criar tokens Storefront via Admin API, o token Admin precisa ter as seguintes permissões:
- `unauthenticated_read_product_listings` 
- `unauthenticated_write_checkouts`
- `unauthenticated_read_checkouts`

**Erro comum:** `Access denied for storefrontAccessTokenCreate field` indica que o token Admin não tem permissões suficientes.

## 🎯 **O que você precisa fazer**

Criar **3 tokens da Storefront API** (um para cada loja) seguindo estes passos:

---

## 📋 **PASSO A PASSO PARA CADA LOJA**

### 🏪 **LOJA 1: EURO PRIDE**

1. **Abra o link**: https://ton-store-1656.myshopify.com/admin/settings/apps
2. **Clique em**: `Develop apps for your store`
3. **Clique em**: `Create an app`
4. **Nome do app**: `Headless Storefront EURO PRIDE`
5. **Clique em**: `Create app`

#### 🔧 **Configurar Permissões**:
6. **Clique na aba**: `Configuration`
7. **Na seção "Storefront API"**, clique em: `Configure`
8. **Marque estas permissões**:
   - ✅ `Read product listings`
   - ✅ `Read inventory of products and their variants`
   - ✅ `Read product tags`
   - ✅ `Read collection listings`
   - ✅ `Create and modify checkouts`
   - ✅ `Read checkouts`

9. **Clique em**: `Save`

#### 🚀 **Instalar e Obter Token**:
10. **Clique em**: `Install app`
11. **Confirme**: `Install`
12. **Copie o token** que aparece (algo como: `a1b2c3d4e5f6g7h8...`)

---

### 🏪 **LOJA 2: WIFI MONEY**

1. **Abra o link**: https://nkgzhm-1d.myshopify.com/admin/settings/apps
2. **Repita os passos 2-12** acima
3. **Nome do app**: `Headless Storefront WIFI MONEY`

---

### 🏪 **LOJA 3: SADERSTORE**

1. **Abra o link**: https://ae888e.myshopify.com/admin/settings/apps
2. **Repita os passos 2-12** acima  
3. **Nome do app**: `Headless Storefront SADERSTORE`

---

## 📝 **ATUALIZAR O ARQUIVO .env**

Depois de obter os 3 tokens, substitua estas linhas no seu `.env`:

```env
# ANTES (tokens Admin incorretos):
SHOPIFY_STORE_1_STOREFRONT_TOKEN=shpat_[ADMIN_TOKEN_EXEMPLO]
SHOPIFY_STORE_2_STOREFRONT_TOKEN=shpat_[ADMIN_TOKEN_EXEMPLO]
SHOPIFY_STORE_3_STOREFRONT_TOKEN=shpat_[ADMIN_TOKEN_EXEMPLO]

# DEPOIS (tokens Storefront corretos):
SHOPIFY_STORE_1_STOREFRONT_TOKEN=SEU_TOKEN_EURO_PRIDE_AQUI
SHOPIFY_STORE_2_STOREFRONT_TOKEN=SEU_TOKEN_WIFI_MONEY_AQUI
SHOPIFY_STORE_3_STOREFRONT_TOKEN=SEU_TOKEN_SADERSTORE_AQUI
```

---

## ✅ **COMO SABER SE DEU CERTO**

### 🔍 **Formato Correto dos Tokens**:

❌ **Token Admin (ERRADO)**:
```
shpat_[EXEMPLO_TOKEN_ADMIN]
```

✅ **Token Storefront (CORRETO)**:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### 🧪 **Testar se Funcionou**:

Após atualizar o `.env`, reinicie o servidor:
```bash
npm run dev
```

E teste o checkout. O erro 401 deve desaparecer!

---

## 🆘 **SE DER PROBLEMA**

### ❓ **Não encontro "Develop apps"**:
- Vá em: `Settings` → `Apps and sales channels` → `Develop apps`

### ❓ **Não vejo as permissões da Storefront API**:
- Certifique-se de clicar na aba `Configuration`
- Procure por "Storefront API access scopes"

### ❓ **Token não funciona**:
- Verifique se copiou o token completo
- Certifique-se de que não tem espaços extras
- Reinicie o servidor após alterar o `.env`

---

## 📞 **PRECISA DE AJUDA?**

Se algum passo não funcionar, me mande:
1. Screenshot da tela onde travou
2. Mensagem de erro (se houver)
3. Qual loja está tentando configurar

Vou te ajudar a resolver! 🚀