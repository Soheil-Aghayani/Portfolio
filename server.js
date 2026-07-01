const http = require('http');
const handler = require('serve-handler');

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: '.'
  });
});

server.listen(5000, () => {
  console.log('Server is running at: http://localhost:5000');
});
