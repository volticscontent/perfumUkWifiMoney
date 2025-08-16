# 🇬🇧 UK E-commerce Requirements & Compliance

## 🏛️ Legal Requirements

### Consumer Rights Act 2015
```typescript
// Mandatory information to display
const consumerRights = {
  returns: {
    period: 30, // days
    conditions: "Goods must be in original condition",
    exceptions: "Hygiene products (opened perfumes)"
  },
  
  coolingOff: {
    period: 14, // days for distance selling
    applies: "All online purchases",
    cancellation: "No reason required"
  },
  
  warranties: {
    statutory: "Goods must be as described, fit for purpose, and of satisfactory quality",
    duration: "Up to 6 years (England & Wales), 5 years (Scotland)"
  }
}
```

### Distance Selling Regulations
```typescript
// Required information before purchase
const mandatoryInfo = {
  seller: {
    businessName: "Must display company name",
    address: "Full business address required", 
    contact: "Phone number and email",
    vatNumber: "If VAT registered",
    companyNumber: "Companies House number"
  },
  
  product: {
    description: "Clear, accurate description",
    price: "Including VAT and delivery costs",
    availability: "Stock status and delivery times",
    restrictions: "Age restrictions if applicable"
  },
  
  contract: {
    totalCost: "All costs including delivery",
    paymentMethod: "Accepted payment types",
    deliveryTime: "When goods will arrive",
    returnsPolicy: "How to return items"
  }
}
```

## 💰 VAT & Pricing

### VAT Configuration
```typescript
const vatRates = {
  standard: 0.20,    // 20% - Most products
  reduced: 0.05,     // 5% - Children's car seats, energy-saving materials
  zero: 0.00,        // 0% - Books, food, children's clothing
  exempt: null       // No VAT charged or reclaimable
}

// VAT display requirements
const vatDisplay = {
  b2c: "Prices must include VAT",
  b2b: "Can show prices excluding VAT if clearly marked",
  inclusive: "£29.99 (inc. VAT)",
  exclusive: "£24.99 + VAT (£29.99 inc. VAT)"
}
```

### Pricing Requirements
```typescript
// Price display compliance
const pricingRules = {
  clarity: "Prices must be clear and unambiguous",
  currency: "Display in GBP (£)",
  totalCost: "Show total cost including delivery before checkout",
  comparison: "If showing RRP, must be genuine",
  salePrice: "Show both original and sale price",
  subscription: "Clear about recurring charges"
}

// Example pricing template
const priceTemplate = {
  main: "£29.99",
  vat: "(inc. VAT)",
  rrp: "RRP £39.99",
  saving: "Save £10.00",
  delivery: "+ £4.95 delivery"
}
```

## 🚚 Delivery Requirements

### UK Delivery Standards
```typescript
const deliveryOptions = {
  standard: {
    name: "Standard Delivery",
    cost: "£4.95",
    time: "3-5 working days",
    carrier: "Royal Mail 2nd Class"
  },
  
  express: {
    name: "Next Day Delivery", 
    cost: "£9.95",
    time: "Next working day by 1pm",
    cutoff: "Order by 2pm",
    carrier: "Royal Mail Special Delivery"
  },
  
  free: {
    name: "Free Delivery",
    threshold: "Orders over £30",
    time: "3-5 working days",
    areas: "UK mainland only"
  },
  
  clickAndCollect: {
    name: "Click & Collect",
    cost: "FREE", 
    time: "Ready within 2 hours",
    locations: "Selected stores"
  }
}
```

### Delivery Zones
```typescript
const ukDeliveryZones = {
  mainland: {
    name: "UK Mainland",
    includes: "England, Wales, Southern Scotland",
    standardDelivery: true,
    nextDay: true,
    cost: "Standard rates apply"
  },
  
  highlands: {
    name: "Scottish Highlands & Islands",
    postcodes: ["AB36-38", "AB55-56", "FK17-21", "G83", "HS1-9", "IV1-56", "KA27-28", "KW1-17", "PA20-49", "PA60-78", "PH4-44", "ZE1-3"],
    additionalCost: "£2.95",
    nextDay: false,
    time: "5-7 working days"
  },
  
  northernIreland: {
    name: "Northern Ireland", 
    postcodes: ["BT"],
    standardDelivery: true,
    nextDay: false,
    time: "5-7 working days"
  },
  
  notDelivered: {
    name: "Not Currently Delivered",
    areas: ["Channel Islands", "Isle of Man", "BFPO addresses"],
    reason: "Customs and logistics complexity"
  }
}
```

## 📄 Terms & Conditions Template

