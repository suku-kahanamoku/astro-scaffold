import http from "node:http";
const user = {
  id: 7,
  email: "user@example.test",
  first_name: "Test",
  last_name: "Account",
  role: "user",
};
const tokens = new Set();
let counter = 0;
http
  .createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: status === 200, data }));
    };
    if (req.url === "/health") return send(200, null);
    if (
      req.headers["x-internal-key"] !== "test-only-secret" ||
      req.headers["x-forwarded-host"] !== "scaffold.test"
    )
      return send(403, null);
    let body = "";
    for await (const chunk of req) body += chunk;
    if (req.url === "/auth/login" && req.method === "POST") {
      const data = JSON.parse(body);
      if (data.email !== user.email || data.password !== "test-password")
        return send(401, null);
      const token = (++counter).toString(16).padStart(64, "0");
      tokens.add(token);
      return send(200, { ...user, token, expires_at: "2026-12-01 12:00:00" });
    }
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!tokens.has(token)) return send(401, null);
    if (req.url === "/auth/me")
      return send(200, { ...user, private_field: "should-not-leak" });
    if (req.url === "/auth/logout") {
      tokens.delete(token);
      return send(200, null);
    }
    send(404, null);
  })
  .listen(4399, "127.0.0.1");
