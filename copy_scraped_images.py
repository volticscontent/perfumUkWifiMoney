import json
import shutil
from pathlib import Path
import os

def copy_scraped_images():
    # Carregar o relatório de imagens faltantes
    with open('missing_images_report.json', 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    missing_images = report['missing_images']
    
    # Pastas
    scraped_folder = Path('scraped_images')
    dest_folder = Path('public/images/products/combos/main')
    dest_folder.mkdir(parents=True, exist_ok=True)
    
    # Listar arquivos disponíveis na pasta scraped_images
    available_files = set()
    if scraped_folder.exists():
        for file in scraped_folder.glob('*'):
            if file.is_file():
                available_files.add(file.name)
    
    print(f"Arquivos disponíveis na pasta scraped_images: {len(available_files)}")
    print(f"Imagens faltantes para copiar: {len(missing_images)}")
    
    copied = 0
    already_exists = 0
    not_found = 0
    copy_report = []
    
    for img_info in missing_images:
        filename = img_info['missing_file']
        product_id = img_info['product_id']
        title = img_info['title']
        
        source_path = scraped_folder / filename
        dest_path = dest_folder / filename
        
        print(f"\nProduto ID {product_id}: {title[:50]}...")
        print(f"Arquivo: {filename}")
        
        # Verificar se já existe no destino
        if dest_path.exists():
            print(f"  ✓ Arquivo já existe no destino")
            already_exists += 1
            copy_report.append({
                'product_id': product_id,
                'filename': filename,
                'status': 'already_exists'
            })
            continue
        
        # Verificar se existe na pasta scraped_images
        if filename in available_files:
            try:
                shutil.copy2(source_path, dest_path)
                print(f"  ✓ Copiado com sucesso: {filename}")
                copied += 1
                copy_report.append({
                    'product_id': product_id,
                    'filename': filename,
                    'status': 'copied'
                })
            except Exception as e:
                print(f"  ✗ Erro ao copiar: {e}")
                copy_report.append({
                    'product_id': product_id,
                    'filename': filename,
                    'status': 'copy_error',
                    'error': str(e)
                })
        else:
            print(f"  ✗ Arquivo não encontrado na pasta scraped_images")
            not_found += 1
            copy_report.append({
                'product_id': product_id,
                'filename': filename,
                'status': 'not_found'
            })
    
    print(f"\n=== RESUMO DA CÓPIA ===")
    print(f"Total de imagens processadas: {len(missing_images)}")
    print(f"Imagens copiadas com sucesso: {copied}")
    print(f"Imagens já existentes: {already_exists}")
    print(f"Imagens não encontradas: {not_found}")
    
    if copied > 0:
        print(f"\n✓ {copied} imagens foram copiadas da pasta scraped_images para main!")
    
    if not_found > 0:
        print(f"\n⚠ {not_found} imagens não foram encontradas na pasta scraped_images")
        print("Arquivos não encontrados:")
        for item in copy_report:
            if item['status'] == 'not_found':
                print(f"  - {item['filename']} (Produto ID: {item['product_id']})")
    
    # Salvar relatório
    final_report = {
        'summary': {
            'total_processed': len(missing_images),
            'copied': copied,
            'already_exists': already_exists,
            'not_found': not_found
        },
        'details': copy_report
    }
    
    with open('copy_scraped_report.json', 'w', encoding='utf-8') as f:
        json.dump(final_report, f, indent=2, ensure_ascii=False)
    
    print(f"\nRelatório de cópia salvo em: copy_scraped_report.json")
    
    # Verificar quantas imagens ainda faltam
    remaining_missing = not_found
    if remaining_missing == 0:
        print(f"\n🎉 Todas as imagens faltantes foram resolvidas!")
    else:
        print(f"\n📋 Ainda restam {remaining_missing} imagens sem arquivo disponível")

if __name__ == '__main__':
    copy_scraped_images()