# 🤖 O que o Googlebot Acessa na Vercel

## 🎯 Visão Geral

O Googlebot é o crawler do Google que indexa seu site. Na Vercel com Next.js, ele tem acesso específico dependendo da estratégia de renderização.

## ✅ O que o Googlebot CONSEGUE Acessar

### 1. HTML Renderizado Final
```html
<!-- ✅ VISÍVEL para o Googlebot -->
<html>
<head>
  <title>Moschino Mini Collection | Perfumes UK</title>
  <meta name="description" content="Discover luxury fragrances...">
  <meta property="og:title" content="...">
</head>
<body>
  <h1>Moschino Mini Collection</h1>
  <div class="product-grid">
    <div class="product-card">
      <img src="/images/product.jpg" alt="Moschino fragrance">
      <h2>Product Title</h2>
      <p>£29.99</p>
    </div>
  </div>
</body>
</html>
```

### 2. Conteúdo Server-Side Rendered (SSR)
```typescript
// ✅ VISÍVEL - getServerSideProps
export async function getServerSideProps() {
  const products = await fetch('https://api.perfumesuk.co.uk/products')
  
  return {
    props: {
      products: await products.json()
    }
  }
}

// O HTML final enviado ao Googlebot já contém todos os produtos
```

### 3. Conteúdo Static Generated (SSG)
```typescript
// ✅ VISÍVEL - getStaticProps
export async function getStaticProps() {
  const product = await fetchProduct(params.slug)
  
  return {
    props: {
      product,
      // Estes dados estarão no HTML inicial
      title: product.title,
      price: product.price,
      description: product.description
    },
    revalidate: 3600 // ISR - regenera a cada hora
  }
}
```

### 4. JavaScript Executado (Client-Side)
```javascript
// ✅ VISÍVEL - Googlebot executa JavaScript
useEffect(() => {
  // Conteúdo adicionado após load também é indexado
  setProductReviews(fetchReviews())
}, [])

// ⚠️ MAS com delay - pode não ser indexado imediatamente
```

### 5. Meta Tags Dinâmicas
```typescript
// ✅ VISÍVEL - Next.js Head
import Head from 'next/head'

const ProductPage = ({ product }) => (
  <>
    <Head>
      <title>{product.title} | Perfumes UK</title>
      <meta name="description" content={product.description} />
      <meta property="og:price:amount" content={product.price} />
      <meta property="og:availability" content="instock" />
      <link rel="canonical" href={`https://perfumesuk.co.uk/products/${product.slug}`} />
    </Head>
    {/* Conteúdo da página */}
  </>
)
```

### 6. Structured Data (JSON-LD)
```typescript
// ✅ VISÍVEL - Schema.org markup
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.title,
  "description": product.description,
  "price": product.price,
  "priceCurrency": "GBP",
  "availability": "https://schema.org/InStock",
  "brand": {
    "@type": "Brand",
    "name": product.brand
  },
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "GBP",
    "availability": "https://schema.org/InStock"
  }
}

// Incluído no <script type="application/ld+json">
```

## ❌ O que o Googlebot NÃO CONSEGUE Acessar

### 1. Variáveis de Ambiente Server-Side
```typescript
// ❌ INVISÍVEL - Environment variables
const API_SECRET = process.env.SHOPIFY_ADMIN_TOKEN // Secreto
const DATABASE_URL = process.env.MONGODB_URI // Secreto
const JWT_SECRET = process.env.JWT_SECRET // Secreto

// ✅ VISÍVEL APENAS - Public env vars no client
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL // Visível no browser
```

### ⚠️ CASO ESPECIAL: HTML/Scripts em Environment Variables

#### Server-Side .env (❌ INVISÍVEL)
```typescript
// .env.local (server-side)
HIDDEN_TRACKING_SCRIPT='<script>gtag("config", "GA_MEASUREMENT_ID", { send_page_view: false });</script>'
SECRET_HTML='<div class="hidden-content">Secret admin panel</div>'
INTERNAL_META_TAG='<meta name="internal-id" content="admin-12345">'

