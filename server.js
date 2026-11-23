/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const next = require('next');

const dev = false;
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();
const rawPort = process.env.ASPNETCORE_PORT || process.env.PORT || '8083';
let port = parseInt(rawPort, 10);
if (isNaN(port) || port <= 0) {
  port = 8083;
}

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Bola de Nieve en ejecución en puerto ${port}`);
  });
}).catch((err) => {
  console.error('Error al iniciar el servidor Next.js:', err);
  process.exit(1);
});
