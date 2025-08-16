# 🌟 Perfumes E-commerce Clone

Clone moderno com foco em performance, analytics e experiência do usuário.

## 👥 Equipe

- **Gustavo** - Full Stack Senior (Backend/Frontend Admin)
- **Felipe** - Especialista UI/UX Frontend & Vendas

## 🎯 Objetivo

Clonar o design e funcionalidade da The Perfume Shop:
- [Coleção](https://www.theperfumeshop.com/products/travel-sizes/miniature-gift-sets/c/TS30002)
- [Página de Produto](https://www.theperfumeshop.com/moschino/moschino-mini-collection/miniature-gift-set/p/12528EDPXS)
- [Carrinho](https://www.theperfumeshop.com/cart)

## 📁 Estrutura do Projeto

```
perfumes/
├── docs/                    # Documentação do projeto
├── frontend/                # Next.js Frontend (Felipe + Gustavo)
├── backend/                 # API Backend (Gustavo)
├── shared/                  # Tipos e utilitários compartilhados
├── deployment/              # Scripts e configs de deploy
└── analytics/               # Configurações de tracking
```

## 🚀 Links Rápidos

- [🤖 Contexto do AI](./docs/ai-context.md)
- [🧹 Scripts de Scraping](./scripts/README.md)
- [🛣️ Arquitetura de Rotas](./docs/api/rotas-arquitetura.md)
- [🏗️ Arquitetura Técnica](./docs/tech/arquitetura.md)
- [🛠️ Tecnologias Auxiliares](./docs/tech/tecnologias-auxiliares.md)
- [📊 Analytics & Tracking](./docs/analytics/setup.md)
- [💳 Shopify Payments Integration](./docs/shopify/shopify-payments-integration.md)
- [📱 Mobile-First Design](./docs/mobile/mobile-first-design.md)
- [🔍 Googlebot na Vercel](./docs/seo/googlebot-vercel-access.md)
- [🕵️ Esconder Conteúdo do Googlebot](./docs/seo/esconder-conteudo-googlebot.md)
- [🇬🇧 British Copy Guidelines](./docs/uk/british-copy-guidelines.md)
- [⚖️ UK Commerce Requirements](./docs/uk/uk-commerce-requirements.md)

## ⚡ Início Rápido

### Para Desenvolvimento
1. Clone o repositório
2. Execute `npm install` na raiz
3. Configure as variáveis de ambiente (ver `.env.example`)
4. Execute `npm run dev` para desenvolvimento

### Para Scraping de Produtos
1. Vá para `scripts/`
2. Execute `pip install -r requirements.txt`
3. Execute `python run_scraper.py`
4. Siga as instruções no [README dos Scripts](./scripts/README.md)

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, JSON (sistema simples)
- **Deploy**: Vercel (Frontend) + Railway/Render (Backend)
- **Analytics**: Google Analytics 4, GTM, Meta Pixel