// Uso no servidor
export async function getServerSideProps() {
  const hiddenScript = process.env.HIDDEN_TRACKING_SCRIPT
  
  return {
    props: {
      // ❌ Googlebot NÃO vê a variável original
      // ✅ MAS vê o HTML renderizado se você injetar
      scriptContent: hiddenScript
    }
  }
}

// No componente
const Page = ({ scriptContent }) => {
  return (
    <div>
      <h1>Página Pública</h1>
      {/* ✅ GOOGLEBOT VÊ - HTML foi injetado no render */}
      <div dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </div>
  )
}
```

#### Client-Side NEXT_PUBLIC_ (✅ VISÍVEL)
```typescript
// .env.local
NEXT_PUBLIC_TRACKING_HTML='<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>'
NEXT_PUBLIC_BANNER_HTML='<div class="promo-banner">Special Offer!</div>'

// ⚠️ ATENÇÃO: Qualquer NEXT_PUBLIC_ é VISÍVEL no browser
// Googlebot pode ver tanto a variável quanto o HTML renderizado

const Component = () => {
  const trackingHTML = process.env.NEXT_PUBLIC_TRACKING_HTML
  
  return (
    <div>
      {/* ✅ GOOGLEBOT VÊ TUDO */}
      <div dangerouslySetInnerHTML={{ __html: trackingHTML }} />
    </div>
  )
}
```

### 2. Código Backend/Server
```typescript
// ❌ INVISÍVEL - API routes
// /api/products/[id].ts
export default async function handler(req, res) {
  const { id } = req.query
  
  // Esta lógica é INVISÍVEL para o Googlebot
  const product = await database.products.findById(id)
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }
  
  // Apenas a resposta JSON seria visível se acessada diretamente
  res.json(product)
}
```

### 3. Dados de Sessão/Cookies Server-Side
```typescript
// ❌ INVISÍVEL - Session data
const getServerSideProps = async ({ req }) => {
  const session = getSession(req) // Dados de sessão invisíveis
  const userCart = await getUserCart(session.userId) // Dados privados
  
  // Googlebot não tem sessão, então não vê dados personalizados
}
```

### 4. Calls de API Privadas
```typescript
// ❌ INVISÍVEL - API calls no client que requerem auth
useEffect(() => {
  // Esta chamada falha para o Googlebot (sem auth)
  fetch('/api/user/favorites', {
    headers: {
      'Authorization': `Bearer ${userToken}` // Googlebot não tem token
    }
  })
}, [])
```

### 5. Conteúdo Conditional do Usuario
```typescript
// ❌ PARCIALMENTE INVISÍVEL - User-specific content
const ProductPage = () => {
  const { user } = useAuth() // Googlebot não está logado
  
  return (
    <div>
      <h1>Product Title</h1>
      {user ? (
        <button>Add to Wishlist</button> // ❌ Não visível
      ) : (
        <button>Sign in to add to wishlist</button> // ✅ Visível
      )}
    </div>
  )
}
```

## 🔍 Como o Googlebot Vê Seu Site Next.js

### Processo de Crawling
```mermaid
graph TD
    A[Googlebot Request] --> B{Tipo de Página}
    B -->|SSG/Static| C[HTML Pré-gerado]
    B -->|SSR| D[Renderiza no Servidor]
    B -->|CSR| E[HTML Básico + JS]
    
    C --> F[Conteúdo Imediato]
    D --> F
    E --> G[Executa JavaScript]
    G --> H[Conteúdo Após JS]
    
    F --> I[Indexação Prioritária]
    H --> J[Indexação Secundária]
