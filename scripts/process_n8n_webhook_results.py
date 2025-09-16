#!/usr/bin/env python3
import json
import os
import re
import shutil
import time
from pathlib import Path
from typing import List, Set, Dict, Tuple
from datetime import datetime

"""
Script para processar os resultados do webhook n8n e renomear as imagens
baseado nas análises recebidas na pasta data/perfume-analysis
"""

def get_analysis_files() -> List[Path]:
    """Obtém lista de arquivos JSON de análise do n8n"""
    analysis_dir = Path(__file__).parent.parent / 'data' / 'perfume-analysis'
    
    if not analysis_dir.exists():
        print(f"⚠️ Pasta de análises não encontrada: {analysis_dir}")
        return []
    
    json_files = []
    for json_file in analysis_dir.glob('*.json'):
        if json_file.name != 'index.json':
            json_files.append(json_file)
    
    return json_files

def load_analysis_data(json_file: Path) -> Dict:
    """Carrega dados de análise de um arquivo JSON"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"⚠️ Erro ao ler {json_file}: {e}")
        return {}

def find_image_file(filename: str) -> Path:
    """Encontra o arquivo de imagem correspondente"""
    base_dir = Path(__file__).parent.parent
    
    # Procurar em múltiplos diretórios
    search_dirs = [
        base_dir / 'public' / 'images' / 'products' / 'combos' / 'main',
        base_dir / 'public' / 'images' / 'products' / 'fotos_shopify'
    ]
    
    for images_dir in search_dirs:
        if not images_dir.exists():
            continue
            
        image_path = images_dir / filename
        if image_path.exists():
            return image_path
    
    return None

def generate_new_filename(analysis_data: Dict) -> str:
    """Gera novo nome de arquivo baseado na análise do n8n"""
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

def process_analysis_results():
    """Processa todos os resultados de análise do n8n"""
    print("🔍 Procurando arquivos de análise do n8n...")
    
    analysis_files = get_analysis_files()
    
    if not analysis_files:
        print("✅ Nenhum arquivo de análise encontrado para processar")
        return 0
    
    print(f"📋 Encontrados {len(analysis_files)} arquivos de análise:")
    for file in analysis_files:
        print(f"  - {file.name}")
    
    rename_results = []
    successful_renames = 0
    failed_renames = 0
    
    for analysis_file in analysis_files:
        print(f"\n📤 Processando {analysis_file.name}...")
        
        # 1. Carregar dados de análise
        analysis_data = load_analysis_data(analysis_file)
        
        if not analysis_data:
            print(f"⚠️ Dados de análise inválidos em {analysis_file.name}")
            failed_renames += 1
            continue
        
        # 2. Encontrar arquivo de imagem original
        original_filename = analysis_data.get('filename', '')
        if not original_filename:
            print(f"⚠️ Nome de arquivo original não encontrado em {analysis_file.name}")
            failed_renames += 1
            continue
        
        image_path = find_image_file(original_filename)
        if not image_path:
            print(f"⚠️ Arquivo de imagem não encontrado: {original_filename}")
            failed_renames += 1
            continue
        
        # 3. Gerar novo nome baseado na análise
        new_filename = generate_new_filename(analysis_data)
        
        if not new_filename:
            print(f"⚠️ Não foi possível gerar novo nome para {original_filename} - produto não visível")
            failed_renames += 1
            continue
        
        # 4. Renomear arquivo
        rename_success, old_path, new_path = rename_image_file(image_path, new_filename)
        
        rename_result = {
            'analysis_file': analysis_file.name,
            'original_filename': original_filename,
            'new_filename': new_filename,
            'old_path': old_path,
            'new_path': new_path,
            'success': rename_success,
            'principal_product': analysis_data.get('principal_product', {}),
            'all_products': analysis_data.get('products', [])
        }
        
        rename_results.append(rename_result)
        
        if rename_success:
            print(f"✅ Renomeado: {original_filename} → {new_filename}")
            successful_renames += 1
        else:
            print(f"❌ Erro ao renomear: {new_path}")
            failed_renames += 1
    
    # Gerar relatório final
    report = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_analysis_files': len(analysis_files),
            'successful_renames': successful_renames,
            'failed_renames': failed_renames
        },
        'rename_results': rename_results
    }
    
    report_path = Path(__file__).parent / 'n8n_webhook_processing_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n📊 Relatório completo salvo em: {report_path}")
    print(f"\n📈 Resumo:")
    print(f"  📁 Arquivos de análise: {len(analysis_files)}")
    print(f"  🔄 Renomeadas: {successful_renames}")
    print(f"  ❌ Falhas: {failed_renames}")
    
    if rename_results:
        print(f"\n📝 Imagens renomeadas com sucesso:")
        for result in rename_results:
            if result['success']:
                old_name = result['original_filename']
                new_name = result['new_filename']
                principal = result['principal_product']
                print(f"  - {old_name} → {new_name}")
                print(f"    Produto principal: {principal.get('mapped_name', principal.get('original_name', 'N/A'))}")
    
    return 0 if failed_renames == 0 else 1

def watch_for_new_analyses(interval_seconds: int = 30):
    """Monitora continuamente por novos arquivos de análise"""
    print(f"👀 Monitorando pasta de análises a cada {interval_seconds} segundos...")
    print("   Pressione Ctrl+C para parar")
    
    processed_files = set()
    
    try:
        while True:
            analysis_files = get_analysis_files()
            new_files = [f for f in analysis_files if f.name not in processed_files]
            
            if new_files:
                print(f"\n🆕 Encontrados {len(new_files)} novos arquivos de análise!")
                
                for new_file in new_files:
                    print(f"📤 Processando {new_file.name}...")
                    
                    analysis_data = load_analysis_data(new_file)
                    if analysis_data:
                        original_filename = analysis_data.get('filename', '')
                        if original_filename:
                            image_path = find_image_file(original_filename)
                            if image_path:
                                new_filename = generate_new_filename(analysis_data)
                                if new_filename:
                                    rename_success, old_path, new_path = rename_image_file(image_path, new_filename)
                                    if rename_success:
                                        print(f"✅ {original_filename} → {new_filename}")
                                    else:
                                        print(f"❌ Erro ao renomear: {new_path}")
                    
                    processed_files.add(new_file.name)
            
            time.sleep(interval_seconds)
            
    except KeyboardInterrupt:
        print("\n🛑 Monitoramento interrompido pelo usuário")

def main():
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--watch':
        # Modo de monitoramento contínuo
        watch_for_new_analyses()
    else:
        # Processamento único dos arquivos existentes
        return process_analysis_results()

if __name__ == '__main__':
    exit(main())