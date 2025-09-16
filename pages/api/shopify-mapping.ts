import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const mappingPath = path.join(process.cwd(), 'data', 'shopify_mapping.json');
    
    if (!fs.existsSync(mappingPath)) {
      return res.status(404).json({ message: 'Mapping file not found' });
    }

    const mappingData = fs.readFileSync(mappingPath, 'utf8');
    const mapping = JSON.parse(mappingData);
    
    res.status(200).json(mapping);
  } catch (error) {
    console.error('Error loading Shopify mapping:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}