```

### Estratégias de Renderização

#### 1. Static Site Generation (SSG) - MELHOR para SEO
```typescript
// ✅ IDEAL - Conteúdo imediato para Googlebot
export async function getStaticProps() {
  const products = await fetchProducts()
  
  return {
    props: { products },
    revalidate: 3600 // ISR
  }
}
```

#### 2. Server-Side Rendering (SSR) - BOM para SEO
```typescript
// ✅ BOM - Conteúdo renderizado no servidor
export async function getServerSideProps({ params }) {
  const product = await fetchProduct(params.slug)
  
  return {
    props: { product }
  }
}
```

#### 3. Client-Side Rendering (CSR) - RUIM para SEO
```typescript
// ⚠️ PROBLEMÁTICO - Googlebot precisa executar JS
useEffect(() => {
  fetchProducts().then(setProducts) // Delay na indexação
}, [])
```

## 🛡️ O que Manter Privado

### Environment Variables Seguras
```bash
# ❌ NUNCA expor publicamente
SHOPIFY_ADMIN_TOKEN=shpat_xxxxx
MONGODB_URI=mongodb://user:pass@cluster
JWT_SECRET=ultra-secret-key
STRIPE_SECRET_KEY=sk_live_xxxxx

# ✅ OK para expor (com NEXT_PUBLIC_)
NEXT_PUBLIC_SHOPIFY_DOMAIN=perfumesuk.myshopify.com
NEXT_PUBLIC_API_URL=https://api.perfumesuk.co.uk
```

### API Routes com Autenticação
```typescript
// ❌ Protegido do Googlebot
export default async function handler(req, res) {
  const token = req.headers.authorization
  
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Dados sensíveis protegidos
  const userData = await getUserData(userId)
  res.json(userData)
}
```

## 🎯 Otimizações para Googlebot na Vercel

### 1. robots.txt Otimizado
```txt
# /public/robots.txt
User-agent: *
Allow: /

# Permitir recursos essenciais
Allow: /_next/static/
Allow: /images/

# Bloquear areas privadas
Disallow: /api/admin/
Disallow: /api/user/
Disallow: /checkout/
Disallow: /account/

Sitemap: https://perfumesuk.co.uk/sitemap.xml
```

### 2. Sitemap Dinâmico
```typescript
// pages/sitemap.xml.ts
export async function getServerSideProps({ res }) {
  const products = await fetchAllProducts()
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://perfumesuk.co.uk</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      ${products.map(product => `
        <url>
          <loc>https://perfumesuk.co.uk/products/${product.slug}</loc>
          <lastmod>${product.updatedAt}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `).join('')}
    </urlset>`
  
  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()
  
  return { props: {} }
}
```

### 3. Preload Critical Resources
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
          }
        ]
      }
    ]
  }
}
```

## 📊 Testando o que Googlebot Vê

### 1. Google Search Console
```typescript
// URL Inspection Tool
// Mostra exatamente como Googlebot renderiza sua página
```

### 2. Rich Results Test
```typescript
// Testa structured data
// https://search.google.com/test/rich-results
```

### 3. Mobile-Friendly Test
```typescript
// Testa mobile usability
// https://search.google.com/test/mobile-friendly
```

### 4. PageSpeed Insights
```typescript
// Core Web Vitals que afetam ranking
// https://pagespeed.web.dev/
```

## 🔒 Resumo de Segurança

### ✅ Seguro (Googlebot não acessa)
- Environment variables server-side
- API routes com autenticação
- Código backend/server
- Dados de sessão/cookies
- Database credentials
- API keys privadas

### ⚠️ Cuidado (Googlebot pode acessar)
- NEXT_PUBLIC_ environment variables
- HTML renderizado final
- JavaScript client-side
- URLs públicas da API
- Structured data
- Meta tags

## 💡 Estratégias Práticas: HTML/Scripts em .env

### 1. Analytics Condicionais (Server-Side)
```typescript
// .env.local
PROD_ANALYTICS_SCRIPT='<script async src="https://www.googletagmanager.com/gtag/js?id=G-PROD123"></script>'
DEV_ANALYTICS_SCRIPT='<script>console.log("Dev mode - no tracking")</script>'
INTERNAL_TRACKING='<script>gtag("config", "G-INTERNAL456", { debug_mode: true })</script>'

// pages/_app.tsx
export default function MyApp({ Component, pageProps, analyticsScript }) {
  return (
    <>
      <Head>
        {/* ✅ Googlebot vê apenas o script de produção */}
        <div dangerouslySetInnerHTML={{ __html: analyticsScript }} />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

MyApp.getInitialProps = async () => {
  // ❌ Variável invisível ao Googlebot
  const isProduction = process.env.NODE_ENV === 'production'
  
  // ✅ Mas o HTML resultante é visível
  const analyticsScript = isProduction 
    ? process.env.PROD_ANALYTICS_SCRIPT
    : process.env.DEV_ANALYTICS_SCRIPT
    
  return { analyticsScript }
}
```

