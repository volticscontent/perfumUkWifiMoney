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
  storeId: string;
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
    // Só executa no cliente
    if (typeof window === 'undefined') return;

    try {
      // Primeiro, tenta carregar do sessionStorage
      const savedUTM = sessionStorage.getItem('utm_params');
      let params: UTMParams = {};

      if (savedUTM) {
        params = JSON.parse(savedUTM);
      }

      // Verifica se há novos parâmetros UTM na URL atual
      const urlParams = new URLSearchParams(window.location.search);
      const newParams: UTMParams = {};
      
      // Captura todos os parâmetros UTM da URL
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          newParams[param as keyof UTMParams] = value;
        }
      });

      // Se há novos parâmetros, atualiza e salva
      if (Object.keys(newParams).length > 0) {
        params = { ...params, ...newParams };
        sessionStorage.setItem('utm_params', JSON.stringify(params));
        
        console.log('🎯 UTM params capturados:', params);
      }

      setUtmParams(params);
      setIsLoaded(true);

    } catch (error) {
      console.error('Erro ao carregar parâmetros UTM:', error);
      setIsLoaded(true);
    }
  }, []);

  // Calcula storeId e config baseado no utm_campaign
  const storeId = extractStoreIdFromCampaign(utmParams.utm_campaign);
  const storeConfig = getStoreConfig(utmParams.utm_campaign);

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