import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import ListControls from '@/components/filters/ListControls'
import ProductGrid from '../../components/products/ProductGrid'
import Pagination from '@/components/ui/Pagination'
import { getAllProducts } from '@/lib/products'
import { Product } from '@/types/product'

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12 // Número de produtos por página

  useEffect(() => {
    // Carregar apenas produtos em oferta
    const allProducts = getAllProducts()
    const onSaleProducts = allProducts.filter(product => 
      product.onSale || product.price.on_sale || product.tags.includes('offers')
    )
    setProducts(onSaleProducts)
    setFilteredProducts(onSaleProducts)
  }, [])

  // Calcular produtos da página atual
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage))

  // Função para mudar de página
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Special Offers</h1>
          <p className="mt-2 text-gray-600">
            Explore our exclusive deals and premium fragrances at special prices
          </p>
          {/* Contador de produtos */}
          <p className="mt-2 text-sm text-gray-500">
            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
          </p>
        </div>

        {/* Promotional Banner */}
        <div className="bg-tps-red text-white text-center p-4 rounded-lg mb-8">
          <p className="text-lg font-medium">
            Extra 10% OFF for Members - Join Now!
          </p>
        </div>

        <ListControls 
          products={products}
          onFilterToggle={(filters) => {
            if (filters.length === 0) {
              setFilteredProducts(products)
              setCurrentPage(1) // Reset para primeira página ao mudar filtros
              return
            }

            const newFiltered = products.filter(product => {
              return filters.some(filter => {
                // Filtro de marca
                if (filter.includes('-') && !['new-in', 'gift-set'].includes(filter)) {
                  const brandRegex = new RegExp(filter.replace(/-/g, '\\s+'), 'i')
                  if (product.brands?.some(brand => brandRegex.test(brand))) return true
                  if (product.primary_brand && brandRegex.test(product.primary_brand)) return true
                  if (product.title && brandRegex.test(product.title)) return true
                }
                
                // Filtro de preço
                if (filter === 'under-50') {
                  return parseFloat(product.price.regular.toString()) < 50
                }
                if (filter === '50-100') {
                  const price = parseFloat(product.price.regular.toString())
                  return price >= 50 && price <= 100
                }
                if (filter === 'over-100') {
                  return parseFloat(product.price.regular.toString()) > 100
                }

                // Filtros de gênero
                if (['men', 'women'].includes(filter)) {
                  return product.tags.some(tag => tag.toLowerCase() === filter)
                }

                // Filtros de coleção
                if (['new-in', 'bestseller', 'gift-set', 'premium'].includes(filter)) {
                  return product.tags.some(tag => tag === filter)
                }
                
                return false
              })
            })
            
            setFilteredProducts(newFiltered)
            setCurrentPage(1) // Reset para primeira página ao mudar filtros
          }}
        />

        {/* Grid de Produtos */}
        <ProductGrid products={currentProducts} />

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center mt-8 mb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
            <p className="text-sm text-gray-500 mt-2">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="mt-12 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About Our Offers
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              Our special offers include selected premium fragrances at discounted prices.
              Members get additional benefits and early access to sales. Sign up today to
              enjoy exclusive deals and promotions.
            </p>
            <ul className="mt-4 space-y-2">
              <li>Regular discounts on selected items</li>
              <li>Member-exclusive offers</li>
              <li>Seasonal sales and promotions</li>
              <li>Bundle deals on fragrance sets</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}