### 2. A/B Testing SEO-Safe
```typescript
// .env.local
VARIANT_A_META='<meta name="description" content="Premium fragrances with free UK delivery">'
VARIANT_B_META='<meta name="description" content="Luxury perfumes - fast delivery across UK">'
HIDDEN_EXPERIMENT_ID='<meta name="experiment-id" content="exp-001" style="display:none">'

// Uso estratégico
export async function getServerSideProps({ req }) {
  // ❌ Lógica invisível ao Googlebot
  const variant = req.headers['x-user-segment'] === 'returning' ? 'B' : 'A'
  
  // ✅ Mas Googlebot sempre vê uma versão consistente
  const metaVariant = variant === 'A' 
    ? process.env.VARIANT_A_META 
    : process.env.VARIANT_B_META
    
  return {
    props: { metaVariant }
  }
}
```

### 3. Structured Data Dinâmico
```typescript
// .env.local
PRODUCT_SCHEMA_TEMPLATE='{"@context":"https://schema.org","@type":"Product","name":"{{PRODUCT_NAME}}","price":"{{PRODUCT_PRICE}}","currency":"GBP"}'
ORGANIZATION_SCHEMA='{"@context":"https://schema.org","@type":"Organization","name":"Perfumes UK","url":"https://perfumesuk.co.uk"}'

// Implementação
const ProductPage = ({ product }) => {
  // ❌ Template invisível ao Googlebot
  const schemaTemplate = process.env.PRODUCT_SCHEMA_TEMPLATE
  
  // ✅ Mas JSON-LD final é visível
  const productSchema = schemaTemplate
    .replace('{{PRODUCT_NAME}}', product.name)
    .replace('{{PRODUCT_PRICE}}', product.price)
  
  return (
    <>
      <Head>
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: productSchema }}
        />
      </Head>
      {/* Conteúdo do produto */}
    </>
  )
}
```

### 4. Regional Content (UK-Specific)
```typescript
// .env.local
UK_DELIVERY_BANNER='<div class="uk-banner">Free delivery across the UK on orders over £30</div>'
EU_DELIVERY_BANNER='<div class="eu-banner">International shipping available</div>'
UK_PAYMENT_METHODS='<div class="payment-icons"><img src="/uk-cards.png" alt="UK payment methods"></div>'

// Geolocation-based rendering
export async function getServerSideProps({ req }) {
  // ❌ Lógica de geolocalização invisível
  const country = getCountryFromIP(req.ip)
  
  // ✅ Googlebot vê sempre a versão UK (servidor UK)
  const deliveryBanner = country === 'GB' 
    ? process.env.UK_DELIVERY_BANNER
    : process.env.EU_DELIVERY_BANNER
    
  return {
    props: { deliveryBanner }
  }
}
```

### 5. Emergency Maintenance Banners
```typescript
// .env.local
MAINTENANCE_BANNER='<div class="alert alert-warning">Scheduled maintenance tonight 2-4 AM GMT</div>'
SALE_BANNER='<div class="alert alert-success">Black Friday Sale - Up to 50% off!</div>'
STOCK_ALERT='<div class="alert alert-info">Limited stock - order soon!</div>'

// Controle dinâmico sem afetar SEO
export async function getServerSideProps() {
  const currentTime = new Date()
  const isMaintenanceWindow = isMaintenanceTime(currentTime)
  const isSaleActive = isSaleActive(currentTime)
  
  let banner = ''
  if (isMaintenanceWindow) {
    banner = process.env.MAINTENANCE_BANNER
  } else if (isSaleActive) {
    banner = process.env.SALE_BANNER
  }
  
  return {
    props: { banner }
  }
}
```

## 🚨 Cuidados e Armadilhas

