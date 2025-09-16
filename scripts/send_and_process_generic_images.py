#!/usr/bin/env python3
import json
import os
import re
import requests
import time
import shutil
from pathlib import Path
from typing import List, Set, Dict, Tuple
from datetime import datetime

"""
Script para enviar imagens genéricas para o n8n, aguardar as análises,
renomear as imagens na pasta public e gerar relatório das alterações
"""

def is_generic_name(filename: str) -> bool:
    """Verifica se o nome do arquivo é genérico"""
    generic_patterns = [
        r'^\d+pc-.*collection.*\.(png|jpg|jpeg|webp|avif)$',  # 3pc-premium-fragrance-collection-main.png
        r'^kit-of-\d+-fragrances.*\.(png|jpg|jpeg|webp|avif)$',  # kit-of-3-fragrances-1-main.png
        r'^fragrance-set.*\.(png|jpg|jpeg|webp|avif)$',  # fragrance-set-main.png
        r'^perfume-combo.*\.(png|jpg|jpeg|webp|avif)$',  # perfume-combo-main.png
        r'^gift-set.*\.(png|jpg|jpeg|webp|avif)$',  # gift-set-main.png
        r'^collection.*\.(png|jpg|jpeg|webp|avif)$',  # collection-main.png
        r'^bundle.*\.(png|jpg|jpeg|webp|avif)$',  # bundle-main.png
        r'^pack.*\.(png|jpg|jpeg|webp|avif)$',  # pack-main.png
        r'^set.*\.(png|jpg|jpeg|webp|avif)$',  # set-main.png
    ]
    
    filename_lower = filename.lower()
    
    for pattern in generic_patterns:
        if re.match(pattern, filename_lower):
            return True
    
    # Verificar se contém palavras genéricas
    generic_words = ['collection', 'kit', 'set', 'bundle', 'pack', 'combo', 'fragrance']
    
    # Se contém palavras genéricas mas não contém nomes de marcas específicas
    has_generic = any(word in filename_lower for word in generic_words)
    
    # Lista de marcas conhecidas para verificar se não é genérico
    known_brands = [
        'dior', 'chanel', 'versace', 'paco-rabanne', 'carolina-herrera', 
        'lancome', 'armani', 'calvin-klein', 'hugo-boss', 'yves-saint-laurent',
        'tom-ford', 'dolce-gabbana', 'burberry', 'gucci', 'prada', 'mugler',
        'giorgio-armani', 'jean-paul-gaultier', 'montblanc', 'moschino'
    ]
    
    has_brand = any(brand in filename_lower for brand in known_brands)
    
    return has_generic and not has_brand

def get_already_analyzed() -> Set[str]:
    """Obtém lista de arquivos já analisados"""
    analysis_dir = Path(__file__).parent.parent / 'data' / 'perfume-analysis'
    analyzed = set()
    
    if not analysis_dir.exists():
        return analyzed
    
    for json_file in analysis_dir.glob('*.json'):
        if json_file.name == 'index.json':
            continue
            
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            original_filename = data.get('filename', '')
            if original_filename:
                analyzed.add(original_filename)
                
        except Exception as e:
            print(f"⚠️ Erro ao ler {json_file}: {e}")
    
    return analyzed

def find_generic_images() -> List[Path]:
    """Encontra imagens com nomes genéricos que ainda não foram analisadas"""
    base_dir = Path(__file__).parent.parent
    
    # Procurar em múltiplos diretórios
    search_dirs = [
        base_dir / 'public' / 'images' / 'products' / 'combos' / 'main',
        base_dir / 'public' / 'images' / 'products' / 'fotos_shopify'
    ]
    
    already_analyzed = get_already_analyzed()
    generic_images = []
    
    for images_dir in search_dirs:
        if not images_dir.exists():
            print(f"⚠️ Diretório não encontrado: {images_dir}")
            continue
            
        for ext in ['*.png', '*.jpg', '*.jpeg', '*.avif', '*.webp']:
            for img_file in images_dir.glob(ext):
                if is_generic_name(img_file.name) and img_file.name not in already_analyzed:
                    generic_images.append(img_file)
    
    return generic_images

