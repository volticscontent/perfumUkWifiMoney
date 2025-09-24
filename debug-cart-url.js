const https = require('https');
const http = require('http');

function testCartUrl(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        };

        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data.substring(0, 1000) // Primeiros 1000 caracteres
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.end();
    });
}

async function main() {
    const testUrl = 'https://tpsfragrances.shop/cart/51141206409528:1';
    
    console.log(`Testando URL: ${testUrl}`);
    console.log('='.repeat(50));
    
    try {
        const result = await testCartUrl(testUrl);
        console.log('Resultado:');
        console.log(`Status: ${result.status}`);
        console.log('Headers:', JSON.stringify(result.headers, null, 2));
        console.log('Body (primeiros 1000 chars):');
        console.log(result.body);
        
        // Se for redirect, mostrar para onde está redirecionando
        if (result.status >= 300 && result.status < 400) {
            console.log(`\nRedirecionando para: ${result.headers.location}`);
        }
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

main();