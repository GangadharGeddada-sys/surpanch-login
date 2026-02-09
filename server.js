const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const PORT = process.env.PORT || 8000;
const baseDir = __dirname;
const villagesPath = path.join(baseDir, "data", "villages.json");
const sarpanchesPath = path.join(baseDir, "data", "sarpanches.json");

const otpStore = new Map();
const verificationStore = new Set();
const adminSessions = new Set();

const villagesData = JSON.parse(fs.readFileSync(villagesPath, "utf-8"));
const sarpanchesData = JSON.parse(fs.readFileSync(sarpanchesPath, "utf-8"));

const send = (res, code, payload, headers = {}) => {
  res.writeHead(code, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(payload));
};

const parseBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });

const findVillage = (district, mandal, village) => {
  const districtObj = villagesData.districts.find((d) => d.name === district);
  const mandalObj = districtObj?.mandals.find((m) => m.name === mandal);
  return mandalObj?.villages.find((v) => v.name === village);
};

const serveStatic = (req, res) => {
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(baseDir, decodeURIComponent(filePath.split("?")[0]));

  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain" });
    res.end(content);
  });
};

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/locations") && req.method === "GET") {
    return send(res, 200, villagesData);
  }

  if (req.url.startsWith("/api/sarpanches") && req.method === "GET") {
    return send(res, 200, sarpanchesData);
  }

  if (req.url.startsWith("/api/otp/send") && req.method === "POST") {
    const body = await parseBody(req);
    if (!body.mobile || !body.district || !body.mandal || !body.village) {
      return send(res, 400, { message: "Missing required fields." });
    }

    const village = findVillage(body.district, body.mandal, body.village);
    if (!village) {
      return send(res, 404, { message: "Village not found." });
    }

    const requestId = randomUUID();
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(requestId, { otp, mobile: body.mobile, expiresAt });
    console.log(`[OTP] ${body.mobile} => ${otp}`);

    return send(res, 200, {
      requestId,
      message: "OTP generated successfully by backend.",
      devOtp: otp
    });
  }

  if (req.url.startsWith("/api/otp/verify") && req.method === "POST") {
    const body = await parseBody(req);
    const record = otpStore.get(body.requestId);

    if (!record || Date.now() > record.expiresAt || record.otp !== body.otp) {
      return send(res, 401, { message: "Invalid or expired OTP." });
    }

    otpStore.delete(body.requestId);
    const verificationToken = randomUUID();
    verificationStore.add(verificationToken);

    return send(res, 200, { verificationToken, message: "OTP verified." });
  }

  if (req.url.startsWith("/api/sarpanch/login") && req.method === "POST") {
    const body = await parseBody(req);
    if (!verificationStore.has(body.verificationToken)) {
      return send(res, 401, { message: "OTP verification required." });
    }

    const village = findVillage(body.district, body.mandal, body.village);
    if (!village) {
      return send(res, 404, { message: "Village not found." });
    }

    verificationStore.delete(body.verificationToken);
    return send(res, 200, {
      state: "Andhra Pradesh",
      district: body.district,
      mandal: body.mandal,
      village
    });
  }

  if (req.url.startsWith("/api/admin/login") && req.method === "POST") {
    const body = await parseBody(req);
    if (body.email !== "admin@gmail.com" || body.password !== "12345") {
      return send(res, 401, { message: "Invalid admin credentials." });
    }

    const token = randomUUID();
    adminSessions.add(token);
    return send(res, 200, { token, message: "Admin login successful." });
  }

  if (req.url.startsWith("/api/admin/sarpanches") && req.method === "GET") {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !adminSessions.has(token)) {
      return send(res, 401, { message: "Unauthorized." });
    }
    return send(res, 200, sarpanchesData);
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
