#!/usr/bin/env python3
"""
Script para criar novos produtos com imagens corretas
Mantém as configurações dos produtos existentes para não quebrar o site
"""

import json
import os
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

def list_available_images(images_dir: str) -> List[str]:
    """Lista todas as imagens disponíveis"""
    images = []
    for file in os.listdir(images_dir):
        if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            images.append(file)
    return sorted(images)

def clean_product_name(name: str) -> str:
    """Limpa nome do produto para comparação"""
    return name.lower().replace(' ', '-').replace('_', '-').replace('--', '-')

def extract_products_from_filename(filename: str) -> List[str]:
    """Extrai nomes de produtos do nome do arquivo"""
    # Remove extensão e sufixo -main
    base_name = filename.replace('-main.jpg', '').replace('-main.png', '').replace('-main.jpeg', '').replace('-main.webp', '')
    
    # Divide por duplo underscore
    products = base_name.split('__')
    
    # Limpa cada produto
    cleaned_products = []
    for product in products:
        if product.strip():
            cleaned_products.append(product.strip())
    
    return cleaned_products

def create_new_product_from_template(template_product: Dict[str, Any], new_id: int, image_filename: str, products_in_image: List[str]) -> Dict[str, Any]:
    """Cria novo produto baseado no template"""
    new_product = template_product.copy()
    
    # Atualiza ID
    new_product['id'] = new_id
    
    # Cria novo handle baseado nos produtos da imagem
    handle_parts = [clean_product_name(p) for p in products_in_image[:3]]  # Máximo 3 produtos
    new_handle = '-'.join(handle_parts)
    new_product['handle'] = new_handle
    
    # Atualiza título
    title_parts = products_in_image[:3]  # Máximo 3 produtos
    new_title = ' + '.join(title_parts)
    new_product['title'] = f"Combo {new_title}"
    
    # Atualiza descrição
    description_items = [f"• {product}" for product in products_in_image]
    new_description = f"Combo exclusivo contendo:\n\n" + "\n".join(description_items) + "\n\nProdutos de alta qualidade com fragrâncias marcantes."
    new_product['description'] = new_description
    
    # Atualiza imagens
    image_path = f"/images/products/combos/main/{image_filename}"
    new_product['images'] = {
        "main": [image_path],
        "gallery": [image_path],
        "individual_items": [image_path]
    }
    
    # Atualiza timestamps
    current_time = datetime.now().isoformat()
    new_product['created_at'] = current_time
    new_product['updated_at'] = current_time
    
    # Atualiza SEO
    if 'seo' in new_product:
        new_product['seo']['title'] = new_product['title']
        new_product['seo']['description'] = f"Combo {new_title} - Fragrâncias premium com desconto especial"
    
    # Atualiza análise n8n se existir
    if 'n8n_analysis' in new_product:
        new_product['n8n_analysis'] = {
            "analyzed": True,
            "products_identified": len(products_in_image),
            "main_products": products_in_image,
            "secondary_products": [],
            "confidence_score": 0.95,
            "analysis_date": current_time
        }
    
    return new_product

def main():
    """Função principal"""
    print("🚀 Iniciando criação de novos produtos com imagens corretas...")
    
    # Caminhos dos arquivos
    unified_products_path = "data/unified_products.json"
    images_dir = "public/images/products/combos/main"
    output_path = "data/unified_products_new.json"
    report_path = "scripts/new_products_creation_report.json"
    
    # Carrega dados existentes
    print("📂 Carregando dados existentes...")
    unified_data = load_json(unified_products_path)
    products_list = unified_data.get('products', []) if isinstance(unified_data, dict) else unified_data
    
    # Lista imagens disponíveis
    print("🖼️ Listando imagens disponíveis...")
    available_images = list_available_images(images_dir)
    print(f"Encontradas {len(available_images)} imagens")
    
    # Usa o primeiro produto como template
    template_product = products_list[0] if products_list else {}
    
    # Cria novos produtos
    new_products = []
    creation_report = {
        "timestamp": datetime.now().isoformat(),
        "template_product_id": template_product.get('id', 'unknown'),
        "images_processed": 0,
        "products_created": 0,
        "details": []
    }
    
    current_id = max([p.get('id', 0) for p in products_list]) + 1 if products_list else 1
    
    print("🔨 Criando novos produtos...")
    for image_filename in available_images:
        try:
            # Extrai produtos da imagem
            products_in_image = extract_products_from_filename(image_filename)
            
            if not products_in_image:
                print(f"⚠️ Não foi possível extrair produtos de: {image_filename}")
                continue
            
            # Cria novo produto
            new_product = create_new_product_from_template(
                template_product, 
                current_id, 
                image_filename, 
                products_in_image
            )
            
            new_products.append(new_product)
            
            # Adiciona ao relatório
            creation_report["details"].append({
                "image_filename": image_filename,
                "new_product_id": current_id,
                "new_handle": new_product['handle'],
                "products_identified": products_in_image,
                "success": True
            })
            
            print(f"✅ Produto {current_id} criado: {new_product['title']}")
            current_id += 1
            creation_report["products_created"] += 1
            
        except Exception as e:
            print(f"❌ Erro ao processar {image_filename}: {str(e)}")
            creation_report["details"].append({
                "image_filename": image_filename,
                "error": str(e),
                "success": False
            })
        
        creation_report["images_processed"] += 1
    
    # Salva novos produtos no formato correto
    print(f"💾 Salvando {len(new_products)} novos produtos...")
    output_data = {"products": new_products}
    save_json(output_data, output_path)
    
    # Salva relatório
    save_json(creation_report, report_path)
    
    print(f"\n📊 Resumo:")
    print(f"   • Imagens processadas: {creation_report['images_processed']}")
    print(f"   • Produtos criados: {creation_report['products_created']}")
    print(f"   • Arquivo salvo: {output_path}")
    print(f"   • Relatório: {report_path}")
    print("\n✨ Processo concluído com sucesso!")

if __name__ == "__main__":
    main()