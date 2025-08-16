#!/usr/bin/env python3
"""
📦 Simple Product Manager
Sistema simples para gerenciar produtos usando JSON puro
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import shutil

class SimpleProductManager:
    def __init__(self, base_dir: str = "C:/Users/gusta/Códigos/perfumes"):
        self.base_dir = Path(base_dir)
        self.data_dir = self.base_dir / "data"
        self.products_file = self.data_dir / "products.json"
        self.categories_file = self.data_dir / "categories.json"
        self.brands_file = self.data_dir / "brands.json"
        self.config_file = self.data_dir / "config.json"
        
        # Criar diretórios
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Inicializar arquivos se não existirem
        self.init_data_files()

    def init_data_files(self):
        """Inicializar arquivos de dados se não existirem"""
        # Products
        if not self.products_file.exists():
            self.save_json(self.products_file, {"products": [], "metadata": {"total": 0}})
        
        # Categories
        if not self.categories_file.exists():
            self.save_json(self.categories_file, {
                "categories": [
                    {"id": "gift-sets", "name": "Gift Sets", "description": "Luxury fragrance collections"},
                    {"id": "parfum", "name": "Parfum", "description": "Premium parfum fragrances"},
                    {"id": "eau-de-parfum", "name": "Eau de Parfum", "description": "Long-lasting EDP fragrances"},
                    {"id": "eau-de-toilette", "name": "Eau de Toilette", "description": "Fresh EDT fragrances"},
                    {"id": "body-care", "name": "Body Care", "description": "Scented body products"}
                ]
            })
        
        # Brands
        if not self.brands_file.exists():
            self.save_json(self.brands_file, {"brands": []})
        
        # Config
        if not self.config_file.exists():
            self.save_json(self.config_file, {
                "site": {
                    "name": "Perfumes UK",
                    "currency": "GBP",
                    "vat_rate": 0.20,
                    "free_shipping_threshold": 30.00
                },
                "inventory": {
                    "default_stock": 100,
                    "low_stock_threshold": 10
                },
                "pricing": {
                    "markup_percentage": 0.30,
                    "auto_discounts": True
                }
            })

    def save_json(self, file_path: Path, data: Dict) -> None:
        """Salvar dados em JSON com backup"""
        # Fazer backup se o arquivo existir
        if file_path.exists():
            backup_path = file_path.with_suffix(f'.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            shutil.copy2(file_path, backup_path)
        
        # Salvar dados
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def load_json(self, file_path: Path) -> Dict:
        """Carregar dados de JSON"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def get_all_products(self) -> List[Dict]:
        """Obter todos os produtos"""
        data = self.load_json(self.products_file)
        return data.get('products', [])

    def get_product_by_id(self, product_id: str) -> Optional[Dict]:
        """Obter produto por ID"""
        products = self.get_all_products()
        return next((p for p in products if p.get('id') == product_id), None)

    def get_product_by_handle(self, handle: str) -> Optional[Dict]:
        """Obter produto por handle"""
        products = self.get_all_products()
        return next((p for p in products if p.get('handle') == handle), None)

    def get_products_by_category(self, category: str) -> List[Dict]:
        """Obter produtos por categoria"""
        products = self.get_all_products()
        return [p for p in products if p.get('category', '').lower() == category.lower()]

    def get_products_by_brand(self, brand: str) -> List[Dict]:
        """Obter produtos por marca"""
        products = self.get_all_products()
        return [p for p in products if p.get('brand', '').lower() == brand.lower()]

    def search_products(self, query: str) -> List[Dict]:
        """Buscar produtos"""
        products = self.get_all_products()
        query_lower = query.lower()
        
        results = []
        for product in products:
            # Buscar em título, marca, descrição e tags
            if (query_lower in product.get('title', '').lower() or
                query_lower in product.get('brand', '').lower() or
                query_lower in product.get('description', '').lower() or
                any(query_lower in tag.lower() for tag in product.get('tags', []))):
                results.append(product)
        
        return results

    def add_product(self, product_data: Dict) -> bool:
        """Adicionar novo produto"""
        try:
            products_data = self.load_json(self.products_file)
            products = products_data.get('products', [])
            
            # Verificar se já existe
            if any(p.get('id') == product_data.get('id') for p in products):
                print(f"❌ Produto {product_data.get('id')} já existe!")
                return False
            
            # Adicionar timestamps
            product_data['created_at'] = datetime.now().isoformat()
            product_data['updated_at'] = datetime.now().isoformat()
            
            # Adicionar à lista
            products.append(product_data)
            
            # Atualizar metadata
            products_data['products'] = products
            products_data['metadata'] = {
                'total': len(products),
                'updated_at': datetime.now().isoformat()
            }
            
            # Salvar
            self.save_json(self.products_file, products_data)
            
            # Atualizar índices
            self.update_brands_index()
            
            print(f"✅ Produto {product_data.get('title')} adicionado!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao adicionar produto: {e}")
            return False

    def update_product(self, product_id: str, updates: Dict) -> bool:
        """Atualizar produto existente"""
        try:
            products_data = self.load_json(self.products_file)
            products = products_data.get('products', [])
            
            # Encontrar produto
            for i, product in enumerate(products):
                if product.get('id') == product_id:
                    # Aplicar updates
                    products[i].update(updates)
                    products[i]['updated_at'] = datetime.now().isoformat()
                    
                    # Salvar
                    products_data['products'] = products
                    products_data['metadata']['updated_at'] = datetime.now().isoformat()
                    self.save_json(self.products_file, products_data)
                    
                    print(f"✅ Produto {product_id} atualizado!")
                    return True
            
            print(f"❌ Produto {product_id} não encontrado!")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao atualizar produto: {e}")
            return False

    def delete_product(self, product_id: str) -> bool:
        """Deletar produto"""
        try:
            products_data = self.load_json(self.products_file)
            products = products_data.get('products', [])
            
            # Filtrar produto
            new_products = [p for p in products if p.get('id') != product_id]
            
            if len(new_products) == len(products):
                print(f"❌ Produto {product_id} não encontrado!")
                return False
            
            # Salvar
            products_data['products'] = new_products
            products_data['metadata'] = {
                'total': len(new_products),
                'updated_at': datetime.now().isoformat()
            }
            self.save_json(self.products_file, products_data)
            
            print(f"✅ Produto {product_id} deletado!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao deletar produto: {e}")
            return False

    def bulk_import_products(self, products_list: List[Dict]) -> int:
        """Importar produtos em lote"""
        success_count = 0
        
        for product in products_list:
            if self.add_product(product):
                success_count += 1
        
        print(f"✅ {success_count}/{len(products_list)} produtos importados!")
        return success_count

    def update_brands_index(self) -> None:
        """Atualizar índice de marcas"""
        products = self.get_all_products()
        brands = {}
        
        for product in products:
            brand = product.get('brand', 'Unknown')
            if brand not in brands:
                brands[brand] = {
                    'name': brand,
                    'products_count': 0,
                    'products': []
                }
            
            brands[brand]['products_count'] += 1
            brands[brand]['products'].append(product.get('id'))
        
        brands_data = {
            'brands': list(brands.values()),
            'metadata': {
                'total': len(brands),
                'updated_at': datetime.now().isoformat()
            }
        }
        
        self.save_json(self.brands_file, brands_data)

    def get_statistics(self) -> Dict:
        """Obter estatísticas dos produtos"""
        products = self.get_all_products()
        
        if not products:
            return {"total": 0}
        
        # Contadores
        categories = {}
        brands = {}
        price_ranges = {"under_25": 0, "25_to_50": 0, "50_to_100": 0, "over_100": 0}
        total_price = 0
        on_sale_count = 0
        
        for product in products:
            # Categorias
            cat = product.get('category', 'Unknown')
            categories[cat] = categories.get(cat, 0) + 1
            
            # Marcas
            brand = product.get('brand', 'Unknown')
            brands[brand] = brands.get(brand, 0) + 1
            
            # Preços
            price = product.get('price', {}).get('regular', 0)
            total_price += price
            
            if price < 25:
                price_ranges["under_25"] += 1
            elif price < 50:
                price_ranges["25_to_50"] += 1
            elif price < 100:
                price_ranges["50_to_100"] += 1
            else:
                price_ranges["over_100"] += 1
            
            # Promoções
            if product.get('price', {}).get('on_sale', False):
                on_sale_count += 1
        
        return {
            "total_products": len(products),
            "categories": categories,
            "brands": brands,
            "price_ranges": price_ranges,
            "average_price": round(total_price / len(products), 2) if products else 0,
            "on_sale_count": on_sale_count,
            "on_sale_percentage": round((on_sale_count / len(products)) * 100, 1) if products else 0
        }

    def export_for_frontend(self) -> Dict:
        """Exportar dados otimizados para frontend"""
        products = self.get_all_products()
        categories_data = self.load_json(self.categories_file)
        brands_data = self.load_json(self.brands_file)
        
        # Produtos otimizados para frontend
        frontend_products = []
        for product in products:
            if product.get('status') == 'active':
                images = product.get('images', [])
                frontend_product = {
                    "id": product.get('id'),
                    "handle": product.get('handle'),
                    "title": product.get('title'),
                    "brand": product.get('brand'),
                    "category": product.get('category'),
                    "price": {
                        **product.get('price', {}),
                        "formatted_regular": f"£{product.get('price', {}).get('regular', 0):.2f}",
                        "formatted_sale": f"£{product.get('price', {}).get('sale', 0):.2f}" if product.get('price', {}).get('sale', 0) > 0 else None
                    },
                    "images": images[:4],  # Máximo 4 imagens
                    "featured_image": images[0].get('url', '') if images else '',
                    "tags": product.get('tags', []),
                    "featured": product.get('featured', False),
                    "new_arrival": product.get('new_arrival', False),
                    "bestseller": product.get('bestseller', False)
                }
                frontend_products.append(frontend_product)
        
        return {
            "products": frontend_products,
            "categories": categories_data.get('categories', []),
            "brands": [{"name": brand['name'], "count": brand['products_count']} 
                      for brand in brands_data.get('brands', [])],
            "metadata": {
                "total": len(frontend_products),
                "updated_at": datetime.now().isoformat()
            }
        }

    def export_for_shopify(self) -> List[Dict]:
        """Exportar dados para Shopify"""
        products = self.get_all_products()
        shopify_products = []
        
        for product in products:
            if product.get('status') == 'active':
                shopify_product = {
                    "title": product.get('title'),
                    "body_html": f"<p>{product.get('description', '')}</p>",
                    "vendor": product.get('brand'),
                    "product_type": product.get('category'),
                    "tags": ', '.join(product.get('tags', [])),
                    "handle": product.get('handle'),
                    "variants": [
                        {
                            "title": var.get('title', 'Default'),
                            "price": str(var.get('price', 0)),
                            "sku": var.get('sku', ''),
                            "inventory_quantity": var.get('stock', 100)
                        }
                        for var in product.get('variants', [])
                    ] or [{
                        "title": "Default Title",
                        "price": str(product.get('price', {}).get('regular', 0)),
                        "sku": product.get('handle', ''),
                        "inventory_quantity": 100
                    }]
                }
                shopify_products.append(shopify_product)
        
        return shopify_products

def main():
    """Demonstração do sistema"""
    print("📦 Simple Product Manager v1.0")
    print("=" * 50)
    
    manager = SimpleProductManager()
    
    # Mostrar estatísticas
    stats = manager.get_statistics()
    print(f"📊 Total de produtos: {stats.get('total_products', 0)}")
    
    if stats.get('total_products', 0) > 0:
        print(f"💰 Preço médio: £{stats.get('average_price', 0)}")
        print(f"🏷️ Produtos em promoção: {stats.get('on_sale_percentage', 0)}%")
        
        print("\n📂 Top categorias:")
        for cat, count in list(stats.get('categories', {}).items())[:5]:
            print(f"  {cat}: {count}")
        
        print("\n🏷️ Top marcas:")
        for brand, count in list(stats.get('brands', {}).items())[:5]:
            print(f"  {brand}: {count}")

if __name__ == "__main__":
    main()
