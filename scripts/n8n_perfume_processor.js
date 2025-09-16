// Código JavaScript para Function Node no n8n
// Processa respostas de análise de imagem e extrai nomes de perfumes

// Configuração global para mapeamento de nomes
const PERFUME_MAPPING = {
  // Mapeamento de nomes conhecidos (pode ser expandido dinamicamente)
  'sauvage': 'Sauvage Dior',
  'invictus': 'Invictus Paco Rabanne',
  '1 million': '1 Million Paco Rabanne',
  'coco mademoiselle': 'Coco Mademoiselle Chanel',
  'good girl': 'Good Girl Carolina Herrera',
  'la vie est belle': 'La Vie Est Belle Lancôme',
  'black opium': 'Black Opium Yves Saint Laurent',
  'libre': 'Libre Yves Saint Laurent',
  'dylan blue': 'Dylan Blue Versace',
  'phantom': 'Phantom Paco Rabanne',
  'boss bottled': 'Boss Bottled Hugo Boss',
  'versace eros': 'Versace Eros',
  'armani code': 'Armani Code Giorgio Armani',
  'si': 'Si Giorgio Armani',
  'hypnotic poison': 'Hypnotic Poison Dior',
  'jadore': "J'adore Dior",
  'scandal': 'Scandal Jean Paul Gaultier',
  'olympea': 'Olympea Paco Rabanne',
  '212 vip': '212 VIP Carolina Herrera',
  'miss dior': 'Miss Dior',
  'n°5': 'N°5 Chanel',
  'angel': 'Angel Mugler'
};

