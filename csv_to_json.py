#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import json
from datetime import datetime

def csv_to_json(csv_file_path, json_file_path):
    """
    Converte um arquivo CSV para JSON
    """
    products = []
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
            # Detecta automaticamente o delimitador
            sample = csv_file.read(1024)
            csv_file.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(csv_file, delimiter=delimiter)
            
            for row_num, row in enumerate(reader, start=1):
                try:
                    # Converte os dados para os tipos apropriados
                    product = {
                        "id": int(row.get('ID', 0)) if row.get('ID', '').strip() else 0,
                        "handle": row.get('Handle', '').strip(),
                        "title": row.get('Title', '').strip(),
                        "description": row.get('Description', '').strip(),
                        "sku": row.get('SKU', '').strip(),
                        "price": float(row.get('Price_Regular', 0)) if row.get('Price_Regular', '').strip() else 0.0,
                        "compare_at_price": float(row.get('Price_Sale', 0)) if row.get('Price_Sale', '').strip() else None,
                        "on_sale": row.get('On_Sale', '').lower() == 'true',
                        "discount_percent": int(row.get('Discount_Percent', 0)) if row.get('Discount_Percent', '').strip() else 0,
                        "currency": row.get('Currency', 'GBP').strip(),
                        "category": row.get('Category', '').strip(),
                        "brands": row.get('Brands', '').strip(),
                        "primary_brand": row.get('Primary_Brand', '').strip(),
                        "tags": row.get('Tags', '').strip(),
                        "main_image": row.get('Main_Image', '').strip(),
                        "gallery_images": row.get('Gallery_Images', '').strip(),
                        "is_combo": row.get('Is_Combo', '').lower() == 'true',
                        "stock_status": row.get('Stock_Status', '').strip(),
                        "stock_quantity": int(row.get('Stock_Quantity', 0)) if row.get('Stock_Quantity', '').strip() else 0,
                        "weight": row.get('Weight', '').strip(),
                        "dimensions": row.get('Dimensions', '').strip(),
                        "created_at": row.get('Created_At', '').strip(),
                        "updated_at": row.get('Updated_At', '').strip()
                    }
                    
                    products.append(product)
                    
                except Exception as e:
                    print(f"⚠️  Erro na linha {row_num}: {e}")
                    print(f"   Dados da linha: {row}")
                    continue
            
        # Salva o JSON
        with open(json_file_path, 'w', encoding='utf-8') as json_file:
            json.dump(products, json_file, indent=2, ensure_ascii=False)
        
        print(f"✅ Conversão concluída!")
        print(f"📁 Arquivo CSV: {csv_file_path}")
        print(f"📁 Arquivo JSON: {json_file_path}")
        print(f"📊 Total de produtos: {len(products)}")
        
        return products
        
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {csv_file_path}")
        return None
    except Exception as e:
        print(f"❌ Erro durante a conversão: {e}")
        return None

if __name__ == "__main__":
    # Caminhos dos arquivos
    csv_path = "data/unified_products.csv"
    json_path = "data/unified_products_from_csv.json"
    
    print("=== CONVERSÃO CSV PARA JSON ===")
    print(f"Convertendo {csv_path} para {json_path}...")
    
    products = csv_to_json(csv_path, json_path)
    
    if products:
        print("\n📋 Primeiros 3 produtos:")
        for i, product in enumerate(products[:3]):
            print(f"\n{i+1}. {product.get('title', 'Sem título')}")
            print(f"   Handle: {product.get('handle', 'N/A')}")
            print(f"   Preço: £{product.get('price', 0)}")
            print(f"   SKU: {product.get('sku', 'N/A')}")