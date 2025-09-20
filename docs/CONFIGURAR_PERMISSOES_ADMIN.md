# 🔐 Configurar Permissões Admin para Tokens Storefront

## ⚠️ PROBLEMA IDENTIFICADO

Os tokens Admin atuais **NÃO têm permissões** para criar tokens Storefront. Faltam 3 permissões específicas em todas as lojas:

- ❌ `unauthenticated_read_product_listings`
- ❌ `unauthenticated_write_checkouts` 
- ❌ `unauthenticated_read_checkouts`

## 🎯 SOLUÇÃO: Configurar Permissões

### Para cada loja, você precisa:

1. **Acessar o Shopify Admin**
2. **Ir para Apps > Develop apps**
3. **Encontrar sua app atual** (que gerou os tokens `shpat_`)
4. **Adicionar as permissões necessárias**
5. **Reinstalar a app**

---

## 📋 PASSO A PASSO DETALHADO

### 🏪 **LOJA 1: EURO PRIDE**
- **Admin URL:** https://ton-store-1656.myshopify.com/admin
- **Token atual:** `shpat_[ADMIN_TOKEN_EURO_PRIDE]`

### 🏪 **LOJA 2: WIFI MONEY**  
- **Admin URL:** https://nkgzhm-1d.myshopify.com/admin
- **Token atual:** `shpat_[ADMIN_TOKEN_WIFI_MONEY]`

### 🏪 **LOJA 3: SADERSTORE**
- **Admin URL:** https://ae888e.myshopify.com/admin  
- **Token atual:** `shpat_[ADMIN_TOKEN_SADERSTORE]`

---

## 🔧 CONFIGURAÇÃO DAS PERMISSÕES

### 1. **Acesse o Admin da loja**
```
https://[DOMAIN]/admin/settings/apps/development
```

### 2. **Encontre sua app** 
- Procure pela app que gerou o token atual
- Clique em "Configure" ou "Edit"

### 3. **Adicione as permissões Storefront**

Na seção **"Storefront API access scopes"**, adicione:

```
✅ unauthenticated_read_product_listings
   - Permite ler produtos sem autenticação
   - Necessário para listar produtos no frontend

✅ unauthenticated_write_checkouts  
   - Permite criar/atualizar carrinho sem autenticação
   - Necessário para funcionalidade de carrinho

✅ unauthenticated_read_checkouts
   - Permite ler dados do checkout sem autenticação  
   - Necessário para recuperar carrinho
```

### 4. **Salvar e reinstalar**
- Clique em "Save" 
- Clique em "Install app" (reinstalar com novas permissões)
- **IMPORTANTE:** O token Admin permanece o mesmo!

---

## ✅ VERIFICAÇÃO

Após configurar as permissões em todas as lojas, execute:

```bash
# Verificar se as permissões foram aplicadas
python scripts/check_admin_permissions.py

# Se tudo estiver OK, criar os tokens Storefront
python scripts/create_storefront_tokens_graphql.py
```

---

## 🚨 TROUBLESHOOTING

### **Problema:** "App não encontrada"
- **Solução:** Crie uma nova app em Apps > Develop apps > Create an app

### **Problema:** "Permissões não aparecem"
- **Solução:** Certifique-se de estar na seção "Storefront API access scopes", não "Admin API access scopes"

### **Problema:** "Token continua sem permissão"
- **Solução:** Reinstale a app após adicionar as permissões

---

## 📊 STATUS ATUAL

| Loja | Domain | Permissões Storefront | Status |
|------|--------|----------------------|--------|
| EURO PRIDE | ton-store-1656.myshopify.com | ❌ Faltam 3 | Pendente |
| WIFI MONEY | nkgzhm-1d.myshopify.com | ❌ Faltam 3 | Pendente |  
| SADERSTORE | ae888e.myshopify.com | ❌ Faltam 3 | Pendente |

---

## 🎯 RESULTADO ESPERADO

Após configurar as permissões, você deve conseguir:

1. ✅ Criar tokens Storefront automaticamente
2. ✅ Atualizar o arquivo `.env` com tokens válidos
3. ✅ Testar o fluxo de carrinho no frontend
4. ✅ Resolver os erros 401 da Storefront API

---

**💡 Dica:** As permissões Storefront são diferentes das permissões Admin. Certifique-se de estar configurando na seção correta!