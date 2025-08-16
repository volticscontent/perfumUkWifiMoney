# 📊 Setup de Analytics e Tracking

## 🎯 Visão Geral

Sistema completo de tracking para e-commerce com foco em conversões, comportamento do usuário e otimização de campanhas.

## 🔧 Configuração Técnica

### Google Analytics 4 + GTM

#### 1. Setup Inicial (Gustavo)
```javascript
// pages/_app.js ou app/layout.js
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'

export default function App({ Component, pageProps }) {
  return (
    <>
      <GoogleTagManager gtmId="GTM-XXXXXXX" />
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      <Component {...pageProps} />
    </>
  )
}
```

#### 2. Data Layer Structure
```javascript
// lib/analytics.js
export const initDataLayer = () => {
  window.dataLayer = window.dataLayer || []
  
  // User Data
  window.dataLayer.push({
    event: 'page_view',
    user_id: user?.id || null,
    customer_type: user ? 'registered' : 'guest',
    page_location: window.location.href,
    page_title: document.title,
    content_group: 'product_catalog' // ou 'checkout', 'home', etc.
  })
}

// Enhanced Ecommerce Events
export const trackPurchase = (orderData) => {
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: orderData.id,
      value: orderData.total,
      currency: 'BRL',
      items: orderData.items.map(item => ({
        item_id: item.sku,
        item_name: item.title,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_brand: item.brand,
        item_variant: item.variant
      }))
    }
  })
}

export const trackAddToCart = (product, quantity = 1) => {
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'BRL',
      value: product.price * quantity,
      items: [{
        item_id: product.sku,
        item_name: product.title,
        category: product.category,
        quantity: quantity,
        price: product.price,
        item_brand: product.brand,
        item_variant: product.selectedVariant
      }]
    }
  })
}
```

### Meta Pixel

#### 1. Instalação Base (Gustavo)
```javascript
// lib/meta-pixel.js
export const initMetaPixel = (pixelId) => {
  if (typeof window !== 'undefined') {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', pixelId);
    fbq('track', 'PageView');
  }
}

export const trackMetaEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters)
  }
}

// E-commerce Events
export const trackMetaPurchase = (orderData) => {
  trackMetaEvent('Purchase', {
    value: orderData.total,
    currency: 'BRL',
    content_type: 'product',
    content_ids: orderData.items.map(item => item.sku),
    num_items: orderData.items.length
  })
}

export const trackMetaAddToCart = (product, quantity) => {
  trackMetaEvent('AddToCart', {
    value: product.price * quantity,
    currency: 'BRL',
    content_type: 'product',
    content_ids: [product.sku],
    content_name: product.title
  })
}
```

## 🛒 Eventos de E-commerce

### Estrutura de Produtos
```typescript
// types/analytics.ts
interface ProductData {
  sku: string
  title: string
  category: string
  brand: string
  price: number
  variant?: string
  inventory?: number
  image_url?: string
}

interface CartItem extends ProductData {
  quantity: number
  position?: number // posição na lista
}

interface OrderData {
  id: string
  total: number
  shipping: number
  tax: number
  discount?: number
  coupon?: string
  items: CartItem[]
  payment_method: string
}
```

### Eventos Principais

#### 1. View Item (Página de Produto)
```javascript
// components/ProductPage.jsx (Felipe implementa)
import { trackViewItem } from '../lib/analytics'

const ProductPage = ({ product }) => {
  useEffect(() => {
    trackViewItem(product)
  }, [product])
  
  return (
    // JSX do produto
  )
}

// lib/analytics.js (Gustavo implementa)
export const trackViewItem = (product) => {
  // Google Analytics
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: 'BRL',
      value: product.price,
      items: [{
        item_id: product.sku,
        item_name: product.title,
        category: product.category,
        price: product.price,
        item_brand: product.brand
      }]
    }
  })
  
  // Meta Pixel
  trackMetaEvent('ViewContent', {
    content_type: 'product',
    content_ids: [product.sku],
    content_name: product.title,
    value: product.price,
    currency: 'BRL'
  })
}
```

#### 2. Add to Cart
```javascript
// components/AddToCartButton.jsx (Felipe implementa)
const AddToCartButton = ({ product, selectedVariant }) => {
  const handleAddToCart = async () => {
    // Lógica do carrinho...
    
    // Analytics
    trackAddToCart(product, 1)
  }
  
  return (
    <button onClick={handleAddToCart}>
      Adicionar ao Carrinho
    </button>
  )
}
```

