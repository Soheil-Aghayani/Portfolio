const http = require('http');
const handler = require('serve-handler');

const PORT = 8080;
const HOST = '127.0.0.1';

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: '.'
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server is running at: http://${HOST}:${PORT}`);
  console.log(`Alternative link: http://localhost:${PORT}`);
});