def send_to_webhook(image_path: Path, webhook_url: str) -> dict:
    """Envia uma imagem para o webhook n8n"""
    try:
        with open(image_path, 'rb') as f:
            files = {'image': (image_path.name, f, 'image/png')}
            response = requests.post(webhook_url, files=files, timeout=30)
            
        # Log do payload de resposta do n8n
        print(f"📋 Resposta do n8n para {image_path.name}:")
        print(f"   Status: {response.status_code}")
        print(f"   Payload: {response.text[:500]}{'...' if len(response.text) > 500 else ''}")
        print("---")
            
        return {
            'filename': image_path.name,
            'status_code': response.status_code,
            'success': response.status_code == 200,
            'response': response.text,
            'timestamp': response.headers.get('date', '')
        }
        
    except Exception as e:
        return {
            'filename': image_path.name,
            'status_code': 0,
            'success': False,
            'response': str(e),
            'timestamp': ''
        }

def parse_n8n_response(response_text: str, filename: str) -> Dict:
    """Processa a resposta do n8n e extrai informações dos perfumes"""
    try:
        lines = response_text.strip().split('\n')
        
        main_product = None
        secondary_products = []
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('---') or line.startswith('Certainly') or line.startswith('Sure'):
                continue
                
            if line.startswith('MAIN:'):
                current_section = 'main'
                continue
            elif line.startswith('SECONDARY:'):
                current_section = 'secondary'
                continue
            elif line.startswith(('1.', '2.', '3.', '4.', '5.')):
                if current_section == 'secondary':
                    # Extrair nome do produto da linha numerada
                    product_line = line.split('.', 1)[1].strip()
                    
                    # Remover "Not visible" e produtos inválidos
                    if 'not visible' in product_line.lower() or '[not visible]' in product_line.lower():
                        continue
                        
                    if ' - ' in product_line:
                        name, brand = product_line.split(' - ', 1)
                        name = name.strip()
                        brand = brand.strip()
                        
                        # Filtrar produtos válidos
                        if name and brand and name.lower() != 'not visible' and brand.lower() != 'not visible':
                            secondary_products.append({
                                'original_name': f"{name} - {brand}",
                                'mapped_name': f"{name} - {brand}"
                            })
                continue
            
            # Se estamos na seção main e a linha contém ' - '
            if current_section == 'main' and ' - ' in line:
                # Remover "Not visible" e produtos inválidos
                if 'not visible' in line.lower() or '[not visible]' in line.lower():
                    continue
                    
                name, brand = line.split(' - ', 1)
                name = name.strip()
                brand = brand.strip()
                
                # Filtrar produtos válidos
                if name and brand and name.lower() != 'not visible' and brand.lower() != 'not visible':
                    main_product = {
                        'original_name': f"{name} - {brand}",
                        'mapped_name': f"{name} - {brand}"
                    }
        
        # Se não encontrou produto principal, usar o primeiro secundário válido
        if not main_product and secondary_products:
            main_product = secondary_products[0]
        
        # Estrutura similar ao que vem dos arquivos JSON
        return {
            'filename': filename,
            'principal_product': main_product or {},
            'products': [main_product] + secondary_products if main_product else secondary_products,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"⚠️ Erro ao processar resposta do n8n: {e}")
        return {}

def generate_new_filename(analysis_data: Dict) -> str:
    """Gera novo nome de arquivo baseado na análise"""
    principal_product = analysis_data.get('principal_product', {})
    
    if not principal_product:
        return None
        
    # Usar o nome mapeado se disponível, senão o original
    product_name = principal_product.get('mapped_name') or principal_product.get('original_name', '')
    
    if not product_name or 'not visible' in product_name.lower():
        return None
    
    # Limpar e formatar o nome
    # Remover " - " e substituir por "---"
    clean_name = product_name.replace(' - ', '---')
    
    # Remover caracteres especiais, manter apenas letras, números, hífens e espaços
    clean_name = re.sub(r'[^a-zA-Z0-9\s\-]', '', clean_name)
    
    # Substituir espaços por hífens
    clean_name = re.sub(r'\s+', '-', clean_name.strip())
    
    # Converter para minúsculas
    clean_name = clean_name.lower()
    
    # Manter a extensão original
    original_filename = analysis_data.get('filename', '')
    if '.' in original_filename:
        extension = original_filename.split('.')[-1]
        return f"{clean_name}-main.{extension}"
    
    return f"{clean_name}-main.png"

