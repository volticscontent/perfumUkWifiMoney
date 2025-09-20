import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Caminho para o arquivo de produtos unificados
    const filePath = path.join(process.cwd(), 'data', 'unified_products_en_gbp.json');
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        message: 'Arquivo de produtos unificados não encontrado',
        path: filePath 
      });
    }

    // Lê o arquivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Retorna os dados
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Erro ao carregar produtos unificados:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}