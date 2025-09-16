const fs = require('fs');
const path = require('path');

// Função para escapar valores CSV
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  
  // Converter para string
  let str = String(value);
  
  // Se contém vírgula, quebra de linha ou aspas, envolver em aspas
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    // Escapar aspas duplicando-as
    str = str.replace(/"/g, '""');
    str = `"${str}"`;
  }
  
  return str;
}

// Função para achatar arrays em string
function flattenArray(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.join('; ');
}

// Função principal
function convertJSONToCSV() {
  try {
    // Ler o arquivo JSON
    const jsonPath = path.join(__dirname, '../data/unified_products.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    if (!jsonData.products || !Array.isArray(jsonData.products)) {
      throw new Error('Formato JSON inválido: esperado objeto com array "products"');
    }
    
    // Definir cabeçalhos CSV
    const headers = [
      'ID',
      'Handle',
      'Title',
      'Description',
      'SKU',
      'Price_Regular',
      'Price_Sale',
      'On_Sale',
      'Discount_Percent',
      'Currency',
      'Category',
      'Brands',
      'Primary_Brand',
      'Tags',
      'Main_Image',
      'Gallery_Images',
      'Is_Combo',
      'Stock_Status',
      'Stock_Quantity',
      'Weight',
      'Dimensions',
      'Created_At',
      'Updated_At'
    ];
    
    // Criar linhas CSV
    const csvRows = [headers.join(',')];
    
    jsonData.products.forEach(product => {
      const row = [
        escapeCSV(product.id),
        escapeCSV(product.handle),
        escapeCSV(product.title),
        escapeCSV(product.description),
        escapeCSV(product.sku),
        escapeCSV(product.price?.regular),
        escapeCSV(product.price?.sale),
        escapeCSV(product.price?.on_sale),
        escapeCSV(product.price?.discount_percent),
        escapeCSV(product.price?.currency),
        escapeCSV(product.category),
        escapeCSV(flattenArray(product.brands)),
        escapeCSV(product.primary_brand),
        escapeCSV(flattenArray(product.tags)),
        escapeCSV(product.images?.main?.[0]),
        escapeCSV(flattenArray(product.images?.gallery)),
        escapeCSV(product.is_combo),
        escapeCSV(product.stock?.status),
        escapeCSV(product.stock?.quantity),
        escapeCSV(product.weight),
        escapeCSV(product.dimensions),
        escapeCSV(product.created_at),
        escapeCSV(product.updated_at)
      ];
      
      csvRows.push(row.join(','));
    });
    
    // Escrever arquivo CSV
    const csvPath = path.join(__dirname, '../data/unified_products.csv');
    fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
    
    console.log(`✅ Conversão concluída!`);
    console.log(`📁 Arquivo CSV criado: ${csvPath}`);
    console.log(`📊 Total de produtos: ${jsonData.products.length}`);
    
  } catch (error) {
    console.error('❌ Erro na conversão:', error.message);
    process.exit(1);
  }
}

// Executar conversão
convertJSONToCSV();