// Regex patterns para extrair informações
const REGEX_PATTERNS = {
  // Padrão principal para capturar produto principal (MAIN ou PRINCIPAL)
  principal: /(MAIN|PRINCIPAL):\s*([^\n]+)/i,
  
  // Padrão para produtos secundários (SECONDARY ou SECUNDÁRIOS)
  secundarios: /(SECONDARY|SECUNDÁRIOS?):\s*([\s\S]*?)(?=\n\n|$)/i,
  
  // Padrão para itens numerados
  itensNumerados: /\d+\.\s*([^\n]+)/g,
  
  // Padrão para separar nome e marca
  nomeMarca: /^(.+?)\s*-\s*(.+)$/,
  
  // Padrão para limpar texto
  limpeza: /[\[\]"']/g,
  
  // Padrão para detectar "não visível"
  naoVisivel: /não\s+visível|not\s+visible|unclear|not visible/i
};

// Função principal do n8n
function processImageAnalysis() {
  try {
    // Obter dados de entrada
    const inputData = $input.all();
    const results = [];
    
    for (const item of inputData) {
      const analysisText = item.json.analysis || item.json.response || item.json.text || '';
      const filename = item.json.filename || 'unknown';
      
      // Processar análise
      const processedData = extractPerfumeNames(analysisText, filename);
      
      // Adicionar metadados
      processedData.metadata = {
        originalFilename: filename,
        processedAt: new Date().toISOString(),
        analysisLength: analysisText.length,
        hasValidData: processedData.produtos.length > 0
      };
      
      results.push({ json: processedData });
    }
    
    return results;
    
  } catch (error) {
    console.error('Erro no processamento:', error);
    return [{
      json: {
        error: true,
        message: error.message,
        produtos: [],
        metadata: {
          processedAt: new Date().toISOString(),
          hasError: true
        }
      }
    }];
  }
}

// Função para extrair nomes de perfumes
function extractPerfumeNames(analysisText, filename) {
  const result = {
    filename: filename,
    produtos: [],
    principal: null,
    secundarios: [],
    novosNomes: [],
    mapeamentos: [],
    estatisticas: {
      totalEncontrados: 0,
      principalEncontrado: false,
      secundariosEncontrados: 0,
      novosNomesDetectados: 0
    },
    debug: {
      originalText: analysisText,
      principalMatch: null,
      secundariosMatch: null
    }
  };
  
  if (!analysisText || analysisText.trim() === '') {
    result.debug.error = 'Texto de análise vazio';
    return result;
  }
  
  // Extrair produto principal
  const principalMatch = analysisText.match(REGEX_PATTERNS.principal);
  result.debug.principalMatch = principalMatch;
  
  if (principalMatch && principalMatch[2]) {
    const principalRaw = principalMatch[2].trim();
    if (!REGEX_PATTERNS.naoVisivel.test(principalRaw)) {
      const principal = processProductName(principalRaw);
      result.principal = principal;
      result.produtos.push({ ...principal, tipo: 'principal', posicao: 0 });
      result.estatisticas.principalEncontrado = true;
      result.estatisticas.totalEncontrados++;
    }
  }
  
  // Extrair produtos secundários
  const secundariosMatch = analysisText.match(REGEX_PATTERNS.secundarios);
  result.debug.secundariosMatch = secundariosMatch;
  
  if (secundariosMatch && secundariosMatch[2]) {
    const secundariosText = secundariosMatch[2];
    const itens = [...secundariosText.matchAll(REGEX_PATTERNS.itensNumerados)];
    
    itens.forEach((match, index) => {
      const itemRaw = match[1].trim();
      // Processar mesmo se parcialmente visível
      const produto = processProductName(itemRaw);
      result.secundarios.push(produto);
      result.produtos.push({ ...produto, tipo: 'secundario', posicao: index + 1 });
      result.estatisticas.secundariosEncontrados++;
      result.estatisticas.totalEncontrados++;
    });
  }
  
  // Detectar novos nomes e criar mapeamentos
  result.produtos.forEach(produto => {
    const nomeKey = produto.nome.toLowerCase();
    const isNovoNome = !PERFUME_MAPPING[nomeKey] && !isKnownBrand(produto.marca);
    
    if (isNovoNome) {
      result.novosNomes.push({
        nome: produto.nome,
        marca: produto.marca,
        nomeCompleto: produto.nomeCompleto,
        sugestaoMapeamento: generateMappingKey(produto.nome)
      });
      result.estatisticas.novosNomesDetectados++;
    }
    
    // Criar mapeamento
    result.mapeamentos.push({
      original: produto.nomeOriginal,
      processado: produto.nomeCompleto,
      chave: generateMappingKey(produto.nome),
      confianca: calculateConfidence(produto)
    });
  });
  
  return result;
}

// Função para processar nome individual do produto
function processProductName(rawName) {
  const cleaned = rawName.replace(REGEX_PATTERNS.limpeza, '').trim();
  
  // Tentar separar nome e marca
  const nomeMarcaMatch = cleaned.match(REGEX_PATTERNS.nomeMarca);
  let nome, marca;
  
  if (nomeMarcaMatch) {
    nome = nomeMarcaMatch[1].trim();
    marca = nomeMarcaMatch[2].trim();
    
    // Tratar casos onde nome ou marca são "Not visible"
    if (REGEX_PATTERNS.naoVisivel.test(nome)) {
      nome = 'Nome não identificado';
    }
    if (REGEX_PATTERNS.naoVisivel.test(marca)) {
      marca = 'Marca não identificada';
    }
  } else {
    // Se não conseguir separar, tentar identificar marca conhecida
    const marcaDetectada = detectBrand(cleaned);
    if (marcaDetectada) {
      nome = cleaned.replace(new RegExp(marcaDetectada.regex, 'gi'), '').trim();
      marca = marcaDetectada.nome;
    } else {
      nome = cleaned;
      marca = 'Marca não identificada';
    }
  }
  
  // Aplicar mapeamento se existir
  const nomeKey = nome.toLowerCase();
  const nomeMapeado = PERFUME_MAPPING[nomeKey];
  
  // Se há mapeamento, usar o nome mapeado completo, senão combinar nome + marca
  let nomeCompleto;
  if (nomeMapeado) {
    nomeCompleto = nomeMapeado;
  } else {
    nomeCompleto = `${nome} ${marca}`.trim();
  }
  
  return {
    nomeOriginal: rawName,
    nome: nome,
    marca: marca,
    nomeCompleto: nomeCompleto,
    mapeado: !!nomeMapeado,
    parcialmenteVisivel: REGEX_PATTERNS.naoVisivel.test(rawName)
  };
}

// Função para detectar marca conhecida
function detectBrand(text) {
  const brands = [
    { nome: 'Dior', regex: 'dior' },
    { nome: 'Chanel', regex: 'chanel' },
    { nome: 'Paco Rabanne', regex: 'paco\\s+rabanne|rabanne' },
    { nome: 'Carolina Herrera', regex: 'carolina\\s+herrera|herrera' },
    { nome: 'Yves Saint Laurent', regex: 'yves\\s+saint\\s+laurent|ysl' },
    { nome: 'Giorgio Armani', regex: 'giorgio\\s+armani|armani' },
    { nome: 'Lancôme', regex: 'lancôme|lancome' },
    { nome: 'Versace', regex: 'versace' },
    { nome: 'Hugo Boss', regex: 'hugo\\s+boss|boss' },
    { nome: 'Jean Paul Gaultier', regex: 'jean\\s+paul\\s+gaultier|gaultier' },
    { nome: 'Mugler', regex: 'mugler' }
  ];
  
  for (const brand of brands) {
    if (new RegExp(brand.regex, 'i').test(text)) {
      return brand;
    }
  }
  
  return null;
}

// Função para verificar se é marca conhecida
function isKnownBrand(marca) {
  const knownBrands = [
    'dior', 'chanel', 'paco rabanne', 'carolina herrera', 
    'yves saint laurent', 'giorgio armani', 'lancôme', 
    'versace', 'hugo boss', 'jean paul gaultier', 'mugler'
  ];
  
  return knownBrands.some(brand => 
    marca.toLowerCase().includes(brand) || brand.includes(marca.toLowerCase())
  );
}

// Função para gerar chave de mapeamento
function generateMappingKey(nome) {
  return nome.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para calcular confiança
function calculateConfidence(produto) {
  let confidence = 0.5; // Base
  
  if (produto.mapeado) confidence += 0.3;
  if (produto.marca !== 'Marca não identificada') confidence += 0.2;
  if (produto.nome.length > 3) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

// Executar processamento
const processedData = processImageAnalysis();

// Enviar dados para API de armazenamento (opcional)
try {
  // Configurar URL da API (ajustar conforme necessário)
  const API_BASE_URL = 'http://localhost:3000'; // ou sua URL de produção
  
  // Enviar para API apenas se houver dados válidos
  if (processedData[0]?.json?.produtos?.length > 0) {
    const webhookResponse = await fetch(`${API_BASE_URL}/api/webhook/perfume-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(processedData[0].json)
    });
    
    if (webhookResponse.ok) {
      const saveResult = await webhookResponse.json();
      console.log('✅ Resultado salvo na API:', saveResult.data?.savedAs);
      
      // Adicionar informação de salvamento aos dados
      processedData[0].json.apiStorage = {
        saved: true,
        savedAs: saveResult.data?.savedAs,
        savedAt: new Date().toISOString()
      };
    } else {
      console.warn('⚠️ Erro ao salvar na API:', webhookResponse.status);
      processedData[0].json.apiStorage = {
        saved: false,
        error: `HTTP ${webhookResponse.status}`,
        attemptedAt: new Date().toISOString()
      };
    }
  } else {
    console.log('ℹ️ Nenhum produto encontrado, não enviando para API');
  }
} catch (error) {
  console.error('❌ Erro ao conectar com API:', error.message);
  // Adicionar informação de erro aos dados
  if (processedData[0]?.json) {
    processedData[0].json.apiStorage = {
      saved: false,
      error: error.message,
      attemptedAt: new Date().toISOString()
    };
  }
}

return processedData;

// Exemplo de uso e teste
/*
Para testar este código no n8n:

1. Crie um Function Node
2. Cole este código
3. Configure entrada com dados como:
{
  "analysis": "PRINCIPAL:\nSauvage - Dior\n\nSECUNDÁRIOS:\n1. Invictus - Paco Rabanne\n2. Good Girl - Carolina Herrera\n3. La Vie Est Belle - Lancôme",
  "filename": "kit-of-3-fragrances-1-main.png"
}

4. A saída será um JSON estruturado com todos os produtos identificados
*/