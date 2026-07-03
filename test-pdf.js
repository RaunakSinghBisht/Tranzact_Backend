const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/transactions/historyPDF',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let size = 0;
  res.on('data', (chunk) => {
    size += chunk.length;
    console.log(`Received ${chunk.length} bytes. Total: ${size}`);
  });
  
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(JSON.stringify({
  accountId: '6a38f3c2c7c33cb3b25a5db2',
  fromDate: '2026-06-23',
  toDate: '2026-06-25'
}));
req.end();
