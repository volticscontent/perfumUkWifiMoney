# Guia de Integração Webhook + n8n para Análise de Perfumes

Este guia explica como usar os scripts criados para enviar imagens para análise via webhook e processar as respostas no n8n.

## 📁 Arquivos Criados

1. **`send_images_to_webhook.py`** - Script Python para envio de imagens
2. **`n8n_perfume_processor.js`** - Código JavaScript para o n8n
3. **`webhook_integration_guide.md`** - Este guia

## 🚀 Como Usar

### 1. Envio de Imagens (Python)

```bash
# Instalar dependências
pip install requests

# Executar o script
python scripts/send_images_to_webhook.py
```

**Características:**
- ✅ Intervalo de 1,5s entre envios
- ✅ Envio como dados binários
- ✅ Prioriza imagens `kit-of-3-fragrances-*`
- ✅ Gera relatório detalhado
- ✅ Tratamento de erros robusto

### 2. Processamento no n8n (JavaScript)

**Configuração do Workflow n8n:**

1. **Webhook Node** (Trigger)
   - URL: `https://n8n.landcriativa.com/webhook-test/6734330d-7878-4c37-a1a1-9c77d422732e`
   - Method: POST
   - Response Mode: Wait for Response

2. **OpenAI Node** (Análise de Imagem)
   - Model: gpt-4-vision-preview
   - Prompt: Ver seção "Prompt Otimizado" abaixo

3. **Function Node** (Processamento)
   - Cole o código de `n8n_perfume_processor.js`

4. **Respond to Webhook Node** (Resposta)
   - Response Body: `{{ $json }}`

## 🎯 Prompt Otimizado para OpenAI

```
Analise detalhadamente esta imagem de um conjunto de perfumes e forneça as seguintes informações em formato estruturado:

1. PRODUTO PRINCIPAL (FRENTE):
- Nome completo do perfume
- Marca
- Linha/coleção (se visível)

2. PRODUTOS SECUNDÁRIOS (se houver):
- Liste da esquerda para direita
- Nome e marca de cada perfume

Formate a saída assim:

PRINCIPAL:
[Nome do Perfume] - [Marca]

SECUNDÁRIOS:
1. [Nome do Perfume] - [Marca]
2. [Nome do Perfume] - [Marca]
3. [Nome do Perfume] - [Marca]

Obs: Foque em identificar textos e nomes visíveis nas embalagens. Se alguma informação não estiver claramente visível, indique como "não visível".
```

## 📊 Estrutura de Dados de Saída

```json
{
  "filename": "kit-of-3-fragrances-1-main.png",
  "produtos": [
    {
      "nomeOriginal": "Sauvage - Dior",
      "nome": "Sauvage",
      "marca": "Dior",
      "nomeCompleto": "Sauvage Dior",
      "mapeado": true,
      "tipo": "principal",
      "posicao": 0
    }
  ],
  "principal": {
    "nome": "Sauvage",
    "marca": "Dior",
    "nomeCompleto": "Sauvage Dior"
  },
  "secundarios": [],
  "novosNomes": [],
  "mapeamentos": [
    {
      "original": "Sauvage - Dior",
      "processado": "Sauvage Dior",
      "chave": "sauvage",
      "confianca": 1.0
    }
  ],
  "estatisticas": {
    "totalEncontrados": 1,
    "principalEncontrado": true,
    "secundariosEncontrados": 0,
    "novosNomesDetectados": 0
  },
  "metadata": {
    "originalFilename": "kit-of-3-fragrances-1-main.png",
    "processedAt": "2025-01-13T10:30:00.000Z",
    "analysisLength": 150,
    "hasValidData": true
  }
}
```

## 🔧 Configurações Avançadas

### Modificar Intervalo de Envio

```python
# Em send_images_to_webhook.py
INTERVAL_SECONDS = 2.0  # Alterar para 2 segundos
```

### Adicionar Novos Mapeamentos

```javascript
// Em n8n_perfume_processor.js
const PERFUME_MAPPING = {
  // Adicionar novos mapeamentos aqui
  'novo perfume': 'Novo Perfume Marca',
  // ...
};
```

