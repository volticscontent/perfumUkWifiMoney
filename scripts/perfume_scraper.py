#!/usr/bin/env python3
"""
🧹 Perfume Collection Scraper
Scraper completo para extrair dados de produtos de perfumes e baixar imagens
"""

import os
import json
import requests
import time
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from pathlib import Path
import re
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import hashlib

@dataclass
class ProductImage:
    url: str
    alt: str
    width: int
    height: int
    filename: str
    local_path: str

@dataclass
class ProductPrice:
    regular: str
    sale: str
    currency: str = "GBP"

@dataclass
class Product:
    id: str
    handle: str
    title: str
    url: str
    price: ProductPrice
    images: List[ProductImage]
    brand: str
    description: str
    category: str
    tags: List[str]
    variants: List[Dict]

class PerfumeScraper:
    def __init__(self, base_dir: str = "C:/Users/gusta/Códigos/perfumes"):
        self.base_dir = Path(base_dir)
        self.public_dir = self.base_dir / "public" / "images" / "products"
        self.output_dir = self.base_dir / "scraped_data"
        
        # Criar diretórios se não existirem
        self.public_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Headers para requests
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def load_html_file(self, file_path: str) -> BeautifulSoup:
        """Carregar arquivo HTML local"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            return BeautifulSoup(content, 'html.parser')
        except Exception as e:
            print(f"❌ Erro ao carregar {file_path}: {e}")
            return None

    def extract_product_id(self, element) -> Optional[str]:
        """Extrair ID do produto"""
        # Procurar por product-id attribute
        product_id_elem = element.find(attrs={"product-id": True})
        if product_id_elem:
            return product_id_elem.get('product-id')
        
        # Procurar em links de produto
        link = element.find('a', href=True)
        if link:
            href = link.get('href', '')
            if '/products/' in href:
                return href.split('/')[-1]
        
        return None

    def extract_product_handle(self, element) -> Optional[str]:
        """Extrair handle do produto"""
        product_handle_elem = element.find(attrs={"product-handle": True})
        if product_handle_elem:
            return product_handle_elem.get('product-handle')
        
        link = element.find('a', href=True)
        if link:
            href = link.get('href', '')
            if '/products/' in href:
                return href.split('/')[-1]
        
        return None

    def extract_product_title(self, element) -> str:
        """Extrair título do produto"""
        title_selectors = [
            '.product-card__title',
            'a[href*="/products/"]',
            '.reversed-link'
        ]
        
        for selector in title_selectors:
            title_elem = element.select_one(selector)
            if title_elem:
                return title_elem.get_text(strip=True)
        
        return "Produto sem título"

    def extract_product_url(self, element) -> str:
        """Extrair URL do produto"""
        link = element.find('a', href=True)
        if link:
            return link.get('href')
        return ""

    def extract_product_prices(self, element) -> ProductPrice:
        """Extrair preços do produto"""
        price_container = element.find(class_='price')
        
        regular_price = ""
        sale_price = ""
        
        if price_container:
            # Preço regular
            regular_elem = price_container.find(class_='price__regular')
            if regular_elem:
                regular_price = regular_elem.get_text(strip=True)
            
            # Preço de promoção
            sale_elem = price_container.find(class_='price__sale')
            if sale_elem:
                sale_price = sale_elem.get_text(strip=True)
        
        return ProductPrice(
            regular=regular_price,
            sale=sale_price,
            currency="GBP"
        )

    def extract_product_images(self, element, product_handle: str) -> List[ProductImage]:
        """Extrair todas as imagens do produto"""
        images = []
        seen_urls = set()
        
        # Buscar todas as imagens
        img_elements = element.find_all('img')
        
        for i, img in enumerate(img_elements):
            src = img.get('src', '')
            srcset = img.get('srcset', '')
            alt = img.get('alt', '')
            width = int(img.get('width', 0) or 0)
            height = int(img.get('height', 0) or 0)
            
            # Processar URL da imagem
            if src and src not in seen_urls:
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://herenhuis.store' + src
                
                # Remover parâmetros de resize
                if '?' in src:
                    clean_url = src.split('?')[0]
                else:
                    clean_url = src
                
                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)
                    
                    # Gerar filename único
                    url_hash = hashlib.md5(clean_url.encode()).hexdigest()[:8]
                    file_ext = self.get_file_extension(clean_url)
                    filename = f"{product_handle}_{i+1}_{url_hash}{file_ext}"
                    local_path = str(self.public_dir / filename)
                    
                    images.append(ProductImage(
                        url=clean_url,
                        alt=alt,
                        width=width,
                        height=height,
                        filename=filename,
                        local_path=local_path
                    ))
        
        return images

    def get_file_extension(self, url: str) -> str:
        """Obter extensão do arquivo da URL"""
        parsed = urlparse(url)
        path = parsed.path.lower()
        
        if path.endswith('.jpg') or path.endswith('.jpeg'):
            return '.jpg'
        elif path.endswith('.png'):
            return '.png'
        elif path.endswith('.webp'):
            return '.webp'
        elif path.endswith('.avif'):
            return '.avif'
        else:
            return '.jpg'  # Default

    def extract_brand_from_title(self, title: str) -> str:
        """Extrair marca do título"""
        # Marcas conhecidas de perfume
        brands = [
            'Chanel', 'Dior', 'Paco Rabanne', 'Yves Saint Laurent', 'Giorgio Armani',
            'Jean Paul Gaultier', 'Carolina Herrera', 'Givenchy', 'Issey Miyake',
            'Creed', 'Louis Vuitton', 'Mugler', 'Thierry Mugler', 'Chloe', 'Chloé'
        ]
        
        title_lower = title.lower()
        
        for brand in brands:
            if brand.lower() in title_lower:
                return brand
        
        return "Unknown"

    def extract_category_from_title(self, title: str) -> str:
        """Extrair categoria do título"""
        title_lower = title.lower()
        
        if 'combo' in title_lower or 'collection' in title_lower:
            return "Gift Sets"
        elif 'body cream' in title_lower or 'lotion' in title_lower:
            return "Body Care"
        elif 'parfum' in title_lower or 'perfume' in title_lower:
            return "Perfumes"
        elif 'eau de toilette' in title_lower or 'edt' in title_lower:
            return "Eau de Toilette"
        else:
            return "Fragrances"

    def extract_tags_from_title(self, title: str) -> List[str]:
        """Extrair tags do título"""
        tags = []
        title_lower = title.lower()
        
        # Tags baseadas no conteúdo
        if any(word in title_lower for word in ['men', 'homme', 'masculine']):
            tags.append('mens-fragrance')
        if any(word in title_lower for word in ['women', 'femme', 'feminine']):
            tags.append('womens-fragrance')
        if any(word in title_lower for word in ['combo', 'collection']):
            tags.append('gift-set')
        if '100 ml' in title_lower:
            tags.append('100ml')
        if '50 ml' in title_lower:
            tags.append('50ml')
        if 'limited' in title_lower:
            tags.append('limited-edition')
        
        return tags

    def download_image(self, image: ProductImage, max_retries: int = 3) -> bool:
        """Baixar imagem para o diretório public"""
        for attempt in range(max_retries):
            try:
                print(f"📥 Baixando: {image.filename}")
                
                response = self.session.get(image.url, timeout=30)
                response.raise_for_status()
                
                # Salvar imagem
                with open(image.local_path, 'wb') as f:
                    f.write(response.content)
                
                print(f"✅ {image.filename} salva com sucesso")
                return True
                
            except Exception as e:
                print(f"❌ Erro no download {image.filename} (tentativa {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    
        return False

    def scrape_products_from_html(self, html_file: str) -> List[Product]:
        """Scraper principal para extrair produtos do HTML"""
        print(f"🔍 Analisando arquivo: {html_file}")
        
        soup = self.load_html_file(html_file)
        if not soup:
            return []
        
        products = []
        
        # Encontrar todos os cards de produto
        product_cards = soup.find_all('div', class_='product-card')
        
        print(f"📦 Encontrados {len(product_cards)} produtos")
        
        for i, card in enumerate(product_cards, 1):
            try:
                print(f"\\n🔍 Processando produto {i}/{len(product_cards)}")
                
                # Extrair dados básicos
                product_id = self.extract_product_id(card)
                handle = self.extract_product_handle(card)
                title = self.extract_product_title(card)
                url = self.extract_product_url(card)
                prices = self.extract_product_prices(card)
                
                if not handle:
                    print(f"⚠️ Produto sem handle, pulando...")
                    continue
                
                # Extrair imagens
                images = self.extract_product_images(card, handle)
                
                # Extrair metadados do título
                brand = self.extract_brand_from_title(title)
                category = self.extract_category_from_title(title)
                tags = self.extract_tags_from_title(title)
                
                # Criar produto
                product = Product(
                    id=product_id or handle,
                    handle=handle,
                    title=title,
                    url=url,
                    price=prices,
                    images=images,
                    brand=brand,
                    description=title,  # Usar título como descrição inicial
                    category=category,
                    tags=tags,
                    variants=[]  # Será preenchido depois se necessário
                )
                
                products.append(product)
                print(f"✅ {title[:50]}... processado")
                
            except Exception as e:
                print(f"❌ Erro ao processar produto {i}: {e}")
                continue
        
        return products

    def download_all_images(self, products: List[Product]) -> None:
        """Baixar todas as imagens dos produtos"""
        total_images = sum(len(p.images) for p in products)
        print(f"\\n📥 Iniciando download de {total_images} imagens...")
        
        downloaded = 0
        failed = 0
        
        for product in products:
            print(f"\\n📦 Baixando imagens para: {product.title[:50]}...")
            
            for image in product.images:
                if self.download_image(image):
                    downloaded += 1
                else:
                    failed += 1
                
                # Delay entre downloads
                time.sleep(1)
        
        print(f"\\n📊 Download concluído:")
        print(f"✅ Sucessos: {downloaded}")
        print(f"❌ Falhas: {failed}")

    def save_products_json(self, products: List[Product], filename: str = "products.json") -> None:
        """Salvar produtos em JSON"""
        output_file = self.output_dir / filename
        
        # Converter para dicionário
        products_dict = {
            "products": [asdict(product) for product in products],
            "total": len(products),
            "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(products_dict, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Produtos salvos em: {output_file}")

    def save_products_typescript(self, products: List[Product], filename: str = "products.ts") -> None:
        """Salvar produtos como arquivo TypeScript"""
        output_file = self.output_dir / filename
        
        # Gerar tipos TypeScript
        ts_content = f'''// 🤖 Auto-generated products data
// Generated at: {time.strftime("%Y-%m-%d %H:%M:%S")}

export interface ProductImage {{
  url: string
  alt: string
  width: number
  height: number
  filename: string
  localPath: string
}}

export interface ProductPrice {{
  regular: string
  sale: string
  currency: string
}}

export interface Product {{
  id: string
  handle: string
  title: string
  url: string
  price: ProductPrice
  images: ProductImage[]
  brand: string
  description: string
  category: string
  tags: string[]
  variants: any[]
}}

export const products: Product[] = {json.dumps([asdict(product) for product in products], indent=2, ensure_ascii=False)}

export const productsByCategory = {{
'''
        
        # Agrupar por categoria
        categories = {}
        for product in products:
            cat = product.category
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(asdict(product))
        
        for category, prods in categories.items():
            safe_cat = re.sub(r'[^a-zA-Z0-9]', '', category).lower()
            ts_content += f'  {safe_cat}: {json.dumps(prods, indent=4, ensure_ascii=False)},\\n'
        
        ts_content += '''
}

export const productsByBrand = {
'''
        
        # Agrupar por marca
        brands = {}
        for product in products:
            brand = product.brand
            if brand not in brands:
                brands[brand] = []
            brands[brand].append(asdict(product))
        
        for brand, prods in brands.items():
            safe_brand = re.sub(r'[^a-zA-Z0-9]', '', brand).lower()
            ts_content += f'  {safe_brand}: {json.dumps(prods, indent=4, ensure_ascii=False)},\\n'
        
        ts_content += '''
}

// Utility functions
export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id)
}

export const getProductsByBrand = (brand: string): Product[] => {
  return products.filter(p => p.brand.toLowerCase() === brand.toLowerCase())
}

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(p => p.category.toLowerCase() === category.toLowerCase())
}

export const searchProducts = (query: string): Product[] => {
  const q = query.toLowerCase()
  return products.filter(p => 
    p.title.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.tags.some(tag => tag.toLowerCase().includes(q))
  )
}
'''
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        
        print(f"📝 Arquivo TypeScript salvo em: {output_file}")

    def generate_summary_report(self, products: List[Product]) -> None:
        """Gerar relatório resumido"""
        print(f"\\n📊 RELATÓRIO DE SCRAPING")
        print(f"=" * 50)
        print(f"Total de produtos: {len(products)}")
        
        # Estatísticas por categoria
        categories = {}
        brands = {}
        total_images = 0
        
        for product in products:
            # Categorias
            cat = product.category
            categories[cat] = categories.get(cat, 0) + 1
            
            # Marcas
            brand = product.brand
            brands[brand] = brands.get(brand, 0) + 1
            
            # Imagens
            total_images += len(product.images)
        
        print(f"\\n📂 Por categoria:")
        for cat, count in sorted(categories.items()):
            print(f"  {cat}: {count}")
        
        print(f"\\n🏷️ Por marca:")
        for brand, count in sorted(brands.items()):
            print(f"  {brand}: {count}")
        
        print(f"\\n🖼️ Total de imagens: {total_images}")
        print(f"📁 Imagens salvas em: {self.public_dir}")
        print(f"💾 Dados salvos em: {self.output_dir}")

def main():
    """Função principal"""
    print("🧹 Perfume Collection Scraper v1.0")
    print("=" * 50)
    
    # Inicializar scraper
    scraper = PerfumeScraper()
    
    # Arquivos para processar
    html_files = [
        r"C:\Users\gusta\Códigos\perfumes\produtosColeçãoparasrapping.html",
        r"C:\Users\gusta\Códigos\perfumes\colectionClonar.html"
    ]
    
    all_products = []
    
    # Processar cada arquivo
    for html_file in html_files:
        if os.path.exists(html_file):
            products = scraper.scrape_products_from_html(html_file)
            all_products.extend(products)
            print(f"✅ {len(products)} produtos extraídos de {os.path.basename(html_file)}")
        else:
            print(f"❌ Arquivo não encontrado: {html_file}")
    
    if not all_products:
        print("❌ Nenhum produto encontrado!")
        return
    
    # Remover duplicatas baseado no handle
    unique_products = []
    seen_handles = set()
    
    for product in all_products:
        if product.handle not in seen_handles:
            unique_products.append(product)
            seen_handles.add(product.handle)
    
    print(f"\\n🔄 Removidas {len(all_products) - len(unique_products)} duplicatas")
    
    # Salvar dados
    scraper.save_products_json(unique_products)
    scraper.save_products_typescript(unique_products)
    
    # Baixar imagens
    download_images = input("\\n📥 Baixar todas as imagens? (y/N): ").lower().strip()
    if download_images in ['y', 'yes', 's', 'sim']:
        scraper.download_all_images(unique_products)
    
    # Gerar relatório
    scraper.generate_summary_report(unique_products)
    
    print("\\n✅ Scraping concluído com sucesso!")

if __name__ == "__main__":
    main()
