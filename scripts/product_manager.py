#!/usr/bin/env python3
"""
Gerenciador Centralizado de Produtos - Shopify Integration Ready

Este script cria uma estrutura unificada de produtos integrando:
- Dados existentes de produtos
- Fotos organizadas (main/individual)  
- Metadados para Shopify API
- Categorização automática
- Mapeamento de marcas
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
import hashlib

class ProductManager:
    def __init__(self, data_dir="data", images_dir="public/images/products"):
        self.data_dir = Path(data_dir)
        self.images_dir = Path(images_dir)
        self.combos_dir = self.images_dir / "combos"
        
        # Arquivo de saída centralizado
        self.unified_products_file = self.data_dir / "unified_products.json"
        self.shopify_products_file = self.data_dir / "shopify_products.json"
        
        # Carregar dados existentes
        self.existing_products = self.load_existing_products()
        self.image_mapping = self.load_image_mapping()
        
        # Mapeamentos para categorização
        self.brand_mapping = self.load_brand_mapping()
        self.category_mapping = self.load_category_mapping()
        
        self.unified_products = []
        self.stats = {
            'total_products': 0,
            'with_images': 0,
            'combos': 0,
            'single_products': 0,
            'categorized': 0,
            'brands_identified': 0
        }

    def load_existing_products(self) -> List[Dict]:
        """Carrega produtos existentes"""
        products_file = self.data_dir / "products.json"
        if products_file.exists():
            with open(products_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('products', [])
        return []

    def load_image_mapping(self) -> Dict:
        """Carrega mapeamento de imagens"""
        mapping_file = self.images_dir / "image_mapping.json"
        if mapping_file.exists():
            with open(mapping_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def load_brand_mapping(self) -> Dict:
        """Carrega/cria mapeamento de marcas"""
        return {
            'paco-rabanne': 'Paco Rabanne',
            'dior': 'Dior', 
            'chanel': 'Chanel',
            'carolina-herrera': 'Carolina Herrera',
            'yves-saint-laurent': 'Yves Saint Laurent',
            'versace': 'Versace',
            'jean-paul-gaultier': 'Jean Paul Gaultier',
            'lancome': 'Lancôme',
            'giorgio-armani': 'Giorgio Armani',
            'boss': 'Hugo Boss',
            'chloe': 'Chloé',
            'default': 'Multi-Brand'
        }

    def load_category_mapping(self) -> Dict:
        """Carrega/cria mapeamento de categorias"""
        return {
            'feminino': 'Women\'s Fragrances',
            'masculino': 'Men\'s Fragrances', 
            'combo': 'Fragrance Sets',
            'unisex': 'Unisex Fragrances',
            'default': 'Fragrance Sets'
        }

    def extract_brands_from_title(self, title: str) -> List[str]:
        """Extrai marcas do título do produto"""
        title_lower = title.lower()
        brands = []
        
        for brand_key, brand_name in self.brand_mapping.items():
            if brand_key in title_lower and brand_key != 'default':
                brands.append(brand_name)
        
        return list(set(brands)) if brands else [self.brand_mapping['default']]

    def determine_category(self, title: str, handle: str) -> str:
        """Determina categoria baseada no título e handle"""
        text = f"{title} {handle}".lower()
        
        if 'feminino' in text or 'women' in text:
            return self.category_mapping['feminino']
        elif 'masculino' in text or 'men' in text:
            return self.category_mapping['masculino']
        elif 'combo' in text or 'set' in text:
            return self.category_mapping['combo']
        else:
            return self.category_mapping['default']

    def get_product_images(self, product_handle: str) -> Dict[str, List[str]]:
        """Obtém imagens organizadas para um produto"""
        images = {
            'main': [],
            'gallery': [],
            'individual_items': []
        }
        
        # Buscar na estrutura de combos
        for image_key, image_data in self.image_mapping.items():
            # Tentar match com handle do produto
            if self.is_handle_match(product_handle, image_data.get('combo_name', '')):
                image_path = f"/images/products/{image_data['path']}"
                
                if image_data['type'] == 'combo_main':
                    images['main'].append(image_path)
                elif image_data['type'] == 'combo_item':
                    images['individual_items'].append({
                        'url': image_path,
                        'item_number': image_data.get('item_number', 1)
                    })
        
        # Se não encontrou na estrutura de combos, usar imagens originais
        if not images['main'] and hasattr(self, 'existing_products'):
            for product in self.existing_products:
                if product['handle'] == product_handle:
                    original_images = product.get('images', [])
                    if original_images:
                        images['main'] = [original_images[0]]  # Primeira como main
                        images['gallery'] = original_images[1:] if len(original_images) > 1 else []
                    break
        
        return images

    def is_handle_match(self, product_handle: str, combo_name: str) -> bool:
        """Verifica se o handle do produto corresponde ao nome do combo"""
        if not combo_name:
            return False
            
        # Normalizar ambos para comparação
        handle_normalized = self.normalize_for_comparison(product_handle)
        combo_normalized = self.normalize_for_comparison(combo_name)
        
        # Verificar correspondência parcial (pelo menos 60% de similaridade)
        return self.similarity_score(handle_normalized, combo_normalized) > 0.6

    def normalize_for_comparison(self, text: str) -> str:
        """Normaliza texto para comparação"""
        # Remove prefixos comuns
        text = re.sub(r'^combo-\d+-perfumes?-', '', text)
        text = re.sub(r'^combo-de-\d+-perfumes?-', '', text)
        text = re.sub(r'^combo-\d+-parfums?-', '', text)
        
        # Remove caracteres especiais e normaliza
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'\s+', '-', text)
        text = text.lower().strip('-')
        
        return text

    def similarity_score(self, text1: str, text2: str) -> float:
        """Calcula score de similaridade entre dois textos"""
        if not text1 or not text2:
            return 0.0
            
        # Usando Jaccard similarity com palavras
        words1 = set(text1.split('-'))
        words2 = set(text2.split('-'))
        
        if not words1 or not words2:
            return 0.0
            
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        return intersection / union if union > 0 else 0.0

    def create_shopify_product(self, unified_product: Dict) -> Dict:
        """Converte produto unificado para formato Shopify"""
        # Mapear imagens para Shopify
        shopify_images = []
        
        # Imagem principal
        if unified_product['images']['main']:
            shopify_images.append({
                'src': unified_product['images']['main'][0],
                'alt': unified_product['title'],
                'position': 1
            })
        
        # Imagens da galeria
        position = 2
        for img in unified_product['images']['gallery']:
            shopify_images.append({
                'src': img,
                'alt': f"{unified_product['title']} - Gallery {position-1}",
                'position': position
            })
            position += 1
        
        # Produtos individuais (se for combo)
        for item in unified_product['images']['individual_items']:
            shopify_images.append({
                'src': item['url'],
                'alt': f"{unified_product['title']} - Item {item['item_number']}",
                'position': position
            })
            position += 1
        
        # Criar variantes (assumindo que cada produto tem pelo menos uma variante)
        variants = [{
            'title': 'Default',
            'price': str(unified_product['price']['regular']),
            'compare_at_price': str(unified_product['price'].get('sale', '')),
            'sku': unified_product['sku'],
            'inventory_quantity': 100,  # Estoque default
            'inventory_management': 'shopify',
            'requires_shipping': True,
            'taxable': True,
            'weight': 0.5,  # 500g default para perfumes
            'weight_unit': 'kg'
        }]
        
        return {
            'title': unified_product['title'],
            'body_html': unified_product['description_html'],
            'vendor': unified_product['primary_brand'],
            'product_type': unified_product['category'],
            'handle': unified_product['handle'],
            'tags': ', '.join(unified_product['tags']),
            'published': True,
            'template_suffix': '',
            'images': shopify_images,
            'variants': variants,
            'options': [
                {
                    'name': 'Title',
                    'values': ['Default']
                }
            ],
            'metafields': [
                {
                    'namespace': 'custom',
                    'key': 'is_combo',
                    'value': str(unified_product['is_combo']).lower(),
                    'type': 'boolean'
                },
                {
                    'namespace': 'custom', 
                    'key': 'brands',
                    'value': json.dumps(unified_product['brands']),
                    'type': 'json'
                },
                {
                    'namespace': 'custom',
                    'key': 'popularity_score',
                    'value': str(unified_product['popularity']),
                    'type': 'number_decimal'
                }
            ]
        }

    def process_products(self):
        """Processa todos os produtos criando estrutura unificada"""
        print("🔄 Processando produtos...")
        
        for product in self.existing_products:
            self.stats['total_products'] += 1
            
            # Extrair informações básicas
            brands = self.extract_brands_from_title(product['title'])
            category = self.determine_category(product['title'], product['handle'])
            images = self.get_product_images(product['handle'])
            
            # Determinar se é combo
            is_combo = 'combo' in product['title'].lower() or len(brands) > 1
            
            # Criar descrição HTML enriquecida
            description_html = self.create_description_html(product, brands, is_combo)
            
            # Gerar SKU único
            sku = self.generate_sku(product['handle'], product['id'])
            
            # Produto unificado
            unified_product = {
                'id': product['id'],
                'handle': product['handle'],
                'title': product['title'],
                'description': product['description'],
                'description_html': description_html,
                'sku': sku,
                'price': {
                    'regular': float(str(product['price']['regular']).replace('£', '').replace(',', '') or '0'),
                    'sale': float(str(product['price'].get('sale', 0)).replace('£', '').replace(',', '') or '0') if product['price'].get('sale') else None,
                    'on_sale': product['price'].get('on_sale', False),
                    'discount_percent': product['price'].get('discount_percent', 0),
                    'currency': 'GBP'
                },
                'category': category,
                'brands': brands,
                'primary_brand': brands[0] if brands else 'Unknown',
                'tags': self.generate_enhanced_tags(product, brands, category, is_combo),
                'images': images,
                'is_combo': is_combo,
                'featured': product.get('featured', False),
                'popularity': product.get('popularity', 0),
                'created_at': product.get('created_at'),
                'updated_at': datetime.now().isoformat(),
                'status': 'active',
                'seo': {
                    'title': f"{product['title']} | Premium Fragrances",
                    'description': f"Shop {product['title']} - {', '.join(brands[:2])}. Premium fragrances with fast UK delivery.",
                    'keywords': brands + [category.lower(), 'perfume', 'fragrance', 'uk']
                }
            }
            
            # Atualizar estatísticas
            if images['main']:
                self.stats['with_images'] += 1
            if is_combo:
                self.stats['combos'] += 1
            else:
                self.stats['single_products'] += 1
            if category != self.category_mapping['default']:
                self.stats['categorized'] += 1
            if unified_product['primary_brand'] != 'Unknown':
                self.stats['brands_identified'] += 1
            
            self.unified_products.append(unified_product)

    def create_description_html(self, product: Dict, brands: List[str], is_combo: bool) -> str:
        """Cria descrição HTML enriquecida"""
        if is_combo:
            brand_list = ', '.join(brands[:-1]) + f' and {brands[-1]}' if len(brands) > 1 else brands[0]
            description = f"""
            <div class="product-description">
                <h3>Luxury Fragrance Set</h3>
                <p>This exclusive fragrance collection features premium scents from <strong>{brand_list}</strong>.</p>
                <ul>
                    <li>✨ Premium quality fragrances</li>
                    <li>🎁 Perfect for gifting</li>
                    <li>🚚 Fast UK delivery</li>
                    <li>💝 Beautifully packaged</li>
                </ul>
                <p>Experience the luxury of multiple world-renowned fragrances in one convenient set.</p>
            </div>
            """
        else:
            description = f"""
            <div class="product-description">
                <h3>Premium Fragrance</h3>
                <p>Discover the captivating scent of <strong>{product['title']}</strong>.</p>
                <ul>
                    <li>✨ Authentic fragrance</li>
                    <li>🌟 Long-lasting scent</li>
                    <li>🚚 Fast UK delivery</li>
                    <li>💝 Gift-ready packaging</li>
                </ul>
            </div>
            """
        
        return description.strip()

    def generate_enhanced_tags(self, product: Dict, brands: List[str], category: str, is_combo: bool) -> List[str]:
        """Gera tags enriquecidas"""
        tags = set(product.get('tags', []))
        
        # Adicionar marcas
        tags.update(brands)
        
        # Adicionar categoria
        tags.add(category.lower().replace("'", ""))
        
        # Adicionar tipo
        if is_combo:
            tags.update(['combo', 'set', 'gift-set', 'collection'])
        else:
            tags.update(['single', 'fragrance'])
        
        # Adicionar tags de gênero
        title_lower = product['title'].lower()
        if 'women' in title_lower or 'feminino' in title_lower:
            tags.update(['women', 'feminine', 'her'])
        elif 'men' in title_lower or 'masculino' in title_lower:
            tags.update(['men', 'masculine', 'him'])
        
        # Tags gerais
        tags.update(['perfume', 'fragrance', 'scent', 'uk', 'authentic'])
        
        return sorted(list(tags))

    def generate_sku(self, handle: str, product_id: int) -> str:
        """Gera SKU único"""
        # Usar hash do handle + ID para garantir unicidade
        handle_hash = hashlib.md5(handle.encode()).hexdigest()[:6].upper()
        return f"FRAG-{product_id:04d}-{handle_hash}"

    def save_unified_products(self):
        """Salva produtos unificados"""
        unified_data = {
            'products': self.unified_products,
            'metadata': {
                'total_count': len(self.unified_products),
                'generated_at': datetime.now().isoformat(),
                'statistics': self.stats
            }
        }
        
        with open(self.unified_products_file, 'w', encoding='utf-8') as f:
            json.dump(unified_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Produtos unificados salvos: {self.unified_products_file}")

    def save_shopify_products(self):
        """Salva produtos no formato Shopify"""
        shopify_products = []
        
        for unified_product in self.unified_products:
            shopify_product = self.create_shopify_product(unified_product)
            shopify_products.append(shopify_product)
        
        shopify_data = {
            'products': shopify_products,
            'metadata': {
                'total_count': len(shopify_products),
                'generated_at': datetime.now().isoformat(),
                'api_version': '2023-10',
                'format': 'shopify_products'
            }
        }
        
        with open(self.shopify_products_file, 'w', encoding='utf-8') as f:
            json.dump(shopify_data, f, indent=2, ensure_ascii=False)
        
        print(f"🛒 Produtos Shopify salvos: {self.shopify_products_file}")

    def print_statistics(self):
        """Exibe estatísticas do processamento"""
        print("\n" + "="*60)
        print("📊 ESTATÍSTICAS DO PROCESSAMENTO")
        print("="*60)
        print(f"📦 Total de produtos: {self.stats['total_products']}")
        print(f"🖼️  Com imagens: {self.stats['with_images']}")
        print(f"🎁 Combos: {self.stats['combos']}")
        print(f"🧴 Produtos únicos: {self.stats['single_products']}")
        print(f"🏷️  Categorizados: {self.stats['categorized']}")
        print(f"🏢 Marcas identificadas: {self.stats['brands_identified']}")
        print(f"\n📁 Arquivos gerados:")
        print(f"   • {self.unified_products_file}")
        print(f"   • {self.shopify_products_file}")

    def run(self):
        """Executa o processamento completo"""
        print("🚀 Iniciando processamento de produtos...")
        
        if not self.existing_products:
            print("❌ Nenhum produto encontrado!")
            return
        
        print(f"📦 Encontrados {len(self.existing_products)} produtos para processar")
        
        self.process_products()
        self.save_unified_products()
        self.save_shopify_products()
        self.print_statistics()
        
        print("\n✅ Processamento concluído com sucesso!")

def main():
    """Função principal"""
    try:
        manager = ProductManager()
        manager.run()
    except KeyboardInterrupt:
        print("\n❌ Operação interrompida pelo usuário.")
    except Exception as e:
        print(f"\n💥 Erro inesperado: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
