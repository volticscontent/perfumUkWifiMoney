import { NextApiRequest, NextApiResponse } from 'next'
import { getProductByHandle } from '@/lib/products'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { handle } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (typeof handle !== 'string') {
    return res.status(400).json({ message: 'Invalid handle parameter' })
  }

  try {
    const product = getProductByHandle(handle)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}