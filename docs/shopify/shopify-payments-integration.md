# 💳 Shopify Payments & Checkout Integration

## 🎯 Visão Geral

Nossa loja utiliza **Shopify Payments** como método de pagamento principal e **checkout direto** via Storefront API. Esta documentação cobre a integração completa.

## 🔧 APIs Utilizadas

### 1. Storefront API (GraphQL)
- **Função**: Criar e gerenciar checkouts
- **Autenticação**: Storefront Access Token
- **Uso**: Frontend direto

### 2. Admin API (REST/GraphQL)  
- **Função**: Gerenciar produtos, pedidos, webhooks
- **Autenticação**: Private App Access Token
- **Uso**: Backend

### 3. Payments Apps API
- **Função**: Processar, capturar, reembolsar pagamentos
- **Autenticação**: Admin API Token
- **Uso**: Backend (webhooks)

## 🛒 Fluxo de Checkout Completo

### 1. Criar Checkout (Storefront API)
```typescript
// Frontend: Criar checkout via GraphQL
const CREATE_CHECKOUT = `
  mutation checkoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        webUrl
        totalPrice {
          amount
          currencyCode
        }
        lineItems(first: 10) {
          edges {
            node {
              id
              title
              quantity
              variant {
                id
                title
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
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

// Implementação
const createCheckout = async (cartItems: CartItem[]) => {
  const lineItems = cartItems.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity
  }))
  
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
    },
    body: JSON.stringify({
      query: CREATE_CHECKOUT,
      variables: {
        input: {
          lineItems,
          allowPartialAddresses: true,
          shippingAddress: {
            country: 'GB',
            countryCode: 'GB'
          }
        }
      }
    })
  })
  
  const { data } = await response.json()
  return data.checkoutCreate.checkout
}
```

### 2. Adicionar Informações de Entrega
```typescript
const UPDATE_CHECKOUT_SHIPPING = `
  mutation checkoutShippingAddressUpdate($checkoutId: ID!, $shippingAddress: MailingAddressInput!) {
    checkoutShippingAddressUpdateV2(checkoutId: $checkoutId, shippingAddress: $shippingAddress) {
      checkout {
        id
        shippingAddress {
          address1
          city
          country
          zip
        }
        availableShippingRates {
          ready
          shippingRates {
            handle
            title
            price {
              amount
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

const updateShippingAddress = async (checkoutId: string, address: ShippingAddress) => {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
    },
    body: JSON.stringify({
      query: UPDATE_CHECKOUT_SHIPPING,
      variables: {
        checkoutId,
        shippingAddress: {
          address1: address.address1,
          address2: address.address2,
          city: address.city,
          country: 'United Kingdom',
          countryCode: 'GB',
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          province: address.county,
          zip: address.postcode
        }
      }
    })
  })
  
  return response.json()
}
```

