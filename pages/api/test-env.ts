import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Testar se as variáveis de ambiente estão disponíveis na API
  const envVars = {
    SHOPIFY_STORE_1_DOMAIN: process.env.SHOPIFY_STORE_1_DOMAIN || 'NÃO DEFINIDO',
    SHOPIFY_STORE_1_STOREFRONT_TOKEN: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    SHOPIFY_STORE_1_ADMIN_TOKEN: process.env.SHOPIFY_STORE_1_ADMIN_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDO'
  };

  console.log('🔍 Variáveis de ambiente na API:', envVars);

  return res.status(200).json({
    message: 'Teste de variáveis de ambiente',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
}