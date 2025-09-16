#!/usr/bin/env python3
"""
Script para buscar produtos existentes no Shopify e criar mapeamento
com os produtos locais baseado no handle/SKU.
"""

import json
import os
import requests
import time
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis de ambiente
load_dotenv()

class ShopifyMappingGenerator:
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
        
        # Arquivos
        self.data_dir = Path('../data')
        self.unified_products_file = self.data_dir / 'unified_products.json'
        self.mapping_file = self.data_dir / 'shopify_mapping.json'
        
        print(f"🛒 Conectando ao Shopify: {self.store_domain}")

    def test_connection(self):
        """Testa a conexão com a API do Shopify."""
        try:
            url = f"{self.base_url}/shop.json"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                shop_data = response.json()
                print(f"✅ Conectado à loja: {shop_data['shop']['name']}")
                return True
            else:
                print(f"❌ Erro de conexão: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao testar conexão: {str(e)}")
            return False

    def get_all_shopify_products(self):
        """Busca todos os produtos do Shopify com detalhes completos."""
        try:
            all_products = []
            
            print("📦 Buscando produtos do Shopify...")
            
            # Tentar primeiro sem paginação
            url = f"{self.base_url}/products.json?limit=250&fields=id,handle,title,variants"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                products = data.get('products', [])
                all_products.extend(products)
                print(f"   📄 Produtos encontrados: {len(products)}")
                
                # Se há mais produtos, usar cursor-based pagination
                while 'next' in response.links:
                    next_url = response.links['next']['url']
                    response = requests.get(next_url, headers=self.headers)
                    
                    if response.status_code == 200:
                        data = response.json()
                        products = data.get('products', [])
                        all_products.extend(products)
                        print(f"   📄 Mais produtos: {len(products)}")
                        time.sleep(0.5)  # Rate limiting
                    else:
                        print(f"⚠️  Erro na paginação: {response.status_code} - {response.text}")
                        break
            else:
                print(f"⚠️  Erro ao buscar produtos: {response.status_code} - {response.text}")
                
                # Tentar abordagem alternativa sem fields
                print("🔄 Tentando abordagem alternativa...")
                url = f"{self.base_url}/products.json?limit=50"
                response = requests.get(url, headers=self.headers)
                
                if response.status_code == 200:
                    data = response.json()
                    products = data.get('products', [])
                    all_products.extend(products)
                    print(f"   📄 Produtos encontrados (alternativo): {len(products)}")
                else:
                    print(f"⚠️  Erro na abordagem alternativa: {response.status_code} - {response.text}")
            
            print(f"✅ Total de produtos encontrados no Shopify: {len(all_products)}")
            return all_products
            
        except Exception as e:
            print(f"❌ Erro ao buscar produtos do Shopify: {str(e)}")
            return []

    def load_local_products(self):
        """Carrega produtos locais do arquivo unified_products.json."""
        try:
            if not self.unified_products_file.exists():
                print(f"❌ Arquivo não encontrado: {self.unified_products_file}")
                return []
            
            with open(self.unified_products_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            products = data.get('products', [])
            print(f"📦 Produtos locais carregados: {len(products)}")
            return products
            
        except Exception as e:
            print(f"❌ Erro ao carregar produtos locais: {str(e)}")
            return []

    def create_mapping(self, shopify_products, local_products):
        """Cria mapeamento entre produtos locais e do Shopify."""
        print("🔗 Criando mapeamento...")
        
        # Criar índices para busca rápida
        shopify_by_handle = {}
        shopify_by_title = {}
        
        for shopify_product in shopify_products:
            handle = shopify_product.get('handle', '')
            title = shopify_product.get('title', '').lower()
            
            if handle:
                shopify_by_handle[handle] = shopify_product
            if title:
                shopify_by_title[title] = shopify_product
        
        # Criar mapeamento
        mapping = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'total_local_products': len(local_products),
                'total_shopify_products': len(shopify_products),
                'mapped_products': 0,
                'unmapped_products': 0
            },
            'products': {},
            'unmapped': []
        }
        
        mapped_count = 0
        unmapped_count = 0
        
        for local_product in local_products:
            local_id = local_product.get('id')
            local_handle = local_product.get('handle', '')
            local_title = local_product.get('title', '').lower()
            
            shopify_match = None
            match_method = None
            
            # Tentar match por handle primeiro (mais confiável)
            if local_handle and local_handle in shopify_by_handle:
                shopify_match = shopify_by_handle[local_handle]
                match_method = 'handle'
            
            # Se não encontrou por handle, tentar por título
            elif local_title and local_title in shopify_by_title:
                shopify_match = shopify_by_title[local_title]
                match_method = 'title'
            
            if shopify_match:
                # Pegar o primeiro variant ID (assumindo que cada produto tem pelo menos um)
                variant_id = None
                if shopify_match.get('variants') and len(shopify_match['variants']) > 0:
                    variant_id = shopify_match['variants'][0]['id']
                
                mapping['products'][str(local_id)] = {
                    'local_handle': local_handle,
                    'local_title': local_product.get('title', ''),
                    'shopify_product_id': shopify_match['id'],
                    'shopify_variant_id': variant_id,
                    'shopify_handle': shopify_match.get('handle', ''),
                    'shopify_title': shopify_match.get('title', ''),
                    'match_method': match_method
                }
                mapped_count += 1
                print(f"   ✅ Mapeado: {local_product.get('title', '')[:50]}... -> {shopify_match.get('title', '')[:50]}...")
            else:
                mapping['unmapped'].append({
                    'local_id': local_id,
                    'local_handle': local_handle,
                    'local_title': local_product.get('title', '')
                })
                unmapped_count += 1
                print(f"   ❌ Não mapeado: {local_product.get('title', '')[:50]}...")
        
        # Atualizar metadados
        mapping['metadata']['mapped_products'] = mapped_count
        mapping['metadata']['unmapped_products'] = unmapped_count
        
        return mapping

    def save_mapping(self, mapping):
        """Salva o mapeamento em arquivo JSON."""
        try:
            # Criar diretório se não existir
            self.data_dir.mkdir(exist_ok=True)
            
            with open(self.mapping_file, 'w', encoding='utf-8') as f:
                json.dump(mapping, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Mapeamento salvo: {self.mapping_file}")
            
        except Exception as e:
            print(f"❌ Erro ao salvar mapeamento: {str(e)}")

    def print_summary(self, mapping):
        """Exibe resumo do mapeamento."""
        metadata = mapping['metadata']
        
        print("\n" + "="*60)
        print("📊 RESUMO DO MAPEAMENTO")
        print("="*60)
        print(f"📦 Produtos locais: {metadata['total_local_products']}")
        print(f"🛒 Produtos Shopify: {metadata['total_shopify_products']}")
        print(f"✅ Produtos mapeados: {metadata['mapped_products']}")
        print(f"❌ Produtos não mapeados: {metadata['unmapped_products']}")
        
        if metadata['unmapped_products'] > 0:
            print(f"\n⚠️  Produtos não mapeados:")
            for unmapped in mapping['unmapped'][:5]:  # Mostrar apenas os primeiros 5
                print(f"   • {unmapped['local_title'][:50]}...")
            if len(mapping['unmapped']) > 5:
                print(f"   ... e mais {len(mapping['unmapped']) - 5} produtos")
        
        print(f"\n📁 Arquivo gerado: {self.mapping_file}")

    def run(self):
        """Executa o processo completo de mapeamento."""
        print("🚀 Iniciando geração de mapeamento Shopify...\n")
        
        # Testar conexão
        if not self.test_connection():
            print("❌ Não foi possível conectar ao Shopify. Verifique as configurações.")
            return
        
        print()
        
        # Buscar produtos do Shopify
        shopify_products = self.get_all_shopify_products()
        if not shopify_products:
            print("❌ Nenhum produto encontrado no Shopify.")
            return
        
        print()
        
        # Carregar produtos locais
        local_products = self.load_local_products()
        if not local_products:
            print("❌ Nenhum produto local encontrado.")
            return
        
        print()
        
        # Criar mapeamento
        mapping = self.create_mapping(shopify_products, local_products)
        
        # Salvar mapeamento
        self.save_mapping(mapping)
        
        # Exibir resumo
        self.print_summary(mapping)
        
        print("\n✅ Mapeamento concluído com sucesso!")

def main():
    """Função principal."""
    try:
        generator = ShopifyMappingGenerator()
        generator.run()
        
    except Exception as e:
        print(f"❌ Erro geral: {str(e)}")

if __name__ == "__main__":
    main()