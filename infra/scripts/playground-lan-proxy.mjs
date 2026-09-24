// Локальный мост от Windows-хоста к playground на edge для устройств Wi-Fi.
import http from "node:http";
import net from "node:net";

const [listenHost, listenPortText, edgeHost, edgePortText] = process.argv.slice(2);
const listenPort = Number(listenPortText);
const edgePort = Number(edgePortText);

if (
  net.isIP(listenHost) !== 4 ||
  net.isIP(edgeHost) !== 4 ||
  !Number.isInteger(listenPort) ||
  !Number.isInteger(edgePort) ||
  listenPort < 1 ||
  listenPort > 65535 ||
  edgePort < 1 ||
  edgePort > 65535
) {
  throw new Error("Укажите IPv4-адреса и TCP-порты: <host> <port> <edge> <port>");
}

const localPrefix = `${listenHost.split(".").slice(0, 3).join(".")}.`;
const forwardedHeaders = ["accept", "accept-language", "if-none-match", "if-modified-since", "range"];
const hopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const server = http.createServer((request, response) => {
  const clientAddress = request.socket.remoteAddress?.replace(/^::ffff:/, "") ?? "";
  if (!clientAddress.startsWith(localPrefix)) {
    response.writeHead(403).end();
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");
  const headers = Object.fromEntries(
    forwardedHeaders
      .filter((name) => request.headers[name] !== undefined)
      .map((name) => [name, request.headers[name]]),
  );

  const upstream = http.request(
    {
      hostname: edgeHost,
      port: edgePort,
      method: request.method,
      path: `${url.pathname}${url.search}`,
      headers,
      timeout: 8000,
    },
    (upstreamResponse) => {
      const responseHeaders = Object.fromEntries(
        Object.entries(upstreamResponse.headers).filter(([name]) => !hopHeaders.has(name)),
      );
      response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("timeout", () => upstream.destroy(new Error("upstream timeout")));
  upstream.on("error", (error) => {
    console.error(`Ошибка edge: ${error.message}`);
    if (!response.headersSent) response.writeHead(502);
    response.end();
  });
  request.on("aborted", () => upstream.destroy());
  upstream.end();
});

server.listen(listenPort, listenHost, () => {
  console.log(`Локальный playground: http://${listenHost}:${listenPort}/`);
});
