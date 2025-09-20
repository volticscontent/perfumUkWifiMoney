import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Aceita apenas POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log do evento para debug (opcional)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracking Event]', {
        method: req.method,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString()
      });
    }

    // Resposta de sucesso simples
    res.status(200).json({ 
      success: true, 
      message: 'Event tracked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Tracking Error]', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to track event'
    });
  }
}