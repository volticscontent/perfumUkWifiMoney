import { NextApiRequest, NextApiResponse } from 'next';
import { getAllProducts, filterProducts, getProductStats } from '@/lib/products';
import type { SearchFilters } from '@/types/product';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      category, 
      brand, 
      priceMin, 
      priceMax, 
      tags, 
      featured, 
      onSale, 
      limit = '50',
      offset = '0',
      stats 
    } = req.query;

    // Se for solicitação de estatísticas
    if (stats === 'true') {
      const statistics = getProductStats();
      return res.status(200).json(statistics);
    }

    // Construir filtros
    const filters: SearchFilters = {};
    
    if (category && typeof category === 'string') filters.category = category;
    if (brand && typeof brand === 'string') filters.brand = brand;
    if (priceMin && typeof priceMin === 'string') filters.priceMin = parseFloat(priceMin);
    if (priceMax && typeof priceMax === 'string') filters.priceMax = parseFloat(priceMax);
    if (tags && typeof tags === 'string') filters.tags = tags.split(',');
    if (featured === 'true') filters.featured = true;
    if (onSale === 'true') filters.onSale = true;

    // Obter produtos
    let products = Object.keys(filters).length > 0 ? filterProducts(filters) : getAllProducts();

    // Paginação
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const total = products.length;
    
    products = products.slice(offsetNum, offsetNum + limitNum);

    // Resposta
    res.status(200).json({
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
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
