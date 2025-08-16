#!/usr/bin/env python3
"""
🚀 Run Scraper - Script principal para executar todo o processo
"""

import os
import sys
from pathlib import Path

# Adicionar diretório de scripts ao path
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from perfume_scraper import PerfumeScraper
from simple_product_manager import SimpleProductManager
import json
import time

def main():
    """Executar processo completo de scraping e organização"""
    print("🚀 Perfume Project - Complete Scraper")
    print("=" * 60)
    
    base_dir = "C:/Users/gusta/Códigos/perfumes"
    
    # 1. Executar scraper básico
    print("\n🔍 STEP 1: Scraping products from HTML files...")
    scraper = PerfumeScraper(base_dir)
    
    html_files = [
        r"C:\Users\gusta\Códigos\perfumes\produtosColeçãoparasrapping.html",
        r"C:\Users\gusta\Códigos\perfumes\colectionClonar.html"
    ]
    
    all_products = []
    
    for html_file in html_files:
        if os.path.exists(html_file):
            products = scraper.scrape_products_from_html(html_file)
            all_products.extend(products)
            print(f"✅ {len(products)} products from {os.path.basename(html_file)}")
        else:
            print(f"❌ File not found: {html_file}")
    
    if not all_products:
        print("❌ No products found! Exiting...")
        return
    
    # Remover duplicatas
    unique_products = []
    seen_handles = set()
    
    for product in all_products:
        if product.handle not in seen_handles:
            unique_products.append(product)
            seen_handles.add(product.handle)
    
    print(f"🔄 Removed {len(all_products) - len(unique_products)} duplicates")
    print(f"📦 Total unique products: {len(unique_products)}")
    
    # 2. Salvar dados temporários
    print("\n💾 STEP 2: Saving scraped data...")
    scraper.save_products_json(unique_products, "scraped_products.json")
    
    # 3. Inicializar sistema de produtos simples
    print("\n📦 STEP 3: Setting up simple product management...")
    manager = SimpleProductManager(base_dir)
    
    # 4. Importar produtos
    print("\n📥 STEP 4: Importing products to simple system...")
    
    # Converter produtos para formato simples
    simple_products = []
    for product in unique_products:
        # Extrair slug do handle
        slug = product.handle.replace('_', '-').lower()
        
        simple_product = {
            "id": product.id,
            "handle": product.handle,
            "title": product.title,
            "description": product.description,
            "brand": product.brand,
            "category": product.category,
            "tags": product.tags,
            "slug": slug,
            "price": {
                "regular": product.price.regular,
                "sale": product.price.sale,
                "currency": product.price.currency,
                "discount_percent": product.price.discount_percent,
                "on_sale": product.price.discount_percent > 0
            },
            "images": [
                {
                    "filename": img.filename,
                    "alt": img.alt,
                    "width": img.width,
                    "height": img.height,
                    "url": f"/images/products/{img.filename}",
                    "optimized": f"/images/products/optimized/{Path(img.filename).stem}_opt.webp"
                }
                for img in product.images
            ],
            "variants": [{
                "id": "default",
                "title": "Standard Size",
                "size": "100ml",
                "price": product.price.regular,
                "available": True,
                "sku": product.handle,
                "stock": 100
            }],
            "status": "active",
            "featured": False,
            "new_arrival": False,
            "bestseller": False
        }
        simple_products.append(simple_product)
    
    # Importar em lote
    imported_count = manager.bulk_import_products(simple_products)
    print(f"✅ {imported_count} products imported successfully!")
    
    # 5. Gerar dados para frontend
    print("\n🎨 STEP 5: Generating frontend data...")
    frontend_data = manager.export_for_frontend()
    
    # Salvar dados do frontend
    frontend_file = Path(base_dir) / "frontend" / "src" / "data" / "products.json"
    frontend_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(frontend_file, 'w', encoding='utf-8') as f:
        json.dump(frontend_data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Frontend data saved: {frontend_file}")
    
    # 6. Gerar dados para Shopify
    print("\n🛍️ STEP 6: Generating Shopify sync data...")
    shopify_data = manager.export_for_shopify()
    
    shopify_file = Path(base_dir) / "data" / "shopify_products.json"
    with open(shopify_file, 'w', encoding='utf-8') as f:
        json.dump({"products": shopify_data}, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Shopify data saved: {shopify_file}")
    
    # 7. Download de imagens (opcional)
    download_images = input("\n📥 Download product images? (y/N): ").lower().strip()
    if download_images in ['y', 'yes', 's', 'sim']:
        print("📥 Downloading images...")
        scraper.download_all_images(unique_products)
        
        # Copiar imagens para frontend
        import shutil
        source_dir = Path(base_dir) / "public" / "images" / "products"
        target_dir = Path(base_dir) / "frontend" / "public" / "images" / "products"
        
        if source_dir.exists():
            target_dir.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(source_dir, target_dir, dirs_exist_ok=True)
            print(f"📁 Images copied to frontend: {target_dir}")
    
    # 8. Estatísticas finais
    print("\n📊 FINAL STATISTICS")
    print("=" * 60)
    
    stats = manager.get_statistics()
    print(f"📦 Total products: {stats['total_products']}")
    print(f"💰 Average price: £{stats['average_price']}")
    print(f"🏷️ Products on sale: {stats['on_sale_percentage']}%")
    
    print("\n📂 Categories:")
    for cat, count in stats['categories'].items():
        print(f"  {cat}: {count}")
    
    print("\n🏷️ Top brands:")
    for brand, count in list(stats['brands'].items())[:10]:
        print(f"  {brand}: {count}")
    
    print("\n✅ PROCESS COMPLETED SUCCESSFULLY!")
    print("📁 Check the following directories:")
    print(f"  - Data: {Path(base_dir) / 'data'}")
    print(f"  - Frontend: {Path(base_dir) / 'frontend' / 'src' / 'data'}")
    print(f"  - Images: {Path(base_dir) / 'frontend' / 'public' / 'images' / 'products'}")

if __name__ == "__main__":
    main()
