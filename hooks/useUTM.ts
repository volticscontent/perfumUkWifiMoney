import { useState, useEffect } from 'react';
import { getStoreConfig } from '@/lib/simpleCheckout';

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
    console.log('🚀🚀🚀 [UTM Hook] useEffect executado - INÍCIO');
    if (typeof window === 'undefined') {
      console.log('⚠️ [UTM Hook] Window não disponível (SSR)');
      setIsLoaded(true);
      return;
    }
    
    console.log('🔍🔍🔍 [UTM Hook] Iniciando captura de parâmetros UTM');
    console.log('🔍🔍🔍 [UTM Hook] URL atual:', window.location.href);
    console.log('🔍🔍🔍 [UTM Hook] Search params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const newUtmParams: UTMParams = {};
    
    console.log('🔍 [UTM Hook] Parâmetros da URL:', urlParams.toString());
    console.log('🔍 [UTM Hook] Todos os parâmetros:', Array.from(urlParams.entries()));
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        let value = urlParams.get(param);
        
        // Fallback para erros de digitação comuns em utm_campaign
        if (!value && param === 'utm_campaign') {
          // Tenta utm_campain (sem g)
          value = urlParams.get('utm_campain');
          if (value) {
            console.log(`⚠️ [UTM Hook] Detectado 'utm_campain' (erro de digitação) - usando como utm_campaign: ${value}`);
          } else {
            // Tenta utm_campaing (com g no final)
            value = urlParams.get('utm_campaing');
            if (value) {
              console.log(`⚠️ [UTM Hook] Detectado 'utm_campaing' (erro de digitação) - usando como utm_campaign: ${value}`);
            }
          }
        }
      
      if (value) {
        newUtmParams[param as keyof UTMParams] = value;
        console.log(`✅ [UTM Hook] ${param}: ${value}`);
      } else {
        console.log(`❌ [UTM Hook] ${param}: não encontrado`);
      }
    });
    
    console.log('🔍 [UTM Hook] Parâmetros UTM capturados:', newUtmParams);
    setUtmParams(newUtmParams);
    setIsLoaded(true);
  }, []);

  // Mapeia UTM campaign para store ID
  const getStoreIdFromUTM = (utmCampaign?: string): string => {
    if (!utmCampaign) {
      console.log('🏪 [UTM Hook] Nenhuma UTM campaign encontrada, usando loja padrão id1');
      return 'id1';
    }

    const utmToStoreMap: { [key: string]: string } = {
      'id1': 'id1',
      'id2': 'id2', 
      'id3': 'id3',
      'euro-pride': 'id1',
      'perfumes-club': 'id2',
      'perfumes-co': 'id3',
      'store1': 'id1',
      'store2': 'id2',
      'store3': 'id3'
    };

    const storeId = utmToStoreMap[utmCampaign.toLowerCase()];
    
    if (storeId) {
      console.log(`🎯 [UTM Hook] UTM "${utmCampaign}" mapeada para loja: ${storeId}`);
      return storeId;
    } else {
      console.log(`⚠️ [UTM Hook] UTM "${utmCampaign}" não reconhecida, usando loja padrão id1`);
      return 'id1';
    }
  };

  const storeId = getStoreIdFromUTM(utmParams.utm_campaign);
  const storeConfig = getStoreConfig();

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