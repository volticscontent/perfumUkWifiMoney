import { NextApiRequest, NextApiResponse } from 'next';
import { searchProducts } from '@/lib/products';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { q, limit = '20', offset = '0' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    if (q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    // Buscar produtos
    let products = searchProducts(q);

    // Paginação
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const total = products.length;
    
    products = products.slice(offsetNum, offsetNum + limitNum);

    res.status(200).json({
      query: q,
      products,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        pages: Math.ceil(total / limitNum),
        current_page: Math.floor(offsetNum / limitNum) + 1
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
