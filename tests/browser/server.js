const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../web");
const port = 8000;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`)
    .pathname;
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(root, `.${requestedPath}`);

  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] ||
        "application/octet-stream",
    });
    response.end(content);
  });
});

server.listen(port, "127.0.0.1");

function closeServer() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
