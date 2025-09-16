import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { mutation, variables } = req.body;

  try {
    const response = await fetch(`${process.env.SHOPIFY_STORE_DOMAIN}api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const result = await response.json();
    
    console.log('Shopify API Response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('Shopify API Error:', result);
      return res.status(response.status).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error creating checkout:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}