### Essential Clauses
```markdown
## Terms and Conditions

### 1. About Us
We are [Company Name], a company registered in England and Wales (Company Number: [Number]) with our registered office at [Address].

VAT Number: [VAT Number]
Email: [Email]
Phone: [Phone]

### 2. Product Information
- All product descriptions are accurate at time of publication
- Colours may vary due to monitor settings
- We reserve the right to correct errors
- All fragrances are genuine and sourced from authorised distributors

### 3. Pricing and Payment
- All prices include VAT at the current rate
- Prices are subject to change without notice
- Payment is taken when your order is dispatched
- We accept [payment methods]

### 4. Delivery
- Standard delivery: 3-5 working days (£4.95)
- Next day delivery: Order by 2pm (£9.95)
- Free delivery on orders over £30 (UK mainland)
- Risk passes to you upon delivery

### 5. Returns and Cancellations
- 30-day return policy for unopened items
- 14-day cooling-off period for distance sales
- Return shipping costs covered by us
- Refunds processed within 5 working days

### 6. Consumer Rights
- Your statutory rights are not affected
- Goods must be as described, fit for purpose
- You may be entitled to a repair, replacement, or refund

### 7. Limitation of Liability
- We exclude liability for indirect losses
- Our total liability is limited to the price paid
- Nothing excludes liability for death, personal injury, or fraud

### 8. Privacy and Data Protection
- We process personal data in accordance with GDPR
- See our Privacy Policy for full details
- You have rights regarding your personal data

### 9. Governing Law
These terms are governed by English law and subject to the jurisdiction of English courts.
```

## 🔒 Data Protection (GDPR)

### GDPR Compliance Requirements
```typescript
const gdprRequirements = {
  lawfulBasis: {
    consent: "Marketing emails, cookies",
    contract: "Processing orders, delivery",
    legitimateInterest: "Fraud prevention, analytics",
    legalObligation: "Tax records, accounting"
  },
  
  rights: {
    access: "Subject access requests within 1 month",
    rectification: "Correct inaccurate data",
    erasure: "Right to be forgotten",
    portability: "Export data in machine-readable format",
    object: "Object to processing",
    restriction: "Restrict processing"
  },
  
  notices: {
    privacy: "Privacy policy in plain English",
    cookies: "Cookie consent banner",
    breach: "Report breaches within 72 hours",
    dpo: "Data Protection Officer contact details"
  }
}
```

### Cookie Consent Implementation
```typescript
// Cookie categories for consent
const cookieCategories = {
  essential: {
    name: "Essential Cookies",
    description: "Required for the website to function properly",
    consent: false, // Always on
    examples: ["Session management", "Security", "Load balancing"]
  },
  
  analytics: {
    name: "Analytics Cookies", 
    description: "Help us understand how visitors use our website",
    consent: true,
    examples: ["Google Analytics", "Hotjar", "Performance monitoring"]
  },
  
  marketing: {
    name: "Marketing Cookies",
    description: "Used to show you relevant advertisements",
    consent: true, 
    examples: ["Facebook Pixel", "Google Ads", "Affiliate tracking"]
  },
  
  preferences: {
    name: "Preference Cookies",
    description: "Remember your settings and preferences", 
    consent: true,
    examples: ["Language selection", "Currency", "Recently viewed"]
  }
}
```

## 🛡️ Security Requirements

### Payment Card Industry (PCI) Compliance
```typescript
const pciRequirements = {
  tokenisation: "Never store card details directly",
  encryption: "All card data encrypted in transit",
  access: "Restrict access to cardholder data",
  monitoring: "Monitor and test networks regularly",
  vulnerability: "Regular vulnerability scans",
  policies: "Information security policies"
}

// Recommended payment providers (PCI compliant)
const paymentProviders = {
  stripe: "Stripe UK - Full PCI compliance handled",
  paypal: "PayPal - No card details touch your servers", 
  worldpay: "Worldpay - UK-based payment processor",
  sagepay: "Sage Pay - Popular UK option"
}
```

## 📊 Accessibility Requirements

### WCAG 2.1 Compliance
```typescript
const accessibilityRequirements = {
  level: "AA", // Recommended standard
  
  guidelines: {
    perceivable: "Text alternatives, colour contrast, resizable text",
    operable: "Keyboard navigation, no seizures, navigable",
    understandable: "Readable, predictable, input assistance",
    robust: "Compatible with assistive technologies"
  },
  
  implementation: {
    altText: "All images have descriptive alt text",
    contrast: "4.5:1 ratio for normal text, 3:1 for large text", 
    keyboard: "Full keyboard navigation support",
    focus: "Clear focus indicators",
    headings: "Proper heading hierarchy",
    labels: "Form labels associated with inputs"
  }
}
```

## 🏪 Trading Standards

### Required Business Information
```typescript
const businessInfo = {
  displayRequired: {
    companyName: "Full registered company name",
    registeredAddress: "Companies House address",
    companyNumber: "Companies House registration number",
    vatNumber: "If VAT registered (threshold £85,000)",
    contactDetails: "Phone, email, postal address",
    businessType: "Limited company, sole trader, etc."
  },
  
  location: {
    footer: "Company details in website footer",
    contactPage: "Dedicated contact/about page", 
    termsConditions: "Within terms and conditions",
    invoices: "On all invoices and receipts"
  }
}
```

### Fair Trading Practices
```typescript
const fairTrading = {
  descriptions: {
    accurate: "Product descriptions must be truthful",
    material: "Include all material information",
    misleading: "Avoid misleading claims",
    evidence: "Claims must be substantiated"
  },
  
  pricing: {
    transparent: "Clear, upfront pricing",
    comparison: "Genuine price comparisons only",
    availability: "Accurate stock information",
    delivery: "Delivery costs clearly shown"
  },
  
  marketing: {
    honest: "Advertising must be honest",
    substantiated: "Claims must be provable",
    identification: "Ads must be clearly identified",
    targeting: "Age-appropriate targeting"
  }
}
```

This ensures full UK compliance for e-commerce operations! 🇬🇧⚖️
