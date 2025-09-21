import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Testar se as variáveis de ambiente estão disponíveis na API
  const envVars = {
    SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN || 'NÃO DEFINIDO',
    SHOPIFY_STOREFRONT_TOKEN: process.env.SHOPIFY_STOREFRONT_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    SHOPIFY_ADMIN_TOKEN: process.env.SHOPIFY_ADMIN_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    NEXT_PUBLIC_SHOPIFY_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'NÃO DEFINIDO',
    NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDO'
  };

  console.log('🔍 Variáveis de ambiente na API:', envVars);

  return res.status(200).json({
    message: 'Teste de variáveis de ambiente',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
}