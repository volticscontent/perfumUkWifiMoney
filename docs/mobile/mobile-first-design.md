# 📱 Mobile-First Design Guidelines

## 🎯 Mobile-First Strategy

### Core Principles
- **Design para mobile primeiro**, depois expandir para desktop
- **Touch-friendly** - todos os elementos otimizados para toque
- **Performance crítica** - carregamento instantâneo
- **Thumb navigation** - navegação com polegar
- **Visual hierarchy** - clara hierarquia visual em telas pequenas

### Breakpoints Strategy
```css
/* Mobile-First Breakpoints */
:root {
  /* Mobile (320px - 767px) - DESIGN PRIMÁRIO */
  --mobile-sm: 320px;
  --mobile-md: 375px;  /* iPhone SE, 12 mini */
  --mobile-lg: 414px;  /* iPhone 11 Pro Max */
  
  /* Tablet (768px+) - Secundário */
  --tablet: 768px;
  
  /* Desktop (1024px+) - Opcional/Bonus */
  --desktop: 1024px;
}

/* SEMPRE começar com mobile */
.component {
  /* Styles for mobile 320px+ */
  
  @media (min-width: 768px) {
    /* Tablet adaptations */
  }
  
  @media (min-width: 1024px) {
    /* Desktop adaptations */
  }
}
```

## 📐 Mobile Layout Specifications

### Header Mobile
```css
.mobile-header {
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 1000;
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  
  /* Touch targets */
  button {
    min-height: 44px;
    min-width: 44px;
  }
}

.mobile-logo {
  max-height: 32px;
  width: auto;
}

.mobile-icons {
  display: flex;
  gap: 8px;
  
  .icon {
    width: 24px;
    height: 24px;
    padding: 10px; /* 44px total touch target */
  }
}
```

### Navigation Mobile
```css
.mobile-nav {
  /* Hamburger menu - slide from left */
  position: fixed;
  top: 0;
  left: -100%;
  width: 280px;
  height: 100vh;
  background: white;
  transition: left 0.3s ease;
  z-index: 2000;
  
  &.open {
    left: 0;
  }
}

.mobile-nav-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  
  /* Touch target */
  min-height: 56px;
  display: flex;
  align-items: center;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1500;
}
```

### Product Grid Mobile
```css
.mobile-product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}

.mobile-product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .product-image {
    aspect-ratio: 1;
    width: 100%;
    object-fit: cover;
  }
  
  .product-info {
    padding: 12px;
    
    .product-title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 4px;
      
      /* Truncate long titles */
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .product-price {
      font-size: 16px;
      font-weight: 700;
      color: #c41e3a;
    }
    
    .product-rrp {
      font-size: 12px;
      text-decoration: line-through;
      color: #666;
      margin-left: 4px;
    }
  }
}
```

## 🛒 Mobile Shopping Experience

### Product Page Mobile
```css
.mobile-product-page {
  .product-gallery {
    /* Full-width carousel */
    width: 100vw;
    margin-left: -16px; /* Compensate container padding */
    
    .product-image {
      width: 100vw;
      height: 100vw;
      object-fit: cover;
    }
    
    .gallery-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ddd;
        
        &.active {
          background: #c41e3a;
        }
      }
    }
  }
  
  .product-details {
    padding: 20px 16px;
    
    .product-title {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    
    .product-price {
      font-size: 24px;
      font-weight: 700;
      color: #c41e3a;
      margin-bottom: 16px;
    }
    
    .product-description {
      font-size: 16px;
      line-height: 1.5;
      color: #333;
      margin-bottom: 24px;
    }
  }
}
```

### Add to Basket Mobile
```css
.mobile-add-to-basket {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  z-index: 100;
  
  .quantity-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 16px;
    
    button {
      width: 44px;
      height: 44px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      font-size: 18px;
      font-weight: 600;
    }
    
    .quantity {
      font-size: 18px;
      font-weight: 600;
      min-width: 40px;
      text-align: center;
    }
  }
  
  .add-button {
    width: 100%;
    height: 48px;
    background: #c41e3a;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}
```