### Filtrar Tipos de Imagem

```python
# Em send_images_to_webhook.py
def get_image_files():
    # Modificar lógica de filtro aqui
    if 'kit-of-3-fragrances' in file_path.name:
        image_files.append(file_path)
```

## 📈 Monitoramento e Logs

### Relatório de Envio
O script Python gera automaticamente:
- `webhook_send_report.json` - Relatório detalhado de todos os envios

### Logs do n8n
- Verifique os logs do Function Node para debug
- Use `console.log()` para adicionar logs customizados

## 🛠️ Troubleshooting

### Erro 404 no Webhook
- Verifique se o workflow está ativo no n8n
- Execute o workflow manualmente uma vez
- Confirme a URL do webhook

### Timeout nos Envios
- Aumente o timeout em `send_images_to_webhook.py`:
```python
response = requests.post(
    WEBHOOK_URL,
    files=files,
    data=data,
    timeout=60  # Aumentar timeout
)
```

### Problemas de Encoding
- Certifique-se que as imagens não estão corrompidas
- Verifique se os formatos são suportados (.png, .jpg, .jpeg, .webp)

### Regex Não Funciona
- Teste os padrões regex com dados reais
- Ajuste os patterns em `REGEX_PATTERNS`
- Verifique se o formato da resposta da OpenAI mudou

## 🔄 Fluxo Completo

1. **Envio**: Script Python envia imagens uma por uma
2. **Recepção**: Webhook n8n recebe a imagem
3. **Análise**: OpenAI analisa e retorna texto estruturado
4. **Processamento**: Function Node extrai e mapeia nomes
5. **Armazenamento**: Dados são enviados para API do projeto
6. **Consulta**: Resultados podem ser consultados via API

## 🗄️ APIs de Armazenamento

### Receber Resultados do Webhook
**Endpoint**: `POST /api/webhook/perfume-analysis`

```javascript
// Adicionar ao final do n8n Function Node:
const webhookResponse = await fetch('http://localhost:3000/api/webhook/perfume-analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(processedData)
});

const saveResult = await webhookResponse.json();
console.log('Resultado salvo:', saveResult);

return processedData; // Retornar dados originais
```

### Consultar Resultados
**Endpoint**: `GET /api/perfume-analysis/results`

```bash
# Listar todos os resultados (paginado)
curl "http://localhost:3000/api/perfume-analysis/results?limit=10&offset=0"

# Obter resumo estatístico
curl "http://localhost:3000/api/perfume-analysis/results?summary=true"

# Buscar resultado específico
curl "http://localhost:3000/api/perfume-analysis/results?filename=kit-of-3-fragrances-1-main.png"
```

### Estrutura de Armazenamento

```
data/perfume-analysis/
├── index.json                    # Índice de todos os resultados
├── 2025-01-13T10-30-00_kit-1.json  # Resultado individual
├── 2025-01-13T10-31-30_kit-2.json
└── ...
```

## 📊 Dashboard de Resultados

### Resumo Estatístico
```json
{
  "totalAnalises": 24,
  "comProdutoPrincipal": 22,
  "comProdutosSecundarios": 18,
  "semProdutos": 2,
  "produtosMaisEncontrados": [
    { "nome": "Sauvage Dior", "count": 8 },
    { "nome": "Invictus Paco Rabanne", "count": 6 }
  ],
  "ultimaAnalise": "2025-01-13T10:30:00.000Z"
}
```

## 📝 Próximos Passos

1. ✅ **Implementar armazenamento dos resultados** - CONCLUÍDO
2. ✅ **Criar API para consultar resultados processados** - CONCLUÍDO
3. Criar dashboard web para visualizar análises
4. Adicionar validação de qualidade das análises
5. Implementar sistema de feedback para melhorar mapeamentos
6. Integrar com sistema de produtos existente

---

**Desenvolvido para o projeto Piska Perfumes**  
*Integração webhook + n8n para análise automatizada de imagens de perfumes*