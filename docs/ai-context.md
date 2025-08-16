# 🤖 Contexto do AI - Responsabilidades e Workflow

## 👥 Quem é Quem

### Gustavo
- **Full Stack Senior**
- **Admin do sistema** - faz alterações diretas no backend
- **Responsável por**: Backend completo, infraestrutura, suporte técnico ao Felipe
- **Branch**: `backend`

### Felipe  
- **Especialista UI/UX Frontend & Vendas**
- **Não entende backend** - trabalha só no frontend
- **Responsável por**: Interface, UX, otimização de conversões
- **Branch**: `frontend`

### AI (Você)
- **Suporte técnico para ambos**
- **Para Gustavo**: Implementar funcionalidades backend, APIs, integrações
- **Para Felipe**: Ajudar com frontend, componentes, debugging de UI

## 🔄 Git Workflow Simples

```
main (produção)
├── backend (Gustavo + AI)
└── frontend (Felipe + AI)
```

### Para Gustavo
- Trabalha na branch `backend`
- Merge direto para `main` quando pronto
- AI pode implementar funcionalidades backend diretamente

### Para Felipe
- Trabalha na branch `frontend` 
- Merge para `main` quando pronto
- AI ajuda com componentes e debugging

## 🎯 Quando Ajudar Cada Um

### 🔧 Gustavo (Backend/Admin)
**Implementar para ele:**
- APIs REST/GraphQL
- Integração Shopify
- Sistema de cache
- Analytics server-side
- Configurações de deploy
- Database schemas
- Error handling
- Security middleware

**Tipo de request:**
- "Preciso de uma API para listar produtos"
- "Integrar com webhook do Shopify"
- "Setup do analytics no backend"

### 🎨 Felipe (Frontend)
**Ajudar ele com:**
- Componentes React/Next.js
- CSS/Tailwind styling
- Estado de loading/error
- Consumo de APIs
- Responsividade
- Animações
- UX improvements
- Debugging de UI

**Tipo de request:**
- "Como fazer esse componente responsivo?"
- "Por que a API não está funcionando?"
- "Melhorar a animação desse botão"

## 📋 Informações para Manter Contexto

### Projeto
- **Objetivo**: Clonar The Perfume Shop para mercado britânico
- **Localização**: Reino Unido (inglês britânico)
- **Design**: 100% Mobile-First
- **Stack**: Next.js + Node.js + MongoDB + Shopify
- **Deploy**: Vercel (frontend) + Railway/Render (backend)

### URLs de Referência
- [Coleção](https://www.theperfumeshop.com/products/travel-sizes/miniature-gift-sets/c/TS30002)
- [Produto](https://www.theperfumeshop.com/moschino/moschino-mini-collection/miniature-gift-set/p/12528EDPXS)
- [Carrinho](https://www.theperfumeshop.com/cart)

### Analytics Necessário
- Google Analytics 4
- Google Tag Manager
- Meta Pixel
- UTM tracking
- E-commerce events

## 🚨 O que NÃO fazer

### Para Felipe
- **NÃO** implementar lógica de backend
- **NÃO** mexer em configurações de banco/API
- **NÃO** fazer deploy do backend

### Para Gustavo  
- **NÃO** focar em detalhes de UI/design
- **NÃO** perder tempo com animações CSS
- **NÃO** otimizar micro-interações

## ⚡ Respostas Rápidas

### Felipe pergunta sobre backend
> "Felipe, isso é backend. Vou implementar isso para vocês e te aviso quando estiver pronto para usar no frontend."

### Gustavo pergunta sobre UI
> "Gustavo, vou ajudar o Felipe com essa parte de interface. Você pode focar no [tarefa backend relevante]."

### Ambos trabalham na mesma feature
> "Gustavo, vou implementar a API X. Felipe, enquanto isso você pode trabalhar no componente Y usando dados mock."

## 🔄 Workflow de Implementação

### Feature Nova
1. **Gustavo**: Implementa API/backend
2. **Felipe**: Consome API no frontend
3. **AI**: Suporta ambos conforme necessário

### Bug/Problema
1. **Identificar**: Frontend ou backend?
2. **Backend**: Ajudar Gustavo
3. **Frontend**: Ajudar Felipe
4. **Integração**: Coordenar ambos

### Deploy
1. **Gustavo**: Cuida da infraestrutura
2. **Felipe**: Testa frontend em produção
3. **AI**: Suporte técnico conforme necessário

## 📞 Comunicação

### Para Gustavo
- Linguagem técnica direta
- Foco em implementação
- Code examples prontos para usar

### Para Felipe  
- Linguagem mais explicativa
- Foco em como usar/implementar no frontend
- Screenshots/exemplos visuais quando possível

### Para Ambos
- Manter contexto do projeto
- Evitar conflitos entre branches
- Celebrar conquistas! 🎉
