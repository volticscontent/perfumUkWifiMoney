# 🛣️ Arquitetura de Rotas - Backend ↔ Frontend

## 🌐 Frontend Routes (Next.js)

### Páginas Principais
```typescript
// app/page.tsx - Homepage
app/
├── page.tsx                        # Homepage (/)
├── products/
│   ├── page.tsx                    # Lista de produtos (/products)
│   ├── [category]/
│   │   └── page.tsx                # Categoria (/products/perfumes-masculinos)
│   └── [slug]/
│       └── page.tsx                # Produto individual (/products/moschino-mini-collection)
├── cart/
│   └── page.tsx                    # Carrinho (/cart)
├── search/
│   └── page.tsx                    # Busca (/search?q=moschino)
└── checkout/
    └── page.tsx                    # Redirect para Shopify Checkout
```

### API Routes (Proxy para Backend)
```typescript
// app/api/ - Proxy routes para o backend
app/api/
├── products/
│   ├── route.ts                    # GET /api/products
│   ├── [id]/route.ts               # GET /api/products/[id]
│   ├── category/[slug]/route.ts    # GET /api/products/category/[slug]
│   └── search/route.ts             # GET /api/products/search
├── cart/
│   ├── route.ts                    # GET, POST /api/cart
│   ├── add/route.ts                # POST /api/cart/add
│   ├── update/route.ts             # PUT /api/cart/update
│   └── remove/route.ts             # DELETE /api/cart/remove
├── checkout/
│   └── route.ts                    # POST /api/checkout (cria checkout no Shopify)
└── analytics/
    └── route.ts                    # POST /api/analytics (eventos)
```

## 🔧 Backend API Routes (Express)

### Estrutura da API
```typescript
// Backend Express Routes
backend/src/routes/
├── products.js                     # Produtos
├── cart.js                         # Carrinho (sessão)
├── checkout.js                     # Checkout Shopify
├── categories.js                   # Categorias
├── search.js                       # Busca
├── analytics.js                    # Analytics
└── webhooks.js                     # Webhooks Shopify
```

### Endpoints Detalhados

#### 1. **Produtos** (`/api/v1/products`)
```typescript
// GET /api/v1/products - Lista produtos
interface ProductsQuery {
  page?: number           // Paginação
  limit?: number          // Itens por página
  category?: string       // Filtro por categoria
  brand?: string          // Filtro por marca
  minPrice?: number       // Preço mínimo
  maxPrice?: number       // Preço máximo
  sort?: 'price' | 'name' | 'newest' | 'popularity'
}

// GET /api/v1/products/:id - Produto específico
// GET /api/v1/products/category/:slug - Produtos por categoria
// GET /api/v1/products/search - Busca produtos
```

#### 2. **Carrinho** (`/api/v1/cart`)
```typescript
// GET /api/v1/cart/:sessionId - Buscar carrinho
// POST /api/v1/cart/add - Adicionar item
interface AddToCartRequest {
  sessionId: string
  productId: string
  variantId?: string
  quantity: number
}

// PUT /api/v1/cart/update - Atualizar quantidade
// DELETE /api/v1/cart/remove - Remover item
// DELETE /api/v1/cart/clear - Limpar carrinho
```

#### 3. **Checkout** (`/api/v1/checkout`)
```typescript
// POST /api/v1/checkout/create - Criar checkout via Storefront API
interface CheckoutRequest {
  sessionId: string       // Para buscar itens do carrinho
  customerEmail?: string  // Email opcional
  utmData?: UTMData      // Dados de campanha
  shippingAddress?: ShippingAddress
}

interface CheckoutResponse {
  checkoutId: string      // ID do checkout (GraphQL ID)
  webUrl: string         // URL do Shopify Checkout
  totalPrice: {
    amount: string
    currencyCode: string
  }
  availableShippingRates?: ShippingRate[]
}

// POST /api/v1/checkout/update - Atualizar checkout
// POST /api/v1/checkout/shipping - Aplicar método de entrega  
// POST /api/v1/checkout/complete - Processar pagamento
```

## 🔄 Fluxo de Dados Frontend → Backend

