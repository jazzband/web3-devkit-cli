/**
 * {{projectName}} API — minimal health server (expand in later milestones)
 */
import http from "node:http";
import { apiLog } from "./logger.js";

const port = Number(process.env.API_PORT ?? 3001);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, project: "{{projectName}}" }));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

server.listen(port, () => {
  apiLog.info(`{{projectName}} API listening on http://localhost:${port}`);
});
