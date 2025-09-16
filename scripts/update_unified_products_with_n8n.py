#!/usr/bin/env python3
"""
Script para atualizar unified_products.json com produtos identificados pelo n8n
Cria um novo arquivo sem danificar o original
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any
import re

def load_json_file(file_path: str) -> Dict:
    """Carrega arquivo JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Erro ao carregar {file_path}: {e}")
        return {}

def clean_product_name(name: str) -> str:
    """Limpa nome do produto para comparação"""
    if not name:
        return ""
    
    # Remove caracteres especiais e normaliza
    cleaned = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Remove palavras comuns
    stop_words = ['eau', 'de', 'parfum', 'toilette', 'cologne', 'edt', 'edp', 'the', 'le', 'la']
    words = [w for w in cleaned.split() if w not in stop_words]
    
    return ' '.join(words)

def extract_products_from_n8n_report(report_path: str) -> List[Dict]:
    """Extrai produtos identificados do relatório n8n"""
    report = load_json_file(report_path)
    if not report or 'results' not in report:
        return []
    
    products = []
    for result in report['results']:
        if not result.get('success'):
            continue
            
        # Extrair produtos da resposta raw
        raw_response = result.get('raw_response', '')
        if not raw_response:
            continue
            
        # Parse da resposta para extrair produtos
        lines = raw_response.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line.startswith('MAIN:'):
                current_section = 'main'
                continue
            elif line.startswith('SECONDARY:'):
                current_section = 'secondary'
                continue
            elif line and current_section:
                # Extrair produto da linha
                if ' - ' in line:
                    parts = line.split(' - ', 1)
                    if len(parts) == 2:
                        product_name = parts[0].strip()
                        brand_name = parts[1].strip()
                        
                        if 'not visible' not in product_name.lower() and 'not visible' not in brand_name.lower():
                            products.append({
                                'name': product_name,
                                'brand': brand_name,
                                'full_name': f"{product_name} - {brand_name}",
                                'image_file': result.get('new_filename', result.get('original_filename', '')),
                                'section': current_section
                            })
    
    return products

def find_matching_product(n8n_product: Dict, unified_products: List[Dict]) -> Dict:
    """Encontra produto correspondente no unified_products"""
    n8n_clean = clean_product_name(n8n_product['name'])
    n8n_brand_clean = clean_product_name(n8n_product['brand'])
    
    best_match = None
    best_score = 0
    
    for product in unified_products:
        # Verificar título do produto
        title_clean = clean_product_name(product.get('title', ''))
        
        # Verificar brands
        product_brands = product.get('brands', [])
        primary_brand = product.get('primary_brand', '')
        
        # Score baseado em correspondência de nome
        name_score = 0
        if n8n_clean in title_clean or title_clean in n8n_clean:
            name_score = 0.8
        elif any(word in title_clean for word in n8n_clean.split()):
            name_score = 0.4
        
        # Score baseado em correspondência de marca
        brand_score = 0
        if n8n_brand_clean in [clean_product_name(b) for b in product_brands]:
            brand_score = 0.8
        elif n8n_brand_clean == clean_product_name(primary_brand):
            brand_score = 0.8
        elif any(n8n_brand_clean in clean_product_name(b) for b in product_brands):
            brand_score = 0.4
        
        total_score = name_score + brand_score
        
        if total_score > best_score and total_score > 0.5:
            best_score = total_score
            best_match = product
    
    return best_match

def update_product_with_n8n_data(product: Dict, n8n_products: List[Dict]) -> Dict:
    """Atualiza produto com dados do n8n"""
    updated_product = product.copy()
    
    # Encontrar produtos n8n correspondentes
    matching_n8n = []
    for n8n_prod in n8n_products:
        if find_matching_product(n8n_prod, [product]):
            matching_n8n.append(n8n_prod)
    
    if matching_n8n:
        # Atualizar imagem principal se houver correspondência
        main_image = None
        for n8n_prod in matching_n8n:
            if n8n_prod['section'] == 'main' and n8n_prod['image_file']:
                main_image = f"/images/products/combos/main/{n8n_prod['image_file']}"
                break
        
        if not main_image and matching_n8n[0]['image_file']:
            main_image = f"/images/products/combos/main/{matching_n8n[0]['image_file']}"
        
        if main_image:
            updated_product['images']['main'] = [main_image]
        
        # Adicionar metadados n8n
        updated_product['n8n_analysis'] = {
            'analyzed': True,
            'products_identified': len(matching_n8n),
            'analysis_date': datetime.now().isoformat(),
            'identified_products': [{
                'name': p['name'],
                'brand': p['brand'],
                'section': p['section']
            } for p in matching_n8n]
        }
    
    return updated_product

def main():
    """Função principal"""
    print("🔄 Iniciando atualização do unified_products.json com dados do n8n...")
    
    # Caminhos dos arquivos
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    unified_products_path = os.path.join(base_dir, 'data', 'unified_products.json')
    n8n_report_path = os.path.join(os.path.dirname(__file__), 'image_formatting_report.json')
    output_path = os.path.join(base_dir, 'data', 'unified_products_updated.json')
    
    # Carregar dados
    print("📂 Carregando unified_products.json...")
    unified_data = load_json_file(unified_products_path)
    if not unified_data:
        print("❌ Erro ao carregar unified_products.json")
        return
    
    print("📂 Carregando relatório n8n...")
    n8n_products = extract_products_from_n8n_report(n8n_report_path)
    if not n8n_products:
        print("❌ Nenhum produto encontrado no relatório n8n")
        return
    
    print(f"✅ Encontrados {len(n8n_products)} produtos no relatório n8n")
    
    # Processar produtos
    updated_products = []
    matches_found = 0
    
    for product in unified_data.get('products', []):
        updated_product = update_product_with_n8n_data(product, n8n_products)
        
        if 'n8n_analysis' in updated_product:
            matches_found += 1
            print(f"✅ Produto atualizado: {updated_product['title'][:50]}...")
        
        updated_products.append(updated_product)
    
    # Criar novo arquivo
    updated_data = unified_data.copy()
    updated_data['products'] = updated_products
    updated_data['metadata'] = {
        'last_updated': datetime.now().isoformat(),
        'n8n_integration': {
            'total_products': len(updated_products),
            'n8n_analyzed': matches_found,
            'analysis_date': datetime.now().isoformat()
        }
    }
    
    # Salvar arquivo atualizado
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Arquivo atualizado salvo em: {output_path}")
        print(f"📊 Resumo:")
        print(f"   - Total de produtos: {len(updated_products)}")
        print(f"   - Produtos analisados pelo n8n: {matches_found}")
        print(f"   - Produtos n8n identificados: {len(n8n_products)}")
        print(f"\n💡 O arquivo original unified_products.json não foi modificado.")
        print(f"💡 Para usar o novo arquivo, renomeie unified_products_updated.json para unified_products.json")
        
    except Exception as e:
        print(f"❌ Erro ao salvar arquivo: {e}")

if __name__ == "__main__":
    main()