#### 3. Begin Checkout
```javascript
// pages/checkout.js (Felipe implementa)
const CheckoutPage = ({ cartItems }) => {
  useEffect(() => {
    trackBeginCheckout(cartItems)
  }, [])
  
  return (
    // JSX do checkout
  )
}

// lib/analytics.js (Gustavo implementa)
export const trackBeginCheckout = (cartItems) => {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'BRL',
      value: total,
      items: cartItems.map(item => ({
        item_id: item.sku,
        item_name: item.title,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_brand: item.brand
      }))
    }
  })
  
  trackMetaEvent('InitiateCheckout', {
    value: total,
    currency: 'BRL',
    content_type: 'product',
    content_ids: cartItems.map(item => item.sku),
    num_items: cartItems.length
  })
}
```

#### 4. Purchase
```javascript
// pages/success.js ou webhook de confirmação (Gustavo implementa)
export const trackPurchase = (orderData) => {
  // Google Analytics Enhanced Ecommerce
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: orderData.id,
      value: orderData.total,
      currency: 'GBP',
      tax: orderData.tax,
      shipping: orderData.shipping,
      coupon: orderData.coupon,
      items: orderData.items.map(item => ({
        item_id: item.sku,
        item_name: item.title,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_brand: item.brand,
        item_variant: item.variant
      }))
    }
  })
  
  // Meta Pixel
  trackMetaEvent('Purchase', {
    value: orderData.total,
    currency: 'GBP',
    content_type: 'product',
    content_ids: orderData.items.map(item => item.sku),
    num_items: orderData.items.length
  })
}
```

## 🔗 Sistema de UTMs

### Captura Automática (Gustavo)
```javascript
// lib/utm-tracker.js
export class UTMTracker {
  constructor() {
    this.utmParams = this.captureUTMs()
    this.persistUTMs()
  }
  
  captureUTMs() {
    const urlParams = new URLSearchParams(window.location.search)
    const utms = {}
    
    const utmKeys = [
      'utm_source',
      'utm_medium', 
      'utm_campaign',
      'utm_term',
      'utm_content'
    ]
    
    utmKeys.forEach(key => {
      const value = urlParams.get(key)
      if (value) {
        utms[key] = value
      }
    })
    
    return utms
  }
  
  persistUTMs() {
    if (Object.keys(this.utmParams).length > 0) {
      // Salvar no localStorage (persistir por 30 dias)
      const utmData = {
        ...this.utmParams,
        timestamp: Date.now(),
        expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 dias
      }
      
      localStorage.setItem('utm_data', JSON.stringify(utmData))
      
      // Adicionar ao data layer
      window.dataLayer.push({
        event: 'utm_capture',
        ...this.utmParams
      })
    }
  }
  
  getStoredUTMs() {
    const stored = localStorage.getItem('utm_data')
    if (stored) {
      const data = JSON.parse(stored)
      if (Date.now() < data.expiry) {
        return data
      } else {
        localStorage.removeItem('utm_data')
      }
    }
    return null
  }
  
  attachUTMsToOrder(orderData) {
    const utms = this.getStoredUTMs()
    if (utms) {
      return {
        ...orderData,
        utm_source: utms.utm_source,
        utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign,
        utm_term: utms.utm_term,
        utm_content: utms.utm_content
      }
    }
    return orderData
  }
}

// Inicializar no _app.js
useEffect(() => {
  const utmTracker = new UTMTracker()
  window.utmTracker = utmTracker
}, [])
```

### URLs de Campanha
```javascript
// Exemplos de URLs com UTMs
const campaignURLs = {
  google_ads: 'https://perfumes.com?utm_source=google&utm_medium=cpc&utm_campaign=perfumes_black_friday&utm_term=perfume+masculino&utm_content=ad_variant_a',
  facebook_ads: 'https://perfumes.com?utm_source=facebook&utm_medium=social&utm_campaign=perfumes_retargeting&utm_content=carousel_ad',
  email_newsletter: 'https://perfumes.com?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_offers&utm_content=header_cta',
  influencer: 'https://perfumes.com?utm_source=instagram&utm_medium=influencer&utm_campaign=micro_influencers&utm_content=stories_swipeup'
}
```

## 📊 Eventos Personalizados

### Comportamento do Usuário (Felipe implementa)
```javascript
// hooks/useScrollTracking.js
export const useScrollTracking = () => {
  useEffect(() => {
    let maxScroll = 0
    
    const handleScroll = throttle(() => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      )
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent
        
        // Tracking milestones
        if ([25, 50, 75, 90].includes(scrollPercent)) {
          window.dataLayer.push({
            event: 'scroll_depth',
            scroll_depth: scrollPercent,
            page_location: window.location.href
          })
        }
      }
    }, 500)
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}

// components/ProductList.jsx
const ProductList = ({ products }) => {
  const trackProductClick = (product, position) => {
    window.dataLayer.push({
      event: 'select_item',
      ecommerce: {
        item_list_name: 'Product List',
        items: [{
          item_id: product.sku,
          item_name: product.title,
          category: product.category,
          price: product.price,
          index: position
        }]
      }
    })
  }
  
  return (
    <div>
      {products.map((product, index) => (
        <ProductCard 
          key={product.id}
          product={product}
          onClick={() => trackProductClick(product, index)}
        />
      ))}
    </div>
  )
}
```

