const http = require('http');
const req = http.request('http://localhost:3000/assets/index-CkrB1H9h.js', {
  headers: {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Connection': 'keep-alive',
    'Host': 'localhost:3000',
    'Referer': 'http://localhost:3000/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', d => console.log('Data received:', d.length, 'bytes'));
});
req.on('error', e => console.error(e));
req.end();
