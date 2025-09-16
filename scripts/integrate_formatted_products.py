#!/usr/bin/env python3
"""
Script para integrar produtos formatados no sistema principal
Substitui produtos antigos pelos novos formatados
"""

import json
import shutil
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

def backup_original_file(original_path: str) -> str:
    """Cria backup do arquivo original"""
    backup_path = f"{original_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(original_path, backup_path)
    return backup_path

def main():
    """Função principal"""
    print("🚀 Iniciando integração de produtos formatados...")
    
    # Caminhos dos arquivos
    original_path = "data/unified_products.json"
    formatted_path = "data/unified_products_formatted.json"
    report_path = "scripts/integration_report.json"
    
    # Cria backup do arquivo original
    print("💾 Criando backup do arquivo original...")
    backup_path = backup_original_file(original_path)
    print(f"Backup criado: {backup_path}")
    
    # Carrega dados
    print("📂 Carregando dados...")
    original_data = load_json(original_path)
    formatted_data = load_json(formatted_path)
    
    original_products = original_data.get('products', [])
    formatted_products = formatted_data.get('products', [])
    
    # Cria relatório de integração
    integration_report = {
        "timestamp": datetime.now().isoformat(),
        "backup_created": backup_path,
        "original_products_count": len(original_products),
        "formatted_products_count": len(formatted_products),
        "integration_method": "replace_all_with_formatted",
        "gender_distribution": {
            "men": 0,
            "women": 0,
            "unisex": 0
        },
        "brands_in_new_products": set(),
        "tags_summary": {},
        "success": False
    }
    
    try:
        # Analisa produtos formatados para estatísticas
        print("📊 Analisando produtos formatados...")
        for product in formatted_products:
            tags = product.get('tags', [])
            
            # Conta gêneros
            if 'men' in tags:
                integration_report["gender_distribution"]["men"] += 1
            elif 'women' in tags:
                integration_report["gender_distribution"]["women"] += 1
            else:
                integration_report["gender_distribution"]["unisex"] += 1
            
            # Coleta marcas
            brands = product.get('brands', [])
            integration_report["brands_in_new_products"].update(brands)
            
            # Conta tags
            for tag in tags:
                integration_report["tags_summary"][tag] = integration_report["tags_summary"].get(tag, 0) + 1
        
        # Substitui produtos no arquivo original
        print("🔄 Substituindo produtos...")
        updated_data = {
            "products": formatted_products
        }
        
        # Salva arquivo atualizado
        print("💾 Salvando arquivo atualizado...")
        save_json(updated_data, original_path)
        
        integration_report["success"] = True
        integration_report["final_products_count"] = len(formatted_products)
        
        print("✅ Integração concluída com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante integração: {str(e)}")
        integration_report["error"] = str(e)
        
        # Restaura backup em caso de erro
        print("🔄 Restaurando backup...")
        shutil.copy2(backup_path, original_path)
        print("Backup restaurado com sucesso.")
    
    # Converte set para list no relatório
    integration_report["brands_in_new_products"] = list(integration_report["brands_in_new_products"])
    
    # Salva relatório
    save_json(integration_report, report_path)
    
    print(f"\n📊 Resumo da Integração:")
    print(f"   • Backup criado: {backup_path}")
    print(f"   • Produtos originais: {integration_report['original_products_count']}")
    print(f"   • Produtos formatados: {integration_report['formatted_products_count']}")
    print(f"   • Produtos finais: {integration_report.get('final_products_count', 0)}")
    print(f"   • Masculinos: {integration_report['gender_distribution']['men']}")
    print(f"   • Femininos: {integration_report['gender_distribution']['women']}")
    print(f"   • Unissex: {integration_report['gender_distribution']['unisex']}")
    print(f"   • Marcas: {len(integration_report['brands_in_new_products'])}")
    print(f"   • Status: {'✅ Sucesso' if integration_report['success'] else '❌ Erro'}")
    print(f"   • Relatório: {report_path}")
    
    if integration_report['success']:
        print("\n🎉 Produtos formatados integrados com sucesso!")
        print("   • Nomes legíveis e padronizados")
        print("   • Tags funcionais para filtragem")
        print("   • Coleções separadas por gênero")
        print("   • Marcas corretamente identificadas")
    else:
        print("\n⚠️ Integração falhou. Backup foi restaurado.")

if __name__ == "__main__":
    main()