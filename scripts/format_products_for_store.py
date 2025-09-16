#!/usr/bin/env python3
"""
Script para formatar produtos para padrões de loja
Corrige nomes, tags e coleções dos produtos criados
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Any

def load_json(file_path: str) -> Any:
    """Carrega arquivo JSON"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data: Any, file_path: str) -> None:
    """Salva dados em arquivo JSON"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def format_product_name(raw_name: str) -> str:
    """Formata nome do produto para padrão de loja"""
    # Remove hífens extras e underscores
    name = raw_name.replace('---', ' ').replace('__', ' + ').replace('-', ' ')
    
    # Capitaliza palavras importantes
    words = name.split()
    formatted_words = []
    
    for word in words:
        # Mantém algumas palavras em maiúsculo
        if word.upper() in ['VIP', 'EDT', 'EDP', 'EAU', 'DE', 'PARFUM', 'TOILETTE']:
            formatted_words.append(word.upper())
        # Capitaliza primeira letra de outras palavras
        elif len(word) > 1:
            formatted_words.append(word.capitalize())
        else:
            formatted_words.append(word.lower())
    
    return ' '.join(formatted_words)

def determine_gender_from_products(products: List[str]) -> str:
    """Determina gênero baseado nos produtos"""
    masculine_indicators = [
        'homme', 'men', 'masculin', 'pour homme', 'man', 'male',
        'sauvage', 'bleu', 'invictus', 'million', 'boss', 'armani code',
        'acqua di gio', 'eros', 'aventus', 'tobacco', 'santal'
    ]
    
    feminine_indicators = [
        'femme', 'women', 'woman', 'female', 'pour femme', 'lady',
        'coco', 'chanel n5', 'angel', 'hypnotic poison', 'flora',
        'olympea', 'scandal', 'good girl', 'portrait of a lady'
    ]
    
    masculine_count = 0
    feminine_count = 0
    
    for product in products:
        product_lower = product.lower()
        
        for indicator in masculine_indicators:
            if indicator in product_lower:
                masculine_count += 1
                break
        
        for indicator in feminine_indicators:
            if indicator in product_lower:
                feminine_count += 1
                break
    
    if masculine_count > feminine_count:
        return 'men'
    elif feminine_count > masculine_count:
        return 'women'
    else:
        return 'unisex'

def get_brand_from_product(product_name: str) -> str:
    """Extrai marca do nome do produto"""
    brand_mapping = {
        'chanel': 'Chanel',
        'dior': 'Dior',
        'paco rabanne': 'Paco Rabanne',
        'carolina herrera': 'Carolina Herrera',
        'giorgio armani': 'Giorgio Armani',
        'versace': 'Versace',
        'tom ford': 'Tom Ford',
        'creed': 'Creed',
        'le labo': 'Le Labo',
        'hugo boss': 'Hugo Boss',
        'yves saint laurent': 'Yves Saint Laurent',
        'gucci': 'Gucci',
        'mugler': 'Mugler',
        'marc jacobs': 'Marc Jacobs',
        'frederic malle': 'Frederic Malle',
        'kilian': 'Kilian',
        'prada': 'Prada',
        'issey miyake': 'Issey Miyake',
        'orientica': 'Orientica',
        'guerlain': 'Guerlain',
        'emporio armani': 'Emporio Armani',
        'jean paul gaultier': 'Jean Paul Gaultier',
        'jacques bogart': 'Jacques Bogart',
        'azzaro': 'Azzaro'
    }
    
    product_lower = product_name.lower()
    for brand_key, brand_name in brand_mapping.items():
        if brand_key in product_lower:
            return brand_name
    
    return 'Premium'

def format_product_for_store(product: Dict[str, Any]) -> Dict[str, Any]:
    """Formata produto para padrões de loja"""
    formatted_product = product.copy()
    
    # Extrai produtos da análise n8n
    main_products = product.get('n8n_analysis', {}).get('main_products', [])
    
    if not main_products:
        return formatted_product
    
    # Formata nomes dos produtos
    formatted_names = [format_product_name(name) for name in main_products]
    
    # Cria título legível
    if len(formatted_names) == 1:
        title = formatted_names[0]
    elif len(formatted_names) == 2:
        title = f"{formatted_names[0]} + {formatted_names[1]}"
    else:
        title = f"{formatted_names[0]} + {formatted_names[1]} + {formatted_names[2]}"
    
    formatted_product['title'] = title
    
    # Atualiza handle (URL-friendly)
    handle_parts = [name.lower().replace(' ', '-') for name in formatted_names[:3]]
    formatted_product['handle'] = '-'.join(handle_parts)
    
    # Determina gênero e atualiza tags
    gender = determine_gender_from_products(main_products)
    
    # Tags baseadas no gênero e características
    base_tags = ['gift-set', 'bestseller', 'premium', 'offers']
    
    if gender == 'men':
        base_tags.extend(['men', 'masculine'])
    elif gender == 'women':
        base_tags.extend(['women', 'feminine'])
    else:
        base_tags.extend(['unisex'])
    
    # Adiciona tags de marca
    brands = set()
    for product_name in main_products:
        brand = get_brand_from_product(product_name)
        if brand != 'Premium':
            brands.add(brand.lower().replace(' ', '-'))
    
    base_tags.extend(list(brands))
    formatted_product['tags'] = base_tags
    
    # Atualiza marcas
    brand_list = [get_brand_from_product(name) for name in main_products]
    unique_brands = list(set(brand_list))
    formatted_product['brands'] = unique_brands
    formatted_product['primary_brand'] = unique_brands[0] if unique_brands else 'Premium'
    
    # Atualiza descrição
    description_items = [f"• {name}" for name in formatted_names]
    formatted_product['description'] = f"Combo exclusivo contendo:\n\n" + "\n".join(description_items) + "\n\nProdutos de alta qualidade com fragrâncias marcantes e autênticas."
    
    # Atualiza SEO
    if 'seo' in formatted_product:
        formatted_product['seo']['title'] = title
        formatted_product['seo']['description'] = f"{title} - Fragrâncias premium com desconto especial"
        formatted_product['seo']['keywords'] = base_tags + [gender, 'fragrance', 'perfume', 'combo']
    
    # Atualiza timestamp
    formatted_product['updated_at'] = datetime.now().isoformat()
    
    return formatted_product

def main():
    """Função principal"""
    print("🚀 Iniciando formatação de produtos para loja...")
    
    # Caminhos dos arquivos
    input_path = "data/unified_products_new.json"
    output_path = "data/unified_products_formatted.json"
    report_path = "scripts/products_formatting_report.json"
    
    # Carrega produtos
    print("📂 Carregando produtos...")
    products_data = load_json(input_path)
    products_list = products_data.get('products', [])
    
    # Formata produtos
    formatted_products = []
    formatting_report = {
        "timestamp": datetime.now().isoformat(),
        "products_processed": 0,
        "products_formatted": 0,
        "gender_distribution": {"men": 0, "women": 0, "unisex": 0},
        "brands_found": set(),
        "details": []
    }
    
    print("🔨 Formatando produtos...")
    for product in products_list:
        try:
            formatted_product = format_product_for_store(product)
            formatted_products.append(formatted_product)
            
            # Determina gênero para estatísticas
            tags = formatted_product.get('tags', [])
            if 'men' in tags:
                formatting_report["gender_distribution"]["men"] += 1
            elif 'women' in tags:
                formatting_report["gender_distribution"]["women"] += 1
            else:
                formatting_report["gender_distribution"]["unisex"] += 1
            
            # Coleta marcas
            brands = formatted_product.get('brands', [])
            formatting_report["brands_found"].update(brands)
            
            # Adiciona ao relatório
            formatting_report["details"].append({
                "product_id": product.get('id'),
                "original_title": product.get('title', ''),
                "formatted_title": formatted_product.get('title', ''),
                "gender": 'men' if 'men' in tags else 'women' if 'women' in tags else 'unisex',
                "brands": brands,
                "tags_count": len(tags),
                "success": True
            })
            
            print(f"✅ Produto {product.get('id')} formatado: {formatted_product.get('title')}")
            formatting_report["products_formatted"] += 1
            
        except Exception as e:
            print(f"❌ Erro ao formatar produto {product.get('id', 'unknown')}: {str(e)}")
            formatting_report["details"].append({
                "product_id": product.get('id'),
                "error": str(e),
                "success": False
            })
        
        formatting_report["products_processed"] += 1
    
    # Converte set para list no relatório
    formatting_report["brands_found"] = list(formatting_report["brands_found"])
    
    # Salva produtos formatados
    print(f"💾 Salvando {len(formatted_products)} produtos formatados...")
    output_data = {"products": formatted_products}
    save_json(output_data, output_path)
    
    # Salva relatório
    save_json(formatting_report, report_path)
    
    print(f"\n📊 Resumo:")
    print(f"   • Produtos processados: {formatting_report['products_processed']}")
    print(f"   • Produtos formatados: {formatting_report['products_formatted']}")
    print(f"   • Masculinos: {formatting_report['gender_distribution']['men']}")
    print(f"   • Femininos: {formatting_report['gender_distribution']['women']}")
    print(f"   • Unissex: {formatting_report['gender_distribution']['unisex']}")
    print(f"   • Marcas encontradas: {len(formatting_report['brands_found'])}")
    print(f"   • Arquivo salvo: {output_path}")
    print(f"   • Relatório: {report_path}")
    print("\n✨ Formatação concluída com sucesso!")

if __name__ == "__main__":
    main()