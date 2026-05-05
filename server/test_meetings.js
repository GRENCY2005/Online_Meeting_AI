const http = require('http');

const data = JSON.stringify({
  meetingId: 'test-meeting-123',
  description: 'Testing Fallback',
  dateTime: new Date(Date.now() + 86400000).toISOString(),
  createdBy: 'test-user'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/meetings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('POST Response:', res.statusCode, body));
});
req.on('error', error => console.error(error));
req.write(data);
req.end();

setTimeout(() => {
  http.get('http://localhost:3001/api/meetings', (res) => {
     let body = '';
     res.on('data', d => body += d);
     res.on('end', () => console.log('GET Response:', res.statusCode, body));
  });
}, 1000);
