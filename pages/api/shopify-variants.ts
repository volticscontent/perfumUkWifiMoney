import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'shopify_variant_mapping.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn('Arquivo de mapeamento de variant IDs não encontrado');
      return res.status(404).json({ error: 'Variant mapping file not found' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const variantMapping = JSON.parse(fileContent);

    res.status(200).json(variantMapping);
  } catch (error) {
    console.error('Erro ao carregar mapeamento de variant IDs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}