### 3. Aplicar Método de Entrega
```typescript
const UPDATE_CHECKOUT_SHIPPING_LINE = `
  mutation checkoutShippingLineUpdate($checkoutId: ID!, $shippingRateHandle: String!) {
    checkoutShippingLineUpdate(checkoutId: $checkoutId, shippingRateHandle: $shippingRateHandle) {
      checkout {
        id
        totalPrice {
          amount
          currencyCode
        }
        subtotalPrice {
          amount
        }
        totalTax {
          amount
        }
        shippingLine {
          handle
          title
          price {
            amount
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
```

### 4. Processar Pagamento (Shopify Payments)
```typescript
const CHECKOUT_COMPLETE_WITH_TOKENIZED_PAYMENT = `
  mutation checkoutCompleteWithTokenizedPaymentV3($checkoutId: ID!, $payment: TokenizedPaymentInputV3!) {
    checkoutCompleteWithTokenizedPaymentV3(checkoutId: $checkoutId, payment: $payment) {
      checkout {
        id
        ready
        order {
          id
          processedAt
          orderNumber
          totalPrice {
            amount
            currencyCode
          }
        }
      }
      payment {
        id
        ready
        errorMessage
        transaction {
          id
          status
          amount {
            amount
            currencyCode
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

// Integração com Web Payments API (para mobile)
const processPayment = async (checkoutId: string, paymentData: any) => {
  // Para Shopify Payments, usar tokenização
  const tokenizedPayment = {
    paymentAmount: {
      amount: checkoutData.totalPrice.amount,
      currencyCode: 'GBP'
    },
    idempotencyKey: generateIdempotencyKey(),
    billingAddress: {
      address1: paymentData.billingAddress.address1,
      city: paymentData.billingAddress.city,
      country: 'United Kingdom',
      countryCode: 'GB',
      firstName: paymentData.billingAddress.firstName,
      lastName: paymentData.billingAddress.lastName,
      zip: paymentData.billingAddress.postcode
    },
    paymentData: paymentData.token, // Token from Shopify Payments
    type: 'SHOPIFY_PAY' // ou 'CARD'
  }
  
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
    },
    body: JSON.stringify({
      query: CHECKOUT_COMPLETE_WITH_TOKENIZED_PAYMENT,
      variables: {
        checkoutId,
        payment: tokenizedPayment
      }
    })
  })
  
  return response.json()
}
```

## 💳 Métodos de Pagamento Suportados

### 1. Shopify Payments (Principal)
```typescript
const shopifyPaymentMethods = {
  cards: [
    'Visa',
    'Mastercard', 
    'American Express',
    'Maestro',
    'Diners Club'
  ],
  digitalWallets: [
    'Shop Pay',
    'Apple Pay',
    'Google Pay',
    'PayPal Express'
  ],
  localMethods: [
    'Klarna',
    'Clearpay' // UK Afterpay
  ]
}

// Configuração para Reino Unido
const ukPaymentConfig = {
  currency: 'GBP',
  country: 'GB',
  shopPay: {
    enabled: true,
    acceleratedCheckout: true
  },
  applePay: {
    enabled: true,
    merchantId: 'merchant.com.yourstore.uk'
  },
  googlePay: {
    enabled: true,
    merchantId: 'YOUR_GOOGLE_PAY_MERCHANT_ID'
  }
}
```

### 2. Payment Request API (Mobile)
```typescript
// Para experiência mobile otimizada
const createPaymentRequest = (checkout: Checkout) => {
  if (!window.PaymentRequest) {
    return null
  }
  
  const supportedMethods = [
    {
      supportedMethods: 'basic-card',
      data: {
        supportedNetworks: ['visa', 'mastercard', 'amex'],
        supportedTypes: ['debit', 'credit']
      }
    },
    {
      supportedMethods: 'https://apple.com/apple-pay',
      data: {
        version: 3,
        merchantIdentifier: 'merchant.com.yourstore.uk',
        merchantCapabilities: ['supports3DS'],
        supportedNetworks: ['visa', 'mastercard', 'amex'],
        countryCode: 'GB'
      }
    }
  ]
  
  const details = {
    total: {
      label: 'Total',
      amount: {
        currency: 'GBP',
        value: checkout.totalPrice.amount
      }
    },
    displayItems: checkout.lineItems.edges.map(({ node }) => ({
      label: node.title,
      amount: {
        currency: 'GBP',
        value: (parseFloat(node.variant.price.amount) * node.quantity).toFixed(2)
      }
    }))
  }
  
  const options = {
    requestPayerName: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
    requestShipping: true,
    shippingType: 'delivery'
  }
  
  return new PaymentRequest(supportedMethods, details, options)
}
```

## 🔄 Backend Integration

### 1. Webhook Handlers
```typescript
// Backend: Webhook para pedidos pagos
app.post('/webhooks/shopify/orders/paid', async (req, res) => {
  const order = req.body
  
  try {
    // Verificar assinatura do webhook
    const isValid = verifyShopifyWebhook(req)
    if (!isValid) {
      return res.status(401).send('Unauthorized')
    }
    
    // Processar pedido pago
    await processOrder({
      orderId: order.id,
      orderNumber: order.order_number,
      email: order.email,
      totalPrice: order.total_price,
      currency: order.currency,
      lineItems: order.line_items,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      paymentMethod: order.payment_gateway_names[0],
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status
    })
    
    // Enviar confirmação por email
    await sendOrderConfirmation(order)
    
    // Tracking de analytics
    await trackPurchaseAnalytics(order)
    
    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Error processing webhook')
  }
})

// Verificação de webhook
const verifyShopifyWebhook = (req: Request): boolean => {
  const hmac = req.get('X-Shopify-Hmac-Sha256')
  const body = JSON.stringify(req.body)
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('base64')
  
  return crypto.timingSafeEqual(Buffer.from(hmac!), Buffer.from(hash))
}
```

### 2. Admin API Operations
```typescript
// Backend: Buscar produtos via Admin API
const getProductsFromShopify = async () => {
  const response = await fetch(`${SHOPIFY_ADMIN_URL}/products.json`, {
    headers: {
      'X-Shopify-Access-Token': ADMIN_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  })
  
  const { products } = await response.json()
  return products
}

// Sync de produtos
const syncProducts = async () => {
  const shopifyProducts = await getProductsFromShopify()
  
  for (const product of shopifyProducts) {
    await Product.findOneAndUpdate(
      { shopifyId: product.id },
      {
        shopifyId: product.id,
        title: product.title,
        description: product.body_html,
        vendor: product.vendor,
        productType: product.product_type,
        tags: product.tags.split(',').map(tag => tag.trim()),
        images: product.images.map(img => img.src),
        variants: product.variants.map(variant => ({
          shopifyVariantId: variant.id,
          title: variant.title,
          price: parseFloat(variant.price),
          compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          sku: variant.sku,
          inventory: variant.inventory_quantity,
          weight: variant.weight,
          weightUnit: variant.weight_unit
        })),
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      },
      { upsert: true, new: true }
    )
  }
}
```

## 🇬🇧 UK-Specific Configuration

### VAT Handling
```typescript
// VAT é calculado automaticamente pelo Shopify para UK
const ukTaxConfig = {
  // Shopify calcula VAT automaticamente
  includeTaxInPrices: true,
  taxExempt: false,
  
  // Para exibição no frontend
  vatRate: 0.20,
  showVatBreakdown: true,
  
  // Validação de VAT number (se B2B)
  validateVatNumber: async (vatNumber: string) => {
    // Integração com HMRC VAT validation service
    const response = await fetch(`https://api.service.hmrc.gov.uk/organisations/vat/check-vat-number/lookup/${vatNumber}`)
    return response.ok
  }
}
```

### UK Delivery Integration
```typescript
// Configurar métodos de entrega UK
const ukShippingConfig = {
  zones: {
    uk_mainland: {
      name: 'UK Mainland',
      countries: ['GB'],
      excludePostcodes: [], // Scottish Highlands etc
      rates: [
        {
          name: 'Standard Delivery',
          price: 4.95,
          deliveryTime: '3-5 working days',
          freeThreshold: 30.00
        },
        {
          name: 'Next Day Delivery', 
          price: 9.95,
          deliveryTime: 'Next working day',
          cutoffTime: '14:00'
        }
      ]
    },
    uk_highlands: {
      name: 'Scottish Highlands & Islands',
      countries: ['GB'],
      includePostcodes: ['AB36-38', 'AB55-56', 'FK17-21', 'G83', 'HS1-9', 'IV1-56', 'KA27-28', 'KW1-17', 'PA20-49', 'PA60-78', 'PH4-44', 'ZE1-3'],
      additionalCharge: 2.95
    }
  }
}
```

## 📊 Analytics Integration

### Track Shopify Payments
```typescript
// Analytics para diferentes métodos de pagamento
const trackPaymentMethod = (order: Order) => {
  const paymentMethod = order.payment_gateway_names[0]
  
  gtag('event', 'purchase', {
    transaction_id: order.order_number,
    value: parseFloat(order.total_price),
    currency: 'GBP',
    payment_method: paymentMethod,
    items: order.line_items.map(item => ({
      item_id: item.sku,
      item_name: item.name,
      category: item.product_type,
      quantity: item.quantity,
      price: parseFloat(item.price)
    }))
  })
  
  // Meta Pixel
  fbq('track', 'Purchase', {
    value: parseFloat(order.total_price),
    currency: 'GBP',
    payment_method: paymentMethod,
    content_type: 'product',
    content_ids: order.line_items.map(item => item.sku)
  })
}
```

## 🔒 Security Best Practices

### 1. Token Management
```typescript
// Ambiente variables seguras
const shopifyConfig = {
  storefrontToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN, // Público
  adminToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN, // Privado
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET, // Para verificação
  domain: process.env.SHOPIFY_STORE_DOMAIN
}

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de requests por IP
  message: 'Too many requests from this IP'
})
```

### 2. PCI Compliance
```typescript
// Nunca armazenar dados de cartão
// Shopify Payments handle toda a tokenização
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' checkout.shopifycs.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.shopify.com https://*.shopifycs.com;
  `.replace(/\s+/g, ' ').trim()
}
```

Esta integração garante pagamentos seguros e otimizados para o mercado britânico! 💳🇬🇧
