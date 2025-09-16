#!/usr/bin/env python3
"""
Script para atualizar o estoque dos produtos no Shopify.
"""

import json
import os
import requests
import time
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

class InventoryUpdater:
    def __init__(self):
        self.store_domain = os.getenv('SHOPIFY_STORE_DOMAIN', '').rstrip('/')
        self.admin_token = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')
        self.api_version = os.getenv('SHOPIFY_API_VERSION', '2023-10')
        
        if not self.store_domain or not self.admin_token:
            raise ValueError("Variáveis de ambiente do Shopify não configuradas!")
        
        # URL base da API
        self.base_url = f"{self.store_domain}/admin/api/{self.api_version}"
        
        # Headers para autenticação
        self.headers = {
            'X-Shopify-Access-Token': self.admin_token,
            'Content-Type': 'application/json'
        }
        
        print(f"🛒 Conectando ao Shopify: {self.store_domain}")
    
    def get_all_products(self):
        """Busca todos os produtos da loja."""
        products = []
        url = f"{self.base_url}/products.json"
        
        while url:
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                products.extend(data.get('products', []))
                
                # Verificar se há próxima página
                link_header = response.headers.get('Link', '')
                next_url = None
                
                if 'rel="next"' in link_header:
                    # Extrair URL da próxima página
                    parts = link_header.split(',')
                    for part in parts:
                        if 'rel="next"' in part:
                            next_url = part.split(';')[0].strip('<> ')
                            break
                
                url = next_url
                time.sleep(0.5)  # Rate limiting
            else:
                print(f"❌ Erro ao buscar produtos: {response.status_code} - {response.text}")
                break
        
        return products
    
    def get_inventory_levels(self, location_id):
        """Busca os níveis de inventário para uma localização."""
        url = f"{self.base_url}/inventory_levels.json?location_ids={location_id}"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json().get('inventory_levels', [])
        else:
            print(f"❌ Erro ao buscar níveis de inventário: {response.status_code}")
            return []
    
    def get_locations(self):
        """Busca as localizações da loja."""
        url = f"{self.base_url}/locations.json"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json().get('locations', [])
        else:
            print(f"❌ Erro ao buscar localizações: {response.status_code}")
            return []
    
    def update_inventory_level(self, inventory_item_id, location_id, quantity):
        """Atualiza o nível de inventário de um item."""
        url = f"{self.base_url}/inventory_levels/set.json"
        
        data = {
            "location_id": location_id,
            "inventory_item_id": inventory_item_id,
            "available": quantity
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        
        if response.status_code == 200:
            return True
        else:
            print(f"❌ Erro ao atualizar inventário: {response.status_code} - {response.text}")
            return False
    
    def update_all_inventory(self, target_quantity=100):
        """Atualiza o inventário de todos os produtos."""
        print(f"📦 Iniciando atualização de inventário para {target_quantity} unidades...")
        
        # Buscar localizações
        locations = self.get_locations()
        if not locations:
            print("❌ Nenhuma localização encontrada!")
            return
        
        primary_location = locations[0]  # Usar a primeira localização
        location_id = primary_location['id']
        print(f"📍 Usando localização: {primary_location['name']} (ID: {location_id})")
        
        # Buscar todos os produtos
        products = self.get_all_products()
        print(f"📋 Encontrados {len(products)} produtos")
        
        updated_count = 0
        
        for product in products:
            print(f"\n🔄 Processando: {product['title']}")
            
            for variant in product.get('variants', []):
                inventory_item_id = variant.get('inventory_item_id')
                
                if inventory_item_id and variant.get('inventory_management') == 'shopify':
                    print(f"   📦 Atualizando variante: {variant['title']} (ID: {variant['id']})")
                    
                    success = self.update_inventory_level(
                        inventory_item_id, 
                        location_id, 
                        target_quantity
                    )
                    
                    if success:
                        print(f"   ✅ Inventário atualizado para {target_quantity} unidades")
                        updated_count += 1
                    else:
                        print(f"   ❌ Falha ao atualizar inventário")
                    
                    time.sleep(0.5)  # Rate limiting
                else:
                    print(f"   ⏭️  Variante não gerenciada pelo Shopify: {variant['title']}")
        
        print(f"\n🎉 Atualização concluída! {updated_count} variantes atualizadas.")
    
    def check_inventory_status(self):
        """Verifica o status atual do inventário."""
        print("📊 Verificando status do inventário...")
        
        products = self.get_all_products()
        
        total_variants = 0
        out_of_stock = 0
        low_stock = 0
        
        for product in products:
            for variant in product.get('variants', []):
                total_variants += 1
                quantity = variant.get('inventory_quantity', 0)
                
                if quantity == 0:
                    out_of_stock += 1
                    print(f"❌ SEM ESTOQUE: {product['title']} - {variant['title']} (Qty: {quantity})")
                elif quantity < 10:
                    low_stock += 1
                    print(f"⚠️  ESTOQUE BAIXO: {product['title']} - {variant['title']} (Qty: {quantity})")
        
        print(f"\n📊 RESUMO DO INVENTÁRIO:")
        print(f"   Total de variantes: {total_variants}")
        print(f"   Sem estoque: {out_of_stock}")
        print(f"   Estoque baixo (<10): {low_stock}")
        print(f"   Com estoque adequado: {total_variants - out_of_stock - low_stock}")

def main():
    try:
        updater = InventoryUpdater()
        
        print("\n=== VERIFICAÇÃO INICIAL ===")
        updater.check_inventory_status()
        
        print("\n=== ATUALIZAÇÃO DE INVENTÁRIO ===")
        updater.update_all_inventory(target_quantity=100)
        
        print("\n=== VERIFICAÇÃO FINAL ===")
        updater.check_inventory_status()
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

if __name__ == "__main__":
    main()