def rename_image_file(original_path: Path, new_filename: str) -> Tuple[bool, str, str]:
    """Renomeia o arquivo de imagem"""
    try:
        new_path = original_path.parent / new_filename
        
        # Verificar se já existe um arquivo com o novo nome
        if new_path.exists():
            # Adicionar sufixo numérico
            base_name = new_filename.rsplit('.', 1)[0]
            extension = new_filename.rsplit('.', 1)[1] if '.' in new_filename else 'png'
            counter = 1
            
            while new_path.exists():
                new_filename = f"{base_name}-{counter}.{extension}"
                new_path = original_path.parent / new_filename
                counter += 1
        
        # Renomear o arquivo
        shutil.move(str(original_path), str(new_path))
        
        return True, str(original_path), str(new_path)
        
    except Exception as e:
        return False, str(original_path), f"Erro: {e}"

def main():
    webhook_url = 'https://n8n.landcriativa.com/webhook/6734330d-7878-4c37-a1a1-9c77d422732e'
    
    print("🔍 Procurando imagens com nomes genéricos...")
    generic_images = find_generic_images()
    
    if not generic_images:
        print("✅ Nenhuma imagem genérica encontrada para processar")
        return 0
    
    print(f"📋 Encontradas {len(generic_images)} imagens genéricas:")
    for img in generic_images:
        print(f"  - {img.name} ({img.parent.name})")
    
    print(f"\n🚀 Enviando {len(generic_images)} imagens para o n8n...")
    
    send_results = []
    rename_results = []
    successful_sends = 0
    failed_sends = 0
    successful_renames = 0
    failed_renames = 0
    
    for i, image_path in enumerate(generic_images, 1):
        print(f"\n📤 [{i}/{len(generic_images)}] Processando {image_path.name}...")
        
        # 1. Enviar para webhook
        send_result = send_to_webhook(image_path, webhook_url)
        send_results.append(send_result)
        
        if send_result['success']:
            print(f"✅ Enviado - Status: {send_result['status_code']}")
            successful_sends += 1
            
            # 2. Processar resposta diretamente
            analysis_data = parse_n8n_response(send_result['response'], image_path.name)
            
            if analysis_data and analysis_data.get('principal_product'):
                # 3. Gerar novo nome
                new_filename = generate_new_filename(analysis_data)
                
                if new_filename:
                    # 4. Renomear arquivo
                    rename_success, old_path, new_path = rename_image_file(image_path, new_filename)
                    
                    rename_result = {
                        'original_filename': image_path.name,
                        'new_filename': new_filename,
                        'old_path': old_path,
                        'new_path': new_path,
                        'success': rename_success,
                        'principal_product': analysis_data.get('principal_product', {}),
                        'all_products': analysis_data.get('products', [])
                    }
                    
                    rename_results.append(rename_result)
                    
                    if rename_success:
                        print(f"✅ Renomeado: {image_path.name} → {new_filename}")
                        successful_renames += 1
                    else:
                        print(f"❌ Erro ao renomear: {new_path}")
                        failed_renames += 1
                else:
                    print(f"⚠️ Não foi possível gerar novo nome para {image_path.name} - produto não visível")
                    failed_renames += 1
            else:
                print(f"⚠️ Não foi possível processar análise para {image_path.name} - resposta inválida")
                failed_renames += 1
        else:
            print(f"❌ Falha no envio: {send_result['response']}")
            failed_sends += 1
    
    # Gerar relatório final
    report = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_images': len(generic_images),
            'successful_sends': successful_sends,
            'failed_sends': failed_sends,
            'successful_renames': successful_renames,
            'failed_renames': failed_renames
        },
        'send_results': send_results,
        'rename_results': rename_results
    }
    
    report_path = Path(__file__).parent / 'generic_images_processing_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n📊 Relatório completo salvo em: {report_path}")
    print(f"\n📈 Resumo:")
    print(f"  📤 Enviadas: {successful_sends}/{len(generic_images)}")
    print(f"  🔄 Renomeadas: {successful_renames}/{len(generic_images)}")
    print(f"  ❌ Falhas: {failed_sends + failed_renames}")
    
    if rename_results:
        print(f"\n📝 Imagens renomeadas com sucesso:")
        for result in rename_results:
            if result['success']:
                old_name = result['original_filename']
                new_name = result['new_filename']
                principal = result['principal_product']
                print(f"  - {old_name} → {new_name}")
                print(f"    Produto principal: {principal.get('mapped_name', principal.get('original_name', 'N/A'))}")
    
    return 0 if (failed_sends + failed_renames) == 0 else 1

if __name__ == '__main__':
    exit(main())