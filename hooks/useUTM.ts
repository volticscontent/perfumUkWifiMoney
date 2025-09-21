import { useState, useEffect } from 'react';
import { extractStoreIdFromCampaign, getStoreConfig } from '@/lib/shopifyStores';

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface UTMHook {
  utmParams: UTMParams;
  storeId: string | null;
  storeConfig: ReturnType<typeof getStoreConfig>;
  isLoaded: boolean;
}

/**
 * Hook para capturar e gerenciar parâmetros UTM
 * Persiste os parâmetros no sessionStorage para manter durante a sessão
 */
export function useUTM(): UTMHook {
  const [utmParams, setUtmParams] = useState<UTMParams>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const newUtmParams: UTMParams = {};
      
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          newUtmParams[param as keyof UTMParams] = value;
        }
      });
      
      setUtmParams(newUtmParams);
    }
    
    setIsLoaded(true);
  }, []);

  // Calcular storeId baseado no utm_campaign
  const storeId = extractStoreIdFromCampaign(utmParams.utm_campaign);
  const storeConfig = getStoreConfig(storeId);

  return {
    utmParams,
    storeId,
    storeConfig,
    isLoaded
  };
}

/**
 * Função utilitária para limpar parâmetros UTM (útil para testes)
 */
export function clearUTMParams(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('utm_params');
  }
}

/**
 * Função utilitária para definir parâmetros UTM manualmente (útil para testes)
 */
export function setUTMParams(params: UTMParams): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('utm_params', JSON.stringify(params));
  }
}