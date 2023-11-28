const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
let server;
const clients = []; // Move clients array to the top-level scope

function startServer() {
  server = http.createServer((req, res) => {
    let filePath = '.' + req.url;

    if (filePath === './') {
      filePath = './index.html'; // default to serving index.html
    }
  
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.svg': 'application/image/svg+xml',
    }[extname] || 'application/octet-stream';
  
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('404 Not Found');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('500 Internal Server Error');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  
  });

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

function watchFiles() {
  const clients = []; // Move clients array here

  const watcher = fs.watch('.', { recursive: true }, (event, filename) => {
    console.log(`File changed: ${filename}`);
    notifyClients(clients);
  });

  watcher.on('error', (error) => {
    console.error(`Watcher error: ${error}`);
  });
}

function notifyClients(clients) {
  console.log('Notifying clients to refresh...');
  clients.forEach((res) => {
    res.write('data: update\n\n'); // Send a simple update message
  });
}

function restartServer() {
  console.log('Restarting server...');
  server.close(() => {
    console.log('Server closed. Restarting...');
    startServer();
  });
}

// Store the start time of the server
startServer();

// Watch files for changes
watchFiles();

// Create a simple HTTP endpoint for clients to connect and receive updates
http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Store the response object to send updates
  clients.push(res);

  // Send a comment to keep the connection open
  res.write(':ok\n\n');

  // Clean up the response object when the connection is closed
  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1); // Remove closed connection
  });
}).listen(3001); // Use a different port for the update server