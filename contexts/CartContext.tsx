import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { usePixel } from '@/hooks/usePixel'
import { useUTM } from '@/hooks/useUTM'
import { validateAndFixCartItem, initializeAutoCleanup } from '@/lib/cacheCleanup'

interface CartItem {
  id: number
  shopifyId: string
  storeId?: string // CORREÇÃO: Store ID usado para obter o variant ID
  title: string
  subtitle: string
  price: number
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  total: number
  initiateCheckout: () => void
  utm_campaign: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const pixel = usePixel()
  const { utmParams } = useUTM()

  // Inicializar limpeza automática de cache quando o componente monta
  useEffect(() => {
    initializeAutoCleanup()
  }, [])
  
  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    // Validar e corrigir IDs obsoletos antes de adicionar
    const validatedItem = validateAndFixCartItem(newItem)
    if (!validatedItem) {
      console.error('Item com ID obsoleto rejeitado:', newItem)
      return
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === validatedItem.id)
      
      if (existingItem) {
        // Atualizar quantidade
        const updatedItems = prevItems.map(item =>
          item.id === validatedItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        
        // Rastrear evento AddToCart
        pixel.addToCart({
          value: validatedItem.price * quantity,
          currency: 'GBP',
          content_name: validatedItem.title,
          content_ids: [validatedItem.id]
        })

        return updatedItems
      }

      // Adicionar novo item
      pixel.addToCart({
        value: validatedItem.price * quantity,
        currency: 'GBP',
        content_name: validatedItem.title,
        content_ids: [validatedItem.id]
      })

      return [...prevItems, { ...validatedItem, quantity }]
    })
    setIsOpen(true)
  }

  const removeItem = (id: number) => {
    setItems(items => items.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, delta: number) => {
    setItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(10, item.quantity + delta)) }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const initiateCheckout = () => {
    // Rastrear evento InitiateCheckout antes de redirecionar para Shopify
    pixel.initiateCheckout({
      value: total,
      currency: 'GBP',
      content_ids: items.map(item => item.id),
      num_items: items.length
    })
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        total,
        initiateCheckout,
        utm_campaign: utmParams.utm_campaign || null
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}