### 1. **Listagem de Produtos**
```typescript
// Frontend: app/products/page.tsx
const ProductsPage = async ({ searchParams }) => {
  // SSG/ISR - busca direta do backend
  const products = await fetch(`${API_URL}/api/v1/products?${params}`)
  
  return <ProductGrid products={products} />
}

// Backend: routes/products.js
router.get('/', async (req, res) => {
  const { page = 1, limit = 12, category, sort } = req.query
  
  // Cache check
  const cacheKey = `products:${JSON.stringify(req.query)}`
  let products = await redis.get(cacheKey)
  
  if (!products) {
    products = await Product.find(buildQuery(req.query))
      .sort(buildSort(sort))
      .limit(limit * 1)
      .skip((page - 1) * limit)
    
    await redis.setex(cacheKey, 300, JSON.stringify(products)) // 5min cache
  }
  
  res.json(products)
})
```

### 2. **Adicionar ao Carrinho**
```typescript
// Frontend: components/AddToCartButton.tsx
const AddToCartButton = ({ product }) => {
  const addToCart = async () => {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        productId: product.id,
        quantity: 1
      })
    })
    
    if (response.ok) {
      // Atualizar estado do carrinho
      // Trigger analytics
      trackAddToCart(product)
    }
  }
  
  return <button onClick={addToCart}>Adicionar ao Carrinho</button>
}

// Frontend API Route: app/api/cart/add/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  
  // Proxy para backend
  const response = await fetch(`${BACKEND_URL}/api/v1/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  return Response.json(await response.json())
}

// Backend: routes/cart.js
router.post('/add', async (req, res) => {
  const { sessionId, productId, quantity } = req.body
  
  try {
    // Find product
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    // Find or create basket
    let cart = await Cart.findOne({ sessionId })
    if (!cart) {
      cart = new Cart({ sessionId, items: [] })
    }
    
    // Add/update item
    const existingItem = cart.items.find(item => item.productId.toString() === productId)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        title: product.title,
        image: product.images[0]
      })
    }
    
    // Recalculate total (including VAT)
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    cart.vat = cart.subtotal * 0.20
    cart.total = cart.subtotal + cart.vat
    
    await cart.save()
    
    res.json(cart)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

