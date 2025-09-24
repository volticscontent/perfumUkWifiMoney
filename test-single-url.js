const { exec } = require('child_process');

// URL de teste
const testUrl = 'https://tpsfragrances.shop/cart/51141206409528:1';

console.log('🧪 Testando abertura de URL no navegador...');
console.log(`🔗 URL: ${testUrl}\n`);

// Função para abrir URL no navegador
function openUrl(url) {
  return new Promise((resolve) => {
    // Comando específico para Windows
    const command = `start "" "${url}"`;
    
    console.log(`📋 Executando comando: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        resolve(false);
      } else {
        console.log(`✅ Comando executado com sucesso!`);
        if (stdout) console.log(`📤 Stdout: ${stdout}`);
        if (stderr) console.log(`⚠️  Stderr: ${stderr}`);
        resolve(true);
      }
    });
  });
}

async function testSingleUrl() {
  console.log('🚀 Iniciando teste...\n');
  
  const success = await openUrl(testUrl);
  
  if (success) {
    console.log('\n🎉 URL aberta com sucesso no navegador!');
    console.log('🛒 Verifique se uma nova aba foi aberta com o checkout.');
  } else {
    console.log('\n❌ Falha ao abrir URL no navegador.');
    console.log('💡 Possíveis soluções:');
    console.log('   1. Copie e cole a URL manualmente no navegador');
    console.log('   2. Verifique se há um navegador padrão configurado');
    console.log('   3. Execute o comando manualmente: start "" "' + testUrl + '"');
  }
}

// Executar teste
testSingleUrl().catch(console.error);