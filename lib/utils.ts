import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import { useEffect } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Configurações dos pixels usando variáveis de ambiente NEXT_PUBLIC_ (seguras para frontend)
export const FACEBOOK_PIXEL_ID_1 = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_1
export const FACEBOOK_PIXEL_ID_2 = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_2
export const TIKTOK_PIXEL_ID_1 = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_1 || 'D3094U3C77U1O98E1R50'
export const TIKTOK_PIXEL_ID_2 = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2
export const UTMIFY_PIXEL_ID = process.env.NEXT_PUBLIC_UTMIFY_PIXEL_ID

// Webhook do n8n para captura do ttclid
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://n8n.landcriativa.com/webhook/quiz"
const N8N_WEBHOOK_KEY = process.env.NEXT_PUBLIC_N8N_WEBHOOK_KEY || "XBEHgtft1SvVT75xtvvogD95ExDXCqekgF2emRXDPR4KBx7QLKBfxps3tWfpBHAV"

// Controle global de eventos já disparados
const trackedEvents = new Set<string>()

// Função para capturar ttclid e enviar para n8n
export async function captureTikTokClickId() {
  if (typeof window === 'undefined') return

  try {
    const urlParams = new URLSearchParams(window.location.search)
    let ttclid = urlParams.get('ttclid')

    // Se não há ttclid na URL, tentar pegar do localStorage
    if (!ttclid) {
      ttclid = localStorage.getItem('captured_ttclid')
    } else {
      // Se há ttclid na URL, salvar no localStorage
      localStorage.setItem('captured_ttclid', ttclid)
    }

    if (ttclid) {
      // Capturar email parcial se disponível
      const email = localStorage.getItem('lead_email') || ''
      
      // Dados para enviar ao webhook
      const payload = {
        ttclid,
        email,
        timestamp: Date.now(),
        url: window.location.href,
        referrer: document.referrer || '',
        user_agent: navigator.userAgent
      }

      try {
        const response = await axios.post(N8N_WEBHOOK_URL, payload, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': N8N_WEBHOOK_KEY
          },
          timeout: 5000 // Reduced timeout for faster failure
        })

        if (response.status >= 200 && response.status < 300) {
          console.log('[TikTok Click ID] Successfully sent to n8n')
          return response.data
        } else {
          console.warn('[TikTok Click ID] Unexpected response status:', response.status)
        }
      } catch (networkError: any) {
        // Handle CORS and network errors gracefully without breaking the app
        console.warn('[TikTok Click ID] Network/CORS error (non-critical):', networkError.message || networkError)
        // Store the data locally as fallback
        localStorage.setItem('pending_ttclid_data', JSON.stringify(payload))
      }
    }
  } catch (error) {
    console.warn('[TikTok Click ID] General error (non-critical):', error)
  }
}

// Hook para executar captura do ttclid automaticamente
export function useTikTokClickIdCapture() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Executar captura do ttclid
      captureTikTokClickId()
    }
  }, []) // Array vazio para executar apenas uma vez
  
  return {} // Retornar objeto vazio para evitar problemas de TypeScript
}

export function trackEvent(eventName: string, parameters?: Record<string, any>, allowDuplicates: boolean = true) {
  // Se o evento já foi disparado e não permite duplicatas, não dispara novamente
  if (!allowDuplicates && trackedEvents.has(eventName)) {
    console.log(`[Pixel Tracking] Event already tracked:`, eventName)
    return
  }

  if (typeof window !== 'undefined') {
    // Facebook Pixels usando track simples
    if ((window as any).fbq) {
      try {
        (window as any).fbq('track', eventName, parameters)
        console.log(`[Meta Pixels] Tracked event:`, eventName, parameters)
      } catch (error) {
        console.error('[Meta Pixel] Error tracking event:', error)
      }
    }

    // TikTok Pixel 1
    if ((window as any).ttq && TIKTOK_PIXEL_ID_1) {
      try {
        (window as any).ttq.track(eventName, parameters)
        console.log(`[TikTok Pixel ${TIKTOK_PIXEL_ID_1}] Tracked event:`, eventName, parameters)
      } catch (error) {
        console.error('[TikTok Pixel 1] Error tracking event:', error)
      }
    }

    // UTMify Pixel (se disponível)
    if ((window as any).utmify && typeof (window as any).utmify.track === 'function') {
      try {
        (window as any).utmify.track(eventName, parameters)
        console.log(`[UTMify Pixel] Tracked event:`, eventName, parameters)
      } catch (error) {
        console.error('[UTMify Pixel] Error tracking event:', error)
      }
    }

    // Marca o evento como disparado
    if (!allowDuplicates) {
      trackedEvents.add(eventName)
    }
  }
}

// Função específica para rastrear steps do quiz
export function trackQuizStep(step: string, questionNumber?: number, isCorrect?: boolean) {
  const stepKey = `quiz_${step}${questionNumber ? `_${questionNumber}` : ''}`
  
  const parameters: Record<string, any> = {}
  
  if (questionNumber) {
    parameters.question_number = questionNumber
  }
  
  if (isCorrect !== undefined) {
    parameters.is_correct = isCorrect
  }
  
  // Log detalhado para debug
  console.log(`[Quiz Step Tracking] ${stepKey}:`, parameters)
  console.log(`[Pixels] Meta 1: ${FACEBOOK_PIXEL_ID_1 || 'Not configured'}, Meta 2: ${FACEBOOK_PIXEL_ID_2 || 'Not configured'}, TikTok 1: ${TIKTOK_PIXEL_ID_1 || 'Not configured'}, TikTok 2: ${TIKTOK_PIXEL_ID_2 || 'Not configured'}`)
  
  trackEvent(stepKey, parameters, false) // Não permite duplicatas por padrão
}