### Mobile Basket
```css
.mobile-basket {
  .basket-header {
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    
    h1 {
      font-size: 20px;
      font-weight: 700;
    }
  }
  
  .basket-items {
    padding: 0;
    
    .basket-item {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      
      .item-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 6px;
      }
      
      .item-details {
        flex: 1;
        
        .item-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.3;
          margin-bottom: 4px;
        }
        
        .item-price {
          font-size: 16px;
          font-weight: 700;
          color: #c41e3a;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          
          button {
            width: 32px;
            height: 32px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            font-size: 14px;
          }
        }
      }
      
      .remove-button {
        width: 24px;
        height: 24px;
        color: #999;
        align-self: flex-start;
      }
    }
  }
  
  .basket-summary {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 20px 16px;
    border-top: 1px solid #e0e0e0;
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      
      &.total {
        font-size: 18px;
        font-weight: 700;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
      }
    }
    
    .checkout-button {
      width: 100%;
      height: 48px;
      background: #c41e3a;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      margin-top: 16px;
    }
  }
}
```

## 🎨 Mobile Visual Design

### Typography Scale (Mobile)
```css
:root {
  /* Mobile typography scale */
  --text-xs: 12px;    /* Small labels, captions */
  --text-sm: 14px;    /* Body text, descriptions */
  --text-base: 16px;  /* Base body text */
  --text-lg: 18px;    /* Subheadings */
  --text-xl: 20px;    /* Section headers */
  --text-2xl: 24px;   /* Page titles */
  --text-3xl: 28px;   /* Hero titles */
  
  /* Line heights for mobile */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;
}
```

### Colour Palette (Mobile Optimized)
```css
:root {
  /* Primary colours */
  --primary: #c41e3a;      /* The Perfume Shop red */
  --primary-dark: #a01729;  /* Darker red for active states */
  --primary-light: #f8e8eb; /* Light red for backgrounds */
  
  /* Greys for mobile */
  --grey-50: #fafafa;       /* Light backgrounds */
  --grey-100: #f5f5f5;     /* Card backgrounds */
  --grey-200: #e5e5e5;     /* Borders */
  --grey-300: #d4d4d4;     /* Dividers */
  --grey-500: #737373;     /* Secondary text */
  --grey-700: #404040;     /* Primary text */
  --grey-900: #171717;     /* Headings */
  
  /* Semantic colours */
  --success: #16a34a;      /* Success states */
  --warning: #ea580c;      /* Warning states */
  --error: #dc2626;        /* Error states */
}
```

### Touch Targets
```css
/* Minimum touch target sizes for mobile */
.touch-target {
  min-height: 44px;  /* Apple's recommended minimum */
  min-width: 44px;
  
  /* Ensure adequate spacing between touch targets */
  margin: 2px;
}

/* Button sizes for mobile */
.btn-small {
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
}

.btn-medium {
  height: 44px;
  padding: 0 16px;
  font-size: 16px;
}

.btn-large {
  height: 52px;
  padding: 0 24px;
  font-size: 18px;
}
```

## ⚡ Mobile Performance

### Image Optimization
```typescript
// Next.js Image component for mobile
const MobileProductImage = ({ product, priority = false }) => {
  return (
    <Image
      src={product.imageUrl}
      alt={product.title}
      width={375}  // Mobile viewport width
      height={375} // Square aspect ratio
      priority={priority}
      sizes="(max-width: 768px) 100vw, 50vw"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      style={{
        objectFit: 'cover',
        borderRadius: '8px'
      }}
    />
  )
}
```

### Lazy Loading Strategy
```typescript
// Mobile-first lazy loading
const useMobileLazyLoading = () => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef()
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' } // Load 50px before visible
    )
    
    if (ref.current) observer.observe(ref.current)
    
    return () => observer.disconnect()
  }, [])
  
  return { ref, isVisible }
}
```

### Mobile Bundle Optimization
```javascript
// Mobile-specific code splitting
const MobileProductGallery = dynamic(
  () => import('../components/MobileProductGallery'),
  { 
    loading: () => <MobileGallerySkeleton />,
    ssr: false // Client-side only for interactivity
  }
)

// Conditional loading for mobile features
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return isMobile
}
```

## 🔍 Mobile Search & Filters

### Mobile Search Interface
```css
.mobile-search {
  position: relative;
  
  .search-input {
    width: 100%;
    height: 44px;
    padding: 0 16px 0 44px;
    border: 1px solid #e0e0e0;
    border-radius: 22px;
    font-size: 16px; /* Prevents zoom on iOS */
    background: #fafafa;
    
    &:focus {
      outline: none;
      border-color: #c41e3a;
      background: white;
    }
  }
  
  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: #666;
  }
}

.mobile-search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  
  .suggestion-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 16px;
    
    &:last-child {
      border-bottom: none;
    }
  }
}
```

### Mobile Filters Drawer
```css
.mobile-filters {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  max-height: 80vh;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 2000;
  
  &.open {
    transform: translateY(0);
  }
  
  .filters-header {
    padding: 20px 16px 16px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      font-size: 18px;
      font-weight: 700;
    }
    
    .close-button {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      color: #666;
    }
  }
  
  .filters-content {
    padding: 0 16px 20px;
    overflow-y: auto;
    max-height: calc(80vh - 120px);
    
    .filter-group {
      margin-bottom: 24px;
      
      .filter-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      
      .filter-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .filter-option {
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          font-size: 14px;
          background: white;
          
          &.active {
            background: #c41e3a;
            color: white;
            border-color: #c41e3a;
          }
        }
      }
    }
  }
  
  .filters-actions {
    padding: 16px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 12px;
    
    .clear-button,
    .apply-button {
      flex: 1;
      height: 44px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
    }
    
    .clear-button {
      background: white;
      border: 1px solid #e0e0e0;
      color: #666;
    }
    
    .apply-button {
      background: #c41e3a;
      border: none;
      color: white;
    }
  }
}
```

## 📊 Mobile Analytics & Tracking

### Mobile-Specific Events
```typescript
// Mobile-specific analytics events
const mobileEvents = {
  swipeGallery: 'mobile_gallery_swipe',
  pullToRefresh: 'mobile_pull_refresh',
  addToHomeScreen: 'mobile_add_to_homescreen',
  touchProduct: 'mobile_product_touch',
  basketSwipe: 'mobile_basket_swipe_action',
  filterDrawerOpen: 'mobile_filters_open',
  searchVoice: 'mobile_voice_search'
}

// Track mobile gestures
const trackMobileGesture = (gesture, element) => {
  gtag('event', gesture, {
    element_type: element,
    device_type: 'mobile',
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight
  })
}
```

### Mobile Performance Tracking
```typescript
// Core Web Vitals for mobile
const trackMobilePerformance = () => {
  // First Contentful Paint
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        gtag('event', 'mobile_fcp', {
          value: Math.round(entry.startTime),
          device_type: 'mobile'
        })
      }
    }
  }).observe({ entryTypes: ['paint'] })
  
  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const lastEntry = list.getEntries().pop()
    gtag('event', 'mobile_lcp', {
      value: Math.round(lastEntry.startTime),
      device_type: 'mobile'
    })
  }).observe({ entryTypes: ['largest-contentful-paint'] })
}
```

## 🚀 Mobile PWA Features

### Add to Home Screen
```javascript
// PWA install prompt for mobile
let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  
  // Show custom install button
  showInstallButton()
})

const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    gtag('event', 'pwa_install_prompt', {
      outcome: outcome,
      device_type: 'mobile'
    })
    
    deferredPrompt = null
  }
}
```

### Offline Support
```javascript
// Service worker for offline shopping
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/products')) {
    event.respondWith(
      caches.open('products-v1').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            // Serve from cache
            return response
          }
          
          // Fetch and cache
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone())
            return fetchResponse
          })
        })
      })
    )
  }
})
```

Este guia garante uma experiência mobile perfeita e otimizada para o mercado britânico! 📱🇬🇧
