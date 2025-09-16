import os
import requests
import json
from dotenv import load_dotenv
import time
from PIL import Image
import io

# Carregar variáveis de ambiente
load_dotenv()

class ProductImageUpdater:
    def __init__(self):
        self.store_domain = os.getenv('SHOPIFY_STORE_DOMAIN', '').rstrip('/')
        self.access_token = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')
        self.image_path = 'C:\\Users\\gusta\\Códigos\\Piska\\perfumes\\public\\imagem_dos_produtos.jpg'
        
        if not self.store_domain or not self.access_token:
            raise ValueError("Variáveis de ambiente SHOPIFY_STORE_DOMAIN e SHOPIFY_ADMIN_ACCESS_TOKEN são obrigatórias")
        
        self.headers = {
            'X-Shopify-Access-Token': self.access_token,
            'Content-Type': 'application/json'
        }
        
        print(f"🛒 Conectando ao Shopify: {self.store_domain}")
    
    def resize_image(self, max_size=(800, 800)):
        """Redimensiona a imagem para otimizar o upload"""
        try:
            with Image.open(self.image_path) as img:
                # Converter para RGB se necessário
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Redimensionar mantendo proporção
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Salvar em buffer
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=85, optimize=True)
                buffer.seek(0)
                
                return buffer.getvalue()
        except Exception as e:
            print(f"   ⚠️ Erro ao redimensionar imagem: {str(e)}")
            # Fallback: usar imagem original
            with open(self.image_path, 'rb') as f:
                return f.read()
    
    def upload_image_to_shopify(self, product_id):
        """Faz upload da imagem para um produto específico"""
        try:
            # Redimensionar e otimizar a imagem
            image_bytes = self.resize_image()
            
            # Converter para base64
            import base64
            image_data = base64.b64encode(image_bytes).decode('utf-8')
            
            # Criar a imagem no Shopify
            image_payload = {
                "image": {
                    "attachment": image_data,
                    "filename": "imagem_dos_produtos.jpg",
                    "alt": "Produto de Perfume"
                }
            }
            
            url = f"{self.store_domain}/admin/api/2023-10/products/{product_id}/images.json"
            response = requests.post(url, headers=self.headers, json=image_payload, timeout=30)
            
            if response.status_code in [200, 201]:
                image_data = response.json()['image']
                print(f"   ✅ Imagem adicionada com sucesso (ID: {image_data['id']})")
                return image_data['id']
            else:
                print(f"   ❌ Erro ao adicionar imagem: {response.status_code} - {response.text[:200]}")
                return None
                
        except Exception as e:
            print(f"   ❌ Erro ao processar imagem: {str(e)}")
            return None
    
    def get_all_products(self):
        """Busca todos os produtos do Shopify"""
        products = []
        url = f"{self.store_domain}/admin/api/2023-10/products.json"
        
        while url:
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                products.extend(data['products'])
                
                # Verificar se há mais páginas
                link_header = response.headers.get('Link', '')
                url = None
                if 'rel="next"' in link_header:
                    # Extrair URL da próxima página
                    for link in link_header.split(','):
                        if 'rel="next"' in link:
                            url = link.split('<')[1].split('>')[0]
                            break
            else:
                print(f"❌ Erro ao buscar produtos: {response.status_code}")
                break
        
        return products
    
    def remove_existing_images(self, product_id):
        """Remove todas as imagens existentes de um produto"""
        try:
            # Buscar imagens existentes
            url = f"{self.store_domain}/admin/api/2023-10/products/{product_id}/images.json"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                images = response.json()['images']
                
                for image in images:
                    delete_url = f"{self.store_domain}/admin/api/2023-10/products/{product_id}/images/{image['id']}.json"
                    delete_response = requests.delete(delete_url, headers=self.headers)
                    
                    if delete_response.status_code == 200:
                        print(f"   🗑️ Imagem removida (ID: {image['id']})")
                    else:
                        print(f"   ⚠️ Erro ao remover imagem {image['id']}: {delete_response.status_code}")
            
        except Exception as e:
            print(f"   ⚠️ Erro ao remover imagens existentes: {str(e)}")
    
    def update_all_products_with_image(self):
        """Atualiza todos os produtos com a nova imagem"""
        print("📸 Iniciando atualização de imagens dos produtos...\n")
        
        # Verificar se a imagem existe
        if not os.path.exists(self.image_path):
            print(f"❌ Imagem não encontrada: {self.image_path}")
            return
        
        print(f"📁 Usando imagem: {self.image_path}")
        
        # Buscar todos os produtos
        products = self.get_all_products()
        print(f"📦 Encontrados {len(products)} produtos para atualizar\n")
        
        success_count = 0
        error_count = 0
        
        for i, product in enumerate(products, 1):
            print(f"🔄 [{i}/{len(products)}] Processando: {product['title']} (ID: {product['id']})")
            
            try:
                # Remover imagens existentes
                self.remove_existing_images(product['id'])
                
                # Adicionar nova imagem
                image_id = self.upload_image_to_shopify(product['id'])
                
                if image_id:
                    success_count += 1
                else:
                    error_count += 1
                
                # Pequena pausa para evitar rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                print(f"   ❌ Erro ao processar produto: {str(e)}")
                error_count += 1
            
            print()  # Linha em branco para separar produtos
        
        print("🎉 ATUALIZAÇÃO CONCLUÍDA!")
        print(f"   ✅ Produtos atualizados com sucesso: {success_count}")
        print(f"   ❌ Produtos com erro: {error_count}")
        print(f"   📊 Total processado: {len(products)}")

if __name__ == "__main__":
    try:
        updater = ProductImageUpdater()
        updater.update_all_products_with_image()
    except Exception as e:
        print(f"❌ Erro fatal: {str(e)}")