### ❌ NUNCA Coloque Dados Sensíveis
```bash
# ❌ PERIGOSO - Mesmo em server-side .env
ADMIN_LOGIN_FORM='<form><input name="password" value="admin123"></form>'
API_KEYS_HTML='<script>const apiKey = "sk_live_dangerous123"</script>'
USER_DATA_HTML='<div data-user-id="12345" data-email="user@email.com"></div>'

# ✅ SEGURO - Apenas estrutura/templates
FORM_TEMPLATE='<form><input name="{{FIELD_NAME}}" placeholder="{{PLACEHOLDER}}"></form>'
SCRIPT_TEMPLATE='<script>initAnalytics("{{GA_ID}}")</script>'
```

### ⚠️ Cuidado com NEXT_PUBLIC_
```bash
# ❌ VISÍVEL AO GOOGLEBOT E USUÁRIOS
NEXT_PUBLIC_SECRET_HTML='<script>const secret = "visible123"</script>'

# ✅ OK para conteúdo público
NEXT_PUBLIC_FOOTER_HTML='<footer>© 2024 Perfumes UK</footer>'
```

### 🔒 Best Practices de Segurança

#### 1. Sanitização de HTML
```typescript
import DOMPurify from 'isomorphic-dompurify'

const sanitizeEnvHTML = (htmlString: string) => {
  // Remove scripts perigosos
  return DOMPurify.sanitize(htmlString, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'meta', 'script'],
    ALLOWED_ATTR: ['class', 'id', 'data-*', 'type']
  })
}

const safeHTML = sanitizeEnvHTML(process.env.USER_BANNER_HTML)
```

#### 2. Validação de Templates
```typescript
const validateHTMLTemplate = (template: string) => {
  // Verificar se contém apenas placeholders seguros
  const dangerousPatterns = [
    /javascript:/gi,
    /on\w+=/gi,
    /eval\(/gi,
    /<script[^>]*>(?!.*gtag|.*analytics)/gi
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(template))
}
```

#### 3. Environment-Specific Content
```typescript
// Diferentes HTMLs por ambiente
const getEnvironmentHTML = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.PROD_TRACKING_HTML
    case 'development':
      return process.env.DEV_TRACKING_HTML
    case 'preview':
      return process.env.PREVIEW_TRACKING_HTML
    default:
      return ''
  }
}
```

## 📊 Monitoramento de HTML em .env

### Tracking de Performance
```typescript
// .env.local
PERFORMANCE_HTML='<script>performance.mark("env-html-loaded")</script>'

// Uso
const Component = () => {
  useEffect(() => {
    // Monitorar se HTML da .env foi carregado
    performance.measure('env-html-duration', 'env-html-loaded')
  }, [])
  
  return (
    <div dangerouslySetInnerHTML={{ 
      __html: process.env.PERFORMANCE_HTML 
    }} />
  )
}
```

### Debug de Rendering
```typescript
// .env.local (apenas dev)
DEBUG_HTML='<div data-debug="env-content" style="border: 1px dashed red;">Content from .env</div>'

// Uso condicional
const debugHTML = process.env.NODE_ENV === 'development' 
  ? process.env.DEBUG_HTML 
  : ''
```

## 🎯 Resumo Final

### ✅ Googlebot VÊ:
- **HTML renderizado** final de qualquer .env (server ou client)
- **Scripts executados** no client-side 
- **Meta tags** e structured data injetados
- **Conteúdo dinâmico** baseado em .env server-side

### ❌ Googlebot NÃO VÊ:
- **Variáveis .env originais** (server-side)
- **Lógica de escolha** de qual HTML usar
- **Templates** antes da interpolação
- **Condições** que determinam o conteúdo

### 💡 Estratégia Recomendada:
1. **Use .env server-side** para templates e configurações
2. **Renderize no servidor** (SSG/SSR) para SEO
3. **Sanitize sempre** HTML de .env
4. **Monitore** o que Googlebot efetivamente vê
5. **Teste** com Google Search Console

**Lembre-se: O que importa para SEO é o HTML FINAL que o Googlebot recebe, não onde esse HTML foi definido originalmente!** 🎯
