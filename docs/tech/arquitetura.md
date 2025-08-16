# 🏗️ Arquitetura Técnica

## 📋 Visão Geral

Arquitetura modular focada em performance, escalabilidade e facilidade de manutenção, otimizada para deploy na Vercel.

## 🎯 Princípios de Design

### Performance First
- Static Site Generation (SSG) sempre que possível
- Incremental Static Regeneration (ISR) para produtos
- Edge functions para lógica simples
- Otimização automática de imagens

### Modularidade
- Separação clara entre frontend e backend
- Componentes reutilizáveis
- Hooks customizados para lógica de negócio
- Tipos TypeScript compartilhados

### Escalabilidade
- API stateless
- Cache em múltiplas camadas
- CDN para assets estáticos
- Database indexing otimizado

## 🌐 Frontend Architecture (Felipe + AI)

### Framework: Next.js 14
```
frontend/
├── app/                    # App Router (Next.js 14)
│   ├── products/          # Páginas de produtos
│   ├── cart/              # Carrinho
│   └── checkout/          # Finalização (Shopify)
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── product/          # Componentes de produto
│   └── layout/           # Header, Footer, Navigation
├── hooks/                # Custom hooks
├── lib/                  # Utilitários
└── public/               # Assets estáticos
```

### Estratégia de Renderização
- **SSG**: Páginas estáticas (home, about, policies)
- **ISR**: Catálogo de produtos (revalidação a cada hora)
- **SSR**: Carrinho e checkout (dados dinâmicos do usuário)
- **CSR**: Componentes interativos (filtros, busca)

### State Management
```typescript
// Zustand para estado global simples
interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

// React Query para cache de API
const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
```

## 🔧 Backend Architecture (Gustavo + AI)

### Framework: Node.js + Express
```
backend/
├── src/
│   ├── routes/           # Rotas da API
│   │   ├── products.js   # CRUD de produtos
│   │   ├── cart.js       # Carrinho
│   │   └── shopify.js    # Webhooks Shopify
│   ├── models/           # Schemas MongoDB
│   ├── services/         # Integrações externas
│   │   ├── shopify.js    # Cliente Shopify
│   │   └── analytics.js  # Tracking
│   └── config/           # Configurações
└── scripts/              # Scripts utilitários
```

### API Design
```typescript
// RESTful API com versionamento
GET    /api/v1/products           # Lista produtos
GET    /api/v1/products/:id       # Produto específico
POST   /api/v1/cart/add           # Adicionar ao carrinho
PUT    /api/v1/cart/update        # Atualizar carrinho
DELETE /api/v1/cart/clear         # Limpar carrinho

// Webhooks
POST   /webhooks/shopify/product  # Sync de produtos
POST   /webhooks/shopify/order    # Sync de pedidos
```

### Database Schema (MongoDB)
```javascript
// Produto
{
  _id: ObjectId,
  shopifyId: String,
  title: String,
  description: String,
  price: Number,
  images: [String],
  variants: [{
    id: String,
    title: String,
    price: Number,
    inventory: Number
  }],
  category: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}

// Carrinho (sessão)
{
  _id: ObjectId,
  sessionId: String,
  items: [{
    productId: ObjectId,
    variantId: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  expiresAt: Date
}
```

## 🔄 Integração Shopify

### Sincronização de Produtos
```javascript
// Webhook para sincronização automática
app.post('/webhooks/shopify/product', async (req, res) => {
  const product = req.body
  await Product.findOneAndUpdate(
    { shopifyId: product.id },
    { ...transformProduct(product) },
    { upsert: true }
  )
})

// Sincronização manual (backup)
const syncProducts = async () => {
  const products = await shopify.product.list()
  for (const product of products) {
    await Product.findOneAndUpdate(
      { shopifyId: product.id },
      { ...transformProduct(product) },
      { upsert: true }
    )
  }
}
```

## 📊 Analytics Architecture

### Event Tracking
```typescript
// Estrutura de eventos
interface AnalyticsEvent {
  event: string
  page_path: string
  user_id?: string
  session_id: string
  timestamp: number
  properties: Record<string, any>
}

// Eventos de E-commerce
const trackPurchase = (order: Order) => {
  gtag('event', 'purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: 'BRL',
    items: order.items.map(item => ({
      item_id: item.productId,
      item_name: item.title,
      quantity: item.quantity,
      price: item.price
    }))
  })
}
```

### UTM Tracking
```typescript
// Sistema automático de UTMs
const generateUTM = (source: string, medium: string, campaign: string) => {
  return {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_term: '',
    utm_content: ''
  }
}

// Captura automática de UTMs
const captureUTMs = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const utms = {}
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    .forEach(param => {
      if (urlParams.has(param)) {
        utms[param] = urlParams.get(param)
      }
    })
    
  return utms
}
```

## 🚀 Deployment Strategy

### Vercel (Frontend)
- Automatic deployments do branch `main`
- Preview deployments para PRs
- Edge functions para lógica simples
- Image optimization automática

### Railway/Render (Backend)
- Deploy automático do branch `main`
- Health checks configurados
- Auto-scaling baseado em CPU/memória
- Logs centralizados

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.perfumes.com
NEXT_PUBLIC_GA_ID=GA_TRACKING_ID
NEXT_PUBLIC_META_PIXEL_ID=PIXEL_ID

# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/perfumes
SHOPIFY_STORE_URL=shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=token
JWT_SECRET=secret
REDIS_URL=redis://localhost:6379
```

## 🔒 Security

### API Security
- Rate limiting (express-rate-limit)
- CORS configurado adequadamente
- Helmet.js para headers de segurança
- Input validation com Joi
- JWT para autenticação (se necessário)

### Frontend Security
- CSP headers configurados
- XSS protection
- Sanitização de inputs
- HTTPS obrigatório
- Secure cookies

## 📈 Performance Optimization

### Frontend
- Bundle splitting automático
- Tree shaking
- Image optimization (next/image)
- Font optimization
- Lazy loading de componentes

### Backend
- Cache com Redis
- Database indexing
- Connection pooling
- Compression middleware
- CDN para assets

### Monitoring
- Vercel Analytics
- Sentry para error tracking
- Performance metrics
- User experience tracking
