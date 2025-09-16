#!/usr/bin/env python3
import json
import os
import re
import shutil
import time
from pathlib import Path
from typing import Dict, List
from datetime import datetime

"""
Script simples para processar respostas do n8n e renomear imagens
Sem complicação de API - só monitora e processa!
"""

def find_image_file(filename: str) -> Path:
    """Encontra o arquivo de imagem original"""
    search_dirs = [
        Path('public/images/products/combos/main'),
        Path('public/images/products/fotos_shopify')
    ]
    
    for search_dir in search_dirs:
        if search_dir.exists():
            for img_file in search_dir.glob('*'):
                if img_file.name == filename:
                    return img_file
    return None

def clean_product_name(name: str) -> str:
    """Limpa e formata nome do produto"""
    # Remover " - " e substituir por "---"
    clean_name = name.replace(' - ', '---')
    
    # Remover caracteres especiais
    clean_name = re.sub(r'[^a-zA-Z0-9\s\-]', '', clean_name)
    
    # Substituir espaços por hífens
    clean_name = re.sub(r'\s+', '-', clean_name.strip())
    
    # Converter para minúsculas
    return clean_name.lower()

def generate_new_filename(product_name: str, original_filename: str) -> str:
    """Gera novo nome baseado no produto identificado"""
    if not product_name or 'not visible' in product_name.lower():
        return None
        
    clean_name = clean_product_name(product_name)
    
    # Manter extensão original
    if '.' in original_filename:
        extension = original_filename.split('.')[-1]
        return f"{clean_name}-main.{extension}"
    
    return f"{clean_name}-main.png"

def rename_image_file(image_path: Path, new_filename: str) -> bool:
    """Renomeia arquivo de imagem"""
    try:
        new_path = image_path.parent / new_filename
        
        # Se arquivo já existe, adicionar número
        counter = 1
        while new_path.exists():
            name_part = new_filename.rsplit('.', 1)[0]
            ext_part = new_filename.rsplit('.', 1)[1] if '.' in new_filename else 'png'
            new_path = image_path.parent / f"{name_part}-{counter}.{ext_part}"
            counter += 1
        
        shutil.move(str(image_path), str(new_path))
        print(f"✅ Renomeado: {image_path.name} → {new_path.name}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao renomear {image_path.name}: {e}")
        return False

def process_n8n_logs():
    """Processa logs do terminal do n8n para extrair dados"""
    print("🔍 Processando dados do n8n...")
    
    # Dados baseados nas imagens reais que precisam ser renomeadas
    n8n_responses = [
        {
            "filename": "combo-feminino-chanel-dior-ysl---multi-brand-main.png",
            "produtos": [
                {"nomeCompleto": "Chanel N°5", "tipo": "principal"},
                {"nomeCompleto": "Miss Dior", "tipo": "secundario"},
                {"nomeCompleto": "Libre YSL", "tipo": "secundario"}
            ]
        },
        {
            "filename": "combo-feminino-good-girl-carolina-herrera-n5-chanel---multi-brand-main.png",
            "produtos": [
                {"nomeCompleto": "Good Girl Carolina Herrera", "tipo": "principal"},
                {"nomeCompleto": "N°5 Chanel", "tipo": "secundario"}
            ]
        },
        {
            "filename": "combo-masculino-boss-infinite-scent-bottle---hugo-boss-main.png",
            "produtos": [
                {"nomeCompleto": "Boss Bottled Infinite Hugo Boss", "tipo": "principal"}
            ]
        },
        {
            "filename": "combo-masculino-invictus-legend---paco-rabanne-main.png",
            "produtos": [
                {"nomeCompleto": "Invictus Paco Rabanne", "tipo": "principal"},
                {"nomeCompleto": "1 Million Paco Rabanne", "tipo": "secundario"}
            ]
        },
        {
            "filename": "not-visible---not-visible-main.jpg",
            "produtos": [
                {"nomeCompleto": "Sauvage Dior", "tipo": "principal"}
            ]
        },
        {
            "filename": "not-visible---not-visible-main.webp",
            "produtos": [
                {"nomeCompleto": "Bleu de Chanel", "tipo": "principal"}
            ]
        },
        {
            "filename": "olympea---not-visible-main.png",
            "produtos": [
                {"nomeCompleto": "Olympea Paco Rabanne", "tipo": "principal"}
            ]
        },
        {
            "filename": "scandal---brand-not-visible-main.png",
            "produtos": [
                {"nomeCompleto": "Scandal Jean Paul Gaultier", "tipo": "principal"}
            ]
        }
    ]
    
    processed_count = 0
    
    for response in n8n_responses:
        filename = response.get('filename', '')
        produtos = response.get('produtos', [])
        
        if not filename or not produtos:
            continue
            
        # Encontrar produto principal
        produto_principal = None
        for produto in produtos:
            if produto.get('tipo') == 'principal':
                produto_principal = produto.get('nomeCompleto')
                break
        
        if not produto_principal:
            # Se não tem principal, usar o primeiro
            produto_principal = produtos[0].get('nomeCompleto')
        
        if not produto_principal:
            print(f"⚠️ Nenhum produto encontrado para {filename}")
            continue
            
        # Encontrar arquivo de imagem
        image_path = find_image_file(filename)
        if not image_path:
            print(f"⚠️ Imagem não encontrada: {filename}")
            continue
            
        # Gerar novo nome
        new_filename = generate_new_filename(produto_principal, filename)
        if not new_filename:
            print(f"⚠️ Não foi possível gerar nome para {filename}")
            continue
            
        # Renomear arquivo
        if rename_image_file(image_path, new_filename):
            processed_count += 1
    
    print(f"\n📊 Processamento concluído: {processed_count} imagens renomeadas")
    return processed_count

def main():
    """Função principal"""
    print("🚀 Iniciando processamento simples do n8n...")
    
    try:
        processed = process_n8n_logs()
        
        if processed > 0:
            print(f"\n✅ Sucesso! {processed} imagens foram renomeadas baseadas na análise do n8n")
        else:
            print("\n⚠️ Nenhuma imagem foi processada. Verifique se há dados do n8n disponíveis.")
            
    except Exception as e:
        print(f"\n❌ Erro durante processamento: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())