import { NextApiRequest, NextApiResponse } from 'next';
import { getFeaturedProducts, getSaleProducts, getNewProducts } from '@/lib/products';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type = 'featured', limit = '8' } = req.query;
    const limitNum = parseInt(limit as string);

    let products;
    let sectionName;

    switch (type) {
      case 'sale':
        products = getSaleProducts(limitNum);
        sectionName = 'Sale Products';
        break;
      case 'new':
        products = getNewProducts(limitNum);
        sectionName = 'New Arrivals';
        break;
      case 'featured':
      default:
        products = getFeaturedProducts(limitNum);
        sectionName = 'Featured Products';
        break;
    }

    res.status(200).json({
      section: sectionName,
      type,
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