### 3. **Checkout (Redirect para Shopify)**
```typescript
// Frontend: app/checkout/page.tsx
const CheckoutPage = () => {
  useEffect(() => {
    const createCheckout = async () => {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          utmData: getStoredUTMs()
        })
      })
      
      const { checkoutUrl } = await response.json()
      
      // Redirect para Shopify
      window.location.href = checkoutUrl
    }
    
    createCheckout()
  }, [])
  
  return <div>Redirecionando para checkout...</div>
}

// Backend: routes/checkout.js  
router.post('/create', async (req, res) => {
  const { sessionId, customerEmail, utmData, shippingAddress } = req.body
  
  try {
    // Find basket
    const cart = await Cart.findOne({ sessionId })
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Basket is empty' })
    }
    
    // Create checkout via Storefront API (GraphQL)
    const lineItems = cart.items.map(item => ({
      variantId: item.shopifyVariantId, // Must be Shopify variant ID
      quantity: item.quantity
    }))
    
    const checkoutInput = {
      lineItems,
      email: customerEmail,
      allowPartialAddresses: true,
      customAttributes: [
        { key: 'utm_source', value: utmData?.utm_source || '' },
        { key: 'utm_medium', value: utmData?.utm_medium || '' },
        { key: 'utm_campaign', value: utmData?.utm_campaign || '' }
      ]
    }
    
    if (shippingAddress) {
      checkoutInput.shippingAddress = {
        address1: shippingAddress.address1,
        city: shippingAddress.city,
        country: 'United Kingdom',
        countryCode: 'GB',
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        zip: shippingAddress.postcode
      }
    }
    
    const checkout = await createShopifyCheckout(checkoutInput)
    
    // Keep basket for potential return
    await Cart.updateOne(
      { sessionId }, 
      { checkoutId: checkout.id, status: 'checkout_created' }
    )
    
    res.json({
      checkoutId: checkout.id,
      webUrl: checkout.webUrl,
      totalPrice: checkout.totalPrice,
      availableShippingRates: checkout.availableShippingRates
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Shopify Storefront API integration
const createShopifyCheckout = async (input) => {
  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
          totalPrice {
            amount
            currencyCode
          }
          availableShippingRates {
            ready
            shippingRates {
              handle
              title
              price {
                amount
                currencyCode
              }
            }
          }
        }
        checkoutUserErrors {
          field
          message
        }
      }
    }
  `
  
  const response = await fetch(process.env.SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({
      query: mutation,
      variables: { input }
    })
  })
  
  const { data } = await response.json()
  
  if (data.checkoutCreate.checkoutUserErrors.length > 0) {
    throw new Error(data.checkoutCreate.checkoutUserErrors[0].message)
  }
  
  return data.checkoutCreate.checkout
}
```

## 🔍 Busca e Filtros

### Frontend Implementation
```typescript
// app/search/page.tsx
const SearchPage = ({ searchParams }) => {
  const { q, category, brand, minPrice, maxPrice } = searchParams
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchProducts = async () => {
      const params = new URLSearchParams({
        q: q || '',
        category: category || '',
        brand: brand || '',
        minPrice: minPrice || '',
        maxPrice: maxPrice || ''
      })
      
      const response = await fetch(`/api/products/search?${params}`)
      const data = await response.json()
      
      setProducts(data)
      setLoading(false)
      
      // Analytics
      trackSearch(q, data.length)
    }
    
    fetchProducts()
  }, [searchParams])
  
  return (
    <div>
      <SearchFilters />
      <ProductGrid products={products} loading={loading} />
    </div>
  )
}
```

### Backend Search Implementation
```typescript
// Backend: routes/search.js
router.get('/', async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, page = 1, limit = 12 } = req.query
  
  try {
    // Construir query de busca
    let query = {}
    
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }
    
    if (category) query.category = category
    if (brand) query.brand = brand
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseFloat(minPrice)
      if (maxPrice) query.price.$lte = parseFloat(maxPrice)
    }
    
    // Cache key
    const cacheKey = `search:${JSON.stringify(query)}:${page}:${limit}`
    let result = await redis.get(cacheKey)
    
    if (!result) {
      const [products, total] = await Promise.all([
        Product.find(query)
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .sort({ popularity: -1 }),
        Product.countDocuments(query)
      ])
      
      result = { products, total, page, totalPages: Math.ceil(total / limit) }
      await redis.setex(cacheKey, 300, JSON.stringify(result))
    } else {
      result = JSON.parse(result)
    }
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

## 📊 Analytics Integration

### Event Tracking Routes
```typescript
// Frontend: app/api/analytics/route.ts
export async function POST(request: Request) {
  const events = await request.json()
  
  // Enviar para backend para processamento
  await fetch(`${BACKEND_URL}/api/v1/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(events)
  })
  
  return Response.json({ success: true })
}

// Backend: routes/analytics.js
router.post('/events', async (req, res) => {
  const events = req.body
  
  try {
    // Processar eventos em batch
    const processedEvents = events.map(event => ({
      ...event,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }))
    
    // Salvar no banco para relatórios
    await Analytics.insertMany(processedEvents)
    
    // Enviar para GA4 via Measurement Protocol
    await sendToGA4(processedEvents)
    
    // Enviar para Meta via Conversions API
    await sendToMeta(processedEvents)
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

## 🚀 Performance Optimizations

### Caching Strategy
```typescript
// Backend cache layers
const cacheStrategy = {
  products: '5m',        // Lista de produtos: 5 minutos
  product: '1h',         // Produto individual: 1 hora
  categories: '1h',      // Categorias: 1 hora
  search: '5m',          // Resultados de busca: 5 minutos
  cart: '30m'            // Carrinho: 30 minutos
}

// Frontend caching (Next.js)
// ISR para páginas de produto
export const revalidate = 3600 // 1 hora

// SWR para dados dinâmicos
const { data, error } = useSWR(`/api/cart/${sessionId}`, fetcher, {
  refreshInterval: 30000, // Atualizar carrinho a cada 30s
  revalidateOnFocus: true
})
```

Esta arquitetura garante:
- **Performance**: Cache em múltiplas camadas
- **Escalabilidade**: Separação clara de responsabilidades  
- **Flexibilidade**: Shopify para checkout, controle total do catálogo
- **Analytics**: Tracking completo do funil de conversão
- **UX**: Navegação fluida sem redirects desnecessários