### Filtros e Busca
```javascript
// components/ProductFilters.jsx (Felipe implementa)
const ProductFilters = () => {
  const handleFilterChange = (filterType, value) => {
    // Lógica do filtro...
    
    // Analytics
    window.dataLayer.push({
      event: 'filter_used',
      filter_type: filterType,
      filter_value: value,
      page_location: window.location.href
    })
  }
  
  const handleSearch = (searchTerm) => {
    // Lógica da busca...
    
    // Analytics
    window.dataLayer.push({
      event: 'search',
      search_term: searchTerm,
      page_location: window.location.href
    })
  }
  
  return (
    // JSX dos filtros
  )
}
```

## 🚨 Error Tracking

### Setup Sentry (Gustavo)
```javascript
// sentry.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing({
      beforeNavigate: context => ({
        ...context,
        name: window.location.pathname
      })
    })
  ]
})

// Error tracking personalizado
export const trackError = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: context,
    extra: {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  })
  
  // Também enviar para GA como evento
  window.dataLayer.push({
    event: 'exception',
    description: error.message,
    fatal: false,
    ...context
  })
}
```

## 📈 Relatórios e Dashboards

### KPIs Principais
```javascript
// Métricas de E-commerce
const ecommerceKPIs = {
  conversion_rate: 'Taxa de conversão geral',
  cart_abandonment: 'Taxa de abandono de carrinho',
  average_order_value: 'Ticket médio',
  revenue_per_visitor: 'Receita por visitante',
  product_page_views: 'Visualizações de produto',
  add_to_cart_rate: 'Taxa de adição ao carrinho',
  checkout_completion: 'Taxa de finalização do checkout'
}

// Métricas de Performance
const performanceKPIs = {
  page_load_time: 'Tempo de carregamento',
  bounce_rate: 'Taxa de rejeição',
  session_duration: 'Duração da sessão',
  pages_per_session: 'Páginas por sessão',
  core_web_vitals: 'Core Web Vitals'
}
```

### Custom Dimensions (GTM)
```javascript
// Configurações personalizadas no GTM
const customDimensions = {
  1: 'User Type', // registered, guest
  2: 'Product Category',
  3: 'Traffic Source',
  4: 'Device Type', // mobile, tablet, desktop
  5: 'Payment Method',
  6: 'Coupon Used',
  7: 'First Time Buyer',
  8: 'Cart Value Range'
}
```

## 🔒 Privacy & LGPD

### Cookie Consent (Felipe implementa)
```javascript
// components/CookieConsent.jsx
const CookieConsent = () => {
  const [consent, setConsent] = useState(null)
  
  const handleAcceptAll = () => {
    setConsent('all')
    // Ativar todos os trackings
    initAnalytics()
    localStorage.setItem('cookie_consent', 'all')
  }
  
  const handleRejectAll = () => {
    setConsent('essential')
    // Apenas cookies essenciais
    localStorage.setItem('cookie_consent', 'essential')
  }
  
  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent')
    if (stored) {
      setConsent(stored)
      if (stored === 'all') {
        initAnalytics()
      }
    }
  }, [])
  
  if (consent) return null
  
  return (
    <div className="cookie-banner">
      {/* UI do banner de cookies */}
    </div>
  )
}
```

## 📋 Checklist de Implementação

### Setup Inicial (Gustavo)
- [ ] Google Analytics 4 configurado
- [ ] Google Tag Manager instalado
- [ ] Meta Pixel implementado
- [ ] Data Layer estruturado
- [ ] UTM tracking funcionando
- [ ] Error tracking (Sentry) configurado

### Eventos de E-commerce (Ambos)
- [ ] view_item implementado
- [ ] add_to_cart implementado
- [ ] remove_from_cart implementado
- [ ] begin_checkout implementado
- [ ] purchase implementado
- [ ] view_item_list implementado

### Eventos Personalizados (Felipe)
- [ ] Scroll depth tracking
- [ ] Search tracking
- [ ] Filter usage tracking
- [ ] Click tracking em CTAs
- [ ] Time on page tracking
- [ ] Video/image interaction tracking

### Privacy & Compliance (Ambos)
- [ ] Cookie consent banner
- [ ] LGPD compliance
- [ ] Privacy policy atualizada
- [ ] Opt-out mechanisms
- [ ] Data retention policies

### Testing (Ambos)
- [ ] GTM Preview mode testado
- [ ] GA4 Real-time reports funcionando
- [ ] Meta Pixel Helper validado
- [ ] UTM parameters capturados
- [ ] Cross-device tracking testado
- [ ] Error tracking validado
