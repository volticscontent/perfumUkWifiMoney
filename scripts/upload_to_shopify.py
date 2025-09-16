#!/usr/bin/env python3
"""
Script para fazer upload dos produtos traduzidos para o Shopify.
"""

import json
import os
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

class ShopifyUploader:
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
    
    def test_connection(self):
        """Testa a conexão com a API do Shopify."""
        try:
            url = f"{self.base_url}/shop.json"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                shop_data = response.json()
                shop_name = shop_data.get('shop', {}).get('name', 'Unknown')
                print(f"✅ Conexão estabelecida com sucesso! Loja: {shop_name}")
                return True
            else:
                print(f"❌ Erro na conexão: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao conectar: {str(e)}")
            return False
    
    def upload_image(self, image_url, alt_text=""):
        """Faz upload de uma imagem para o produto."""
        # Para este exemplo, vamos assumir que as imagens já estão hospedadas
        # Você pode modificar para fazer upload real das imagens
        return {
            "src": image_url,
            "alt": alt_text
        }
    
    def sanitize_tags(self, tags):
        """Sanitiza tags para o Shopify."""
        if not tags:
            return ""
        
        sanitized = []
        for tag in tags:
            if isinstance(tag, str):
                # Remove caracteres especiais e limita tamanho
                clean_tag = tag.replace('ç', 'c').replace('ã', 'a').replace('á', 'a').replace('â', 'a')
                clean_tag = clean_tag.replace('é', 'e').replace('ê', 'e').replace('í', 'i').replace('ó', 'o')
                clean_tag = clean_tag.replace('ô', 'o').replace('õ', 'o').replace('ú', 'u').replace('ü', 'u')
                clean_tag = ''.join(c for c in clean_tag if c.isalnum() or c in ' -_')
                clean_tag = clean_tag.strip()
                
                if clean_tag and len(clean_tag) <= 255:
                    sanitized.append(clean_tag)
        
        return ', '.join(sanitized[:10])  # Limite de 10 tags
    
    def create_product(self, product_data):
        """Cria um produto no Shopify."""
        try:
            # Preparar dados do produto para a API do Shopify
            shopify_product = {
                "product": {
                    "title": product_data.get('title', ''),
                    "body_html": product_data.get('description_html', product_data.get('description', '')),
                    "vendor": product_data.get('primary_brand', 'Unknown'),
                    "product_type": product_data.get('category', 'Fragrance'),
                    "handle": product_data.get('handle', ''),
                    "tags": "",  # Removendo tags temporariamente para evitar erros
                    "published": True,
                    "variants": [
                        {
                            "title": "Default",
                            "price": str(product_data.get('price', {}).get('regular', 49.90)),
                            "sku": product_data.get('sku', ''),
                            "inventory_quantity": 100,
                            "inventory_management": "shopify",
                            "requires_shipping": True,
                            "taxable": True,
                            "weight": float(os.getenv('SHOPIFY_DEFAULT_WEIGHT', 0.5)),
                            "weight_unit": os.getenv('SHOPIFY_DEFAULT_WEIGHT_UNIT', 'kg')
                        }
                    ],
                    "options": [
                        {
                            "name": "Title",
                            "values": ["Default"]
                        }
                    ],
                    "images": []
                }
            }
            
            # Adicionar imagens se existirem
            images = product_data.get('images', {})
            if isinstance(images, dict) and 'main' in images:
                for img_url in images['main']:
                    if img_url:
                        # Converter para URL completa se necessário
                        if img_url.startswith('/'):
                            full_url = f"https://perfumes-uk.vercel.app{img_url}"
                        else:
                            full_url = img_url
                        
                        shopify_product['product']['images'].append({
                            "src": full_url,
                            "alt": product_data.get('title', '')
                        })
            
            # Fazer request para criar produto
            url = f"{self.base_url}/products.json"
            response = requests.post(url, headers=self.headers, json=shopify_product)
            
            if response.status_code == 201:
                created_product = response.json()
                product_id = created_product['product']['id']
                print(f"   ✅ Produto criado: ID {product_id} - {product_data.get('title', '')[:50]}...")
                return product_id
            else:
                print(f"   ❌ Erro ao criar produto: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"   ❌ Erro ao criar produto {product_data.get('title', '')}: {str(e)}")
            return None
    
    def get_existing_products(self):
        """Busca produtos existentes na loja."""
        try:
            existing_handles = set()
            page = 1
            limit = 250  # Máximo permitido pela API
            
            while True:
                url = f"{self.base_url}/products.json?limit={limit}&page={page}&fields=id,handle"
                response = requests.get(url, headers=self.headers)
                
                if response.status_code == 200:
                    products = response.json().get('products', [])
                    if not products:
                        break
                    
                    for product in products:
                        existing_handles.add(product.get('handle', ''))
                    
                    page += 1
                    time.sleep(0.5)  # Rate limiting
                else:
                    print(f"⚠️  Erro ao buscar produtos existentes: {response.status_code}")
                    break
            
            print(f"📊 Produtos existentes na loja: {len(existing_handles)}")
            return existing_handles
            
        except Exception as e:
            print(f"❌ Erro ao buscar produtos existentes: {str(e)}")
            return set()
    
    def upload_products_from_file(self, json_file, max_products=None):
        """Faz upload de produtos de um arquivo JSON."""
        print(f"📦 Fazendo upload de produtos de {json_file}...")
        
        if not os.path.exists(json_file):
            print(f"❌ Arquivo não encontrado: {json_file}")
            return
        
        # Carregar dados
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        products = data.get('products', [])
        if not products:
            print(f"❌ Nenhum produto encontrado em {json_file}")
            return
        
        # Limitar quantidade se especificado
        if max_products:
            products = products[:max_products]
            print(f"📊 Limitando upload a {max_products} produtos")
        
        # Buscar produtos existentes
        existing_handles = self.get_existing_products()
        
        # Fazer upload dos produtos
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        for i, product in enumerate(products, 1):
            handle = product.get('handle', '')
            title = product.get('title', 'Sem título')
            
            print(f"\n📦 [{i}/{len(products)}] Processando: {title[:50]}...")
            
            # Verificar se produto já existe
            if handle in existing_handles:
                print(f"   ⏭️  Produto já existe (handle: {handle})")
                skipped_count += 1
                continue
            
            # Criar produto
            product_id = self.create_product(product)
            
            if product_id:
                created_count += 1
                existing_handles.add(handle)  # Adicionar à lista para evitar duplicatas
            else:
                error_count += 1
            
            # Rate limiting - aguardar entre requests
            time.sleep(0.5)
        
        # Relatório final
        print(f"\n🎉 Upload concluído!")
        print(f"✅ Produtos criados: {created_count}")
        print(f"⏭️  Produtos já existiam: {skipped_count}")
        print(f"❌ Erros: {error_count}")
        print(f"📊 Total processado: {len(products)}")

def main():
    """Função principal."""
    print("🛒 Iniciando upload para Shopify...\n")
    
    try:
        # Inicializar uploader
        uploader = ShopifyUploader()
        
        # Testar conexão
        if not uploader.test_connection():
            print("❌ Não foi possível conectar ao Shopify. Verifique as configurações.")
            return
        
        print()
        
        # Fazer upload dos produtos
        files_to_upload = [
            'data/shopify_products.json',  # Arquivo otimizado para Shopify
            # 'data/unified_products.json',  # Comentado para evitar duplicatas
        ]
        
        for file_path in files_to_upload:
            if os.path.exists(file_path):
                # Upload de todos os produtos
                uploader.upload_products_from_file(file_path, max_products=None)
                print()
            else:
                print(f"⚠️  Arquivo não encontrado: {file_path}")
        
        print("✨ Processo finalizado!")
        
    except Exception as e:
        print(f"❌ Erro geral: {str(e)}")

if __name__ == "__main__":
    main()
