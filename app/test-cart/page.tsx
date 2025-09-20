import CartUrlTester from '@/components/CartUrlTester';

export default function TestCartPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <CartUrlTester />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Teste de URLs de Carrinho - Shopify',
  description: 'Ferramenta para testar URLs de carrinho do Shopify',
};