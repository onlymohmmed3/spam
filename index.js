require("dotenv").config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const axios = require("axios");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const WebSocket = require("ws");

// =====================
// ADVANCED STATS SYSTEM
// =====================
const startTime = Date.now();

const stats = {
  c1: { 
    name: "ACCOUNT 1", 
    total: 0, 
    ar: 0, 
    en: 0, 
    ping: 0,
    lastMsg: null,
    errors: 0,
    avgSpeed: 0,
    hourlyRate: [],
    status: "initializing"
  },
  c2: { 
    name: "ACCOUNT 2", 
    total: 0, 
    ar: 0, 
    en: 0, 
    ping: 0,
    lastMsg: null,
    errors: 0,
    avgSpeed: 0,
    hourlyRate: [],
    status: "initializing"
  },
};

const systemHealth = {
  lastRestart: Date.now(),
  totalRestarts: 0,
  watchdogTriggers: 0,
  apiCalls: 0,
  errors: [],
};

let lastChangeTimes = {
  c1_ar: Date.now(),
  c1_en: Date.now(),
  c2_ar: Date.now(),
  c2_en: Date.now(),
};

const client = new Discord.Client({
  checkUpdate: false,
  ws: { properties: { browser: "Discord Client" } }
});

const client2 = new Discord.Client({
  checkUpdate: false,
  ws: { properties: { browser: "Discord Client" } }
});

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

const levelingActive = {
  c1_ar: false,
  c1_en: false,
  c2_ar: false,
  c2_en: false
};

// =====================
// WEBSOCKET
// =====================
let wss;
function broadcast(data) {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// =====================
// MESSAGE TRACKING
// =====================
function bumpCounters(acc, channelId) {
  stats[acc].total += 1;
  stats[acc].lastMsg = Date.now();
  
  if (channelId === CH_AR) {
    stats[acc].ar += 1;
    lastChangeTimes[`${acc}_ar`] = Date.now();
    console.log(`✅ [${acc.toUpperCase()}] Arabic message #${stats[acc].ar} sent`);
  }
  if (channelId === CH_EN) {
    stats[acc].en += 1;
    lastChangeTimes[`${acc}_en`] = Date.now();
    console.log(`✅ [${acc.toUpperCase()}] English message #${stats[acc].en} sent`);
  }

  const uptime = (Date.now() - startTime) / 1000 / 60;
  stats[acc].avgSpeed = (stats[acc].total / Math.max(uptime, 1)).toFixed(2);

  broadcast({ 
    type: "update", 
    account: acc, 
    stats: stats[acc] 
  });
  
  console.log(`📊 [${acc.toUpperCase()}] Total: ${stats[acc].total} | AR: ${stats[acc].ar} | EN: ${stats[acc].en} | Speed: ${stats[acc].avgSpeed}/min`);
}

// =====================
// CLIENT 1
// =====================
client.once("ready", async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  ✓ ACCOUNT 1: ${client.user.username} ONLINE          
╚═══════════════════════════════════════════════════════════╝
  `);
  
  stats.c1.name = client.user.username;
  stats.c1.status = "online";
  
  setTimeout(() => {
    try {
      console.log("🚀 [CLIENT 1] Starting leveling systems...");
      
      new userAccount(client, Discord).leveling({ 
        channel: CH_AR, 
        randomLetters: false, 
        time: 12000, 
        type: "ar" 
      });
      levelingActive.c1_ar = true;
      console.log("✓ [CLIENT 1] Arabic channel activated");
      
      new userAccount(client, Discord).leveling({ 
        channel: CH_EN, 
        randomLetters: false, 
        time: 12000, 
        type: "eng" 
      });
      levelingActive.c1_en = true;
      console.log("✓ [CLIENT 1] English channel activated");
      
    } catch (error) {
      console.error("❌ [CLIENT 1] Leveling failed:", error.message);
      stats.c1.status = "error";
    }
  }, 3000);
  
  broadcast({ type: "status", account: "c1", status: "online" });
});

client.on("messageCreate", (msg) => {
  try {
    if (msg?.author?.id === client.user?.id) {
      const channelId = msg.channel?.id;
      console.log(`📨 [CLIENT 1] Message detected in channel: ${channelId}`);
      bumpCounters("c1", channelId);
    }
  } catch (e) {
    console.error("❌ [CLIENT 1] Message error:", e.message);
  }
});

client.on("error", (err) => {
  console.error("❌ [CLIENT 1 ERROR]:", err.message);
  stats.c1.errors++;
  stats.c1.status = "error";
  systemHealth.errors.push({ time: Date.now(), account: "c1", error: err.message });
  if (systemHealth.errors.length > 50) systemHealth.errors.shift();
  broadcast({ type: "error", account: "c1", message: err.message });
});

client.on("disconnect", () => {
  console.log("⚠️  [CLIENT 1] Disconnected");
  stats.c1.status = "disconnected";
  broadcast({ type: "status", account: "c1", status: "disconnected" });
});

// =====================
// CLIENT 2
// =====================
client2.once("ready", async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  ✓ ACCOUNT 2: ${client2.user.username} ONLINE          
╚═══════════════════════════════════════════════════════════╝
  `);
  
  stats.c2.name = client2.user.username;
  stats.c2.status = "online";
  
  setTimeout(() => {
    try {
      console.log("🚀 [CLIENT 2] Starting leveling systems...");
      
      new userAccount(client2, Discord).leveling({ 
        channel: CH_AR, 
        randomLetters: false, 
        time: 12000, 
        type: "ar" 
      });
      levelingActive.c2_ar = true;
      console.log("✓ [CLIENT 2] Arabic channel activated");
      
      new userAccount(client2, Discord).leveling({ 
        channel: CH_EN, 
        randomLetters: false, 
        time: 12000, 
        type: "eng" 
      });
      levelingActive.c2_en = true;
      console.log("✓ [CLIENT 2] English channel activated");
      
    } catch (error) {
      console.error("❌ [CLIENT 2] Leveling failed:", error.message);
      stats.c2.status = "error";
    }
  }, 3000);
  
  broadcast({ type: "status", account: "c2", status: "online" });
});

client2.on("messageCreate", (msg) => {
  try {
    if (msg?.author?.id === client2.user?.id) {
      const channelId = msg.channel?.id;
      console.log(`📨 [CLIENT 2] Message detected in channel: ${channelId}`);
      bumpCounters("c2", channelId);
    }
  } catch (e) {
    console.error("❌ [CLIENT 2] Message error:", e.message);
  }
});

client2.on("error", (err) => {
  console.error("❌ [CLIENT 2 ERROR]:", err.message);
  stats.c2.errors++;
  stats.c2.status = "error";
  systemHealth.errors.push({ time: Date.now(), account: "c2", error: err.message });
  if (systemHealth.errors.length > 50) systemHealth.errors.shift();
  broadcast({ type: "error", account: "c2", message: err.message });
});

client2.on("disconnect", () => {
  console.log("⚠️  [CLIENT 2] Disconnected");
  stats.c2.status = "disconnected";
  broadcast({ type: "status", account: "c2", status: "disconnected" });
});

// =====================
// PING MONITORING
// =====================
setInterval(() => {
  stats.c1.ping = client.ws?.ping ?? stats.c1.ping;
  stats.c2.ping = client2.ws?.ping ?? stats.c2.ping;
  broadcast({ type: "ping", c1: stats.c1.ping, c2: stats.c2.ping });
}, 3000);

// =====================
// WATCHDOG
// =====================
setInterval(async () => {
  const now = Date.now();
  const limit = 5 * 60 * 1000;

  const streams = [
    { n: "Acc1 AR", t: lastChangeTimes.c1_ar, active: levelingActive.c1_ar },
    { n: "Acc1 EN", t: lastChangeTimes.c1_en, active: levelingActive.c1_en },
    { n: "Acc2 AR", t: lastChangeTimes.c2_ar, active: levelingActive.c2_ar },
    { n: "Acc2 EN", t: lastChangeTimes.c2_en, active: levelingActive.c2_en },
  ];

  for (const s of streams) {
    if (s.active && now - s.t > limit) {
      console.log(`⚠️  [WATCHDOG] Stream ${s.n} stuck! Triggering restart...`);
      systemHealth.watchdogTriggers++;
      broadcast({ type: "watchdog", stream: s.n });
      return await triggerRestart();
    }
  }
}, 60000);

async function triggerRestart() {
  const key = process.env.RENDER_API_KEY;
  const id = process.env.SERVICE_ID;

  if (!key || !id) {
    console.log("⚠️  [WATCHDOG] Missing API credentials");
    return;
  }

  try {
    await axios.post(
      `https://api.render.com/v1/services/${id}/restart`,
      {},
      { headers: { Authorization: `Bearer ${key}` } }
    );

    systemHealth.totalRestarts++;
    systemHealth.lastRestart = Date.now();

    const delay = Date.now() + 600000;
    lastChangeTimes = { c1_ar: delay, c1_en: delay, c2_ar: delay, c2_en: delay };
    
    console.log("✓ [WATCHDOG] Restart triggered");
  } catch (e) {
    console.error("❌ [WATCHDOG] Restart error:", e?.message || e);
  }
}

// =====================
// LOGIN
// =====================
console.log("\n🔐 [SYSTEM] Logging in to Discord...\n");

client.login(process.env.token).catch(err => {
  console.error("❌ [CRITICAL] Client 1 login failed:", err.message);
  console.error("💡 [HELP] Check your 'token' in .env file");
  process.exit(1);
});

client2.login(process.env.token2).catch(err => {
  console.error("❌ [CRITICAL] Client 2 login failed:", err.message);
  console.error("💡 [HELP] Check your 'token2' in .env file");
  process.exit(1);
});

// =====================
// EXPRESS SERVER
// =====================
const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));

app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}));

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/reset", strictLimiter);
app.use("/api/restart", rateLimit({ 
  windowMs: 60 * 1000, 
  max: 2, 
  standardHeaders: true, 
  legacyHeaders: false 
}));

// =====================
// AUTH MIDDLEWARE
// =====================
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return res.status(500).json({ success: false, error: "ADMIN_KEY missing" });

  const k = req.headers["x-admin-key"];
  if (!k) return res.status(401).json({ success: false, error: "Missing admin key" });

  try {
    const ok = Buffer.byteLength(k) === Buffer.byteLength(adminKey) &&
      crypto.timingSafeEqual(Buffer.from(k), Buffer.from(adminKey));
    if (!ok) return res.status(403).json({ success: false, error: "Invalid admin key" });
  } catch {
    return res.status(403).json({ success: false, error: "Invalid admin key" });
  }

  next();
}

function requireReadKey(req, res, next) {
  const readKey = process.env.READ_KEY;
  if (!readKey) return res.status(500).json({ ok: false, error: "READ_KEY missing" });

  const k = req.headers["x-read-key"];
  if (!k) return res.status(401).json({ ok: false, error: "Missing read key" });

  try {
    const ok = Buffer.byteLength(k) === Buffer.byteLength(readKey) &&
      crypto.timingSafeEqual(Buffer.from(k), Buffer.from(readKey));
    if (!ok) return res.status(403).json({ ok: false, error: "Invalid read key" });
  } catch {
    return res.status(403).json({ ok: false, error: "Invalid read key" });
  }

  next();
}

// =====================
// DATA BUILDER
// =====================
function buildDataPayload() {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.max(s / 60, 1);

  return {
    uptime: {
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      s: s % 60,
      total: s,
    },
    stats,
    speed: {
      c1: (stats.c1.total / mins).toFixed(1),
      c2: (stats.c2.total / mins).toFixed(1),
    },
    health: systemHealth,
    levelingActive,
    timestamp: Date.now(),
  };
}

// =====================
// API ENDPOINTS
// =====================
app.get("/api/health", requireReadKey, (req, res) => {
  systemHealth.apiCalls++;
  res.json({ ok: true, time: Date.now(), health: systemHealth });
});

app.get("/api/data", requireReadKey, (req, res) => {
  systemHealth.apiCalls++;
  res.json(buildDataPayload());
});

app.get("/api/public-data", (req, res) => {
  systemHealth.apiCalls++;
  res.json(buildDataPayload());
});

app.post("/api/reset", requireAdminKey, (req, res) => {
  console.log("🔄 [API] Reset triggered");
  stats.c1 = { ...stats.c1, total: 0, ar: 0, en: 0, errors: 0, hourlyRate: [] };
  stats.c2 = { ...stats.c2, total: 0, ar: 0, en: 0, errors: 0, hourlyRate: [] };
  broadcast({ type: "reset" });
  res.json({ success: true });
});

app.post("/api/restart", requireAdminKey, async (req, res) => {
  const key = process.env.RENDER_API_KEY;
  const id = process.env.SERVICE_ID;

  if (!key || !id) {
    return res.status(500).json({ 
      success: false, 
      error: "Missing RENDER_API_KEY or SERVICE_ID" 
    });
  }

  try {
    console.log("🔄 [API] Manual restart triggered");
    await axios.post(
      `https://api.render.com/v1/services/${id}/restart`,
      {},
      { headers: { Authorization: `Bearer ${key}` } }
    );
    systemHealth.totalRestarts++;
    broadcast({ type: "restart" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || String(e) });
  }
});

// =====================
// DASHBOARD
// =====================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELITE CONTROL CENTER 2026</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --primary: #00ff88;
            --secondary: #00d4ff;
            --danger: #ff4757;
        }
        
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a1f 0%, #1a0a2e 50%, #0a0a1f 100%);
            font-family: 'Inter', sans-serif;
            color: #fff;
        }
        
        .container {
            max-width: 1800px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .logo {
            font-family: 'Orbitron', monospace;
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 5px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 0.9rem;
            letter-spacing: 4px;
            opacity: 0.6;
            text-transform: uppercase;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 25px;
            padding: 30px;
            transition: all 0.4s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 60px rgba(0, 255, 136, 0.2);
            border-color: rgba(0, 255, 136, 0.3);
        }
        
        .stat-label {
            font-size: 0.75rem;
            letter-spacing: 2px;
            opacity: 0.7;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        
        .stat-value {
            font-family: 'Orbitron', monospace;
            font-size: 3.5rem;
            font-weight: 900;
            line-height: 1;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #fff, var(--primary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .stat-details {
            display: flex;
            gap: 20px;
            font-size: 0.85rem;
            opacity: 0.8;
        }
        
        .stat-details b {
            color: var(--primary);
            font-size: 1.2rem;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
        }
        
        .panel {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 30px;
            padding: 35px;
        }
        
        .panel-title {
            font-family: 'Orbitron', monospace;
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 25px;
            color: var(--primary);
        }
        
        .account-grid {
            display: grid;
            gap: 20px;
        }
        
        .account-item {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 25px;
            transition: all 0.3s ease;
        }
        
        .account-item:hover {
            background: rgba(0, 0, 0, 0.5);
            border-color: var(--primary);
        }
        
        .account-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .account-name {
            font-family: 'Orbitron', monospace;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--secondary);
        }
        
        .ping-badge {
            background: rgba(0, 212, 255, 0.2);
            color: var(--secondary);
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .metrics-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        
        .metric {
            text-align: center;
            padding: 12px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
        }
        
        .metric-label {
            font-size: 0.7rem;
            opacity: 0.6;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-family: 'Orbitron', monospace;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        .controls {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .input-group label {
            font-size: 0.85rem;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            display: block;
        }
        
        input[type="password"] {
            width: 100%;
            padding: 15px 20px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            color: #fff;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
        }
        
        input[type="password"]:focus {
            border-color: var(--primary);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        }
        
        .btn-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .btn {
            padding: 18px 30px;
            border: none;
            border-radius: 15px;
            font-family: 'Orbitron', monospace;
            font-size: 0.9rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-reset {
            background: linear-gradient(135deg, #ff4757, #ff6348);
            color: #fff;
        }
        
        .btn-reset:hover {
            box-shadow: 0 10px 30px rgba(255, 71, 87, 0.4);
            transform: translateY(-2px);
        }
        
        .btn-restart {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: #000;
        }
        
        .btn-restart:hover {
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.4);
            transform: translateY(-2px);
        }
        
        .health-grid {
            display: grid;
            gap: 15px;
            margin-top: 30px;
        }
        
        .health-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            border-left: 3px solid var(--primary);
        }
        
        .health-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .health-value {
            font-family: 'Orbitron', monospace;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid var(--primary);
            border-radius: 15px;
            padding: 20px 25px;
            color: #fff;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.5s ease;
            box-shadow: 0 10px 40px rgba(0, 255, 136, 0.3);
        }
        
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .logo { font-size: 2rem; }
            .stat-value { font-size: 2.5rem; }
            .main-grid { grid-template-columns: 1fr; }
            .btn-group { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ELITE CONTROL</div>
            <div class="subtitle">Advanced Discord Automation System 2026</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">SYSTEM UPTIME</div>
                <div class="stat-value" id="uptime">0d 0h 0m</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">TOTAL MESSAGES</div>
                <div class="stat-value" id="totalMsg">0</div>
                <div class="stat-details">
                    <span>Account 1: <b id="t1">0</b></span>
                    <span>Account 2: <b id="t2">0</b></span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">AVERAGE SPEED</div>
                <div class="stat-value" id="avgSpeed">0</div>
                <div class="stat-details">
                    <span>MSG/MIN</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">SYSTEM HEALTH</div>
                <div class="stat-value" id="healthStatus">100%</div>
                <div class="stat-details">
                    <span>Restarts: <b id="restarts">0</b></span>
                    <span>Errors: <b id="errors">0</b></span>
                </div>
            </div>
        </div>

        <div class="main-grid">
            <div class="panel">
                <div class="panel-title">ACCOUNTS STATUS</div>
                <div class="account-grid">
                    <div class="account-item">
                        <div class="account-header">
                            <div class="account-name" id="n1">ACCOUNT 1</div>
                            <div class="ping-badge"><span id="p1">0</span>ms</div>
                        </div>
                        <div class="metrics-row">
                            <div class="metric">
                                <div class="metric-label">Total</div>
                                <div class="metric-value" id="total1">0</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Arabic</div>
                                <div class="metric-value" id="ar1">0</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">English</div>
                                <div class="metric-value" id="en1">0</div>
                            </div>
                        </div>
                    </div>

                    <div class="account-item">
                        <div class="account-header">
                            <div class="account-name" id="n2">ACCOUNT 2</div>
                            <div class="ping-badge"><span id="p2">0</span>ms</div>
                        </div>
                        <div class="metrics-row">
                            <div class="metric">
                                <div class="metric-label">Total</div>
                                <div class="metric-value" id="total2">0</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Arabic</div>
                                <div class="metric-value" id="ar2">0</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">English</div>
                                <div class="metric-value" id="en2">0</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-title">CONTROL CENTER</div>
                <div class="controls">
                    <div class="input-group">
                        <label>ADMIN KEY</label>
                        <input id="adminkey" type="password" placeholder="Enter your admin key" />
                    </div>
                    
                    <div class="btn-group">
                        <button class="btn btn-reset" onclick="executeAction('reset')">RESET DATA</button>
                        <button class="btn btn-restart" onclick="executeAction('restart')">RESTART SYSTEM</button>
                    </div>

                    <div class="health-grid">
                        <div class="health-item">
                            <span class="health-label">API Calls</span>
                            <span class="health-value" id="apiCalls">0</span>
                        </div>
                        <div class="health-item">
                            <span class="health-label">Watchdog Triggers</span>
                            <span class="health-value" id="watchdog">0</span>
                        </div>
                        <div class="health-item">
                            <span class="health-label">Last Update</span>
                            <span class="health-value" id="lastUpdate">Just now</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let lastUpdateTime = Date.now();
        
        function showNotification(message, type = 'success') {
            const notif = document.createElement('div');
            notif.className = 'notification';
            notif.textContent = message;
            notif.style.borderColor = type === 'success' ? 'var(--primary)' : 'var(--danger)';
            document.body.appendChild(notif);
            
            setTimeout(() => {
                notif.style.animation = 'slideIn 0.5s ease reverse';
                setTimeout(() => notif.remove(), 500);
            }, 3000);
        }

        async function executeAction(type) {
            const adminKey = document.getElementById('adminkey').value.trim();
            
            if (!adminKey) {
                showNotification('Please enter admin key', 'error');
                return;
            }
            
            if (!confirm(\`Are you sure you want to \${type} the system?\`)) return;

            try {
                const response = await fetch(\`/api/\${type}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': adminKey
                    },
                    body: JSON.stringify({})
                });

                const result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification(\`\${type.toUpperCase()} successful!\`, 'success');
                    if (type === 'restart') {
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        location.reload();
                    }
                } else {
                    showNotification(result.error || 'Action failed', 'error');
                }
            } catch (e) {
                showNotification('Network error', 'error');
            }
        }

        async function updateData() {
            try {
                const response = await fetch('/api/public-data');
                if (!response.ok) return;
                
                const data = await response.json();
                lastUpdateTime = Date.now();

                const u = data.uptime;
                document.getElementById('uptime').textContent = \`\${u.d}d \${u.h}h \${u.m}m\`;

                const total = data.stats.c1.total + data.stats.c2.total;
                document.getElementById('totalMsg').textContent = total.toLocaleString();
                document.getElementById('t1').textContent = data.stats.c1.total.toLocaleString();
                document.getElementById('t2').textContent = data.stats.c2.total.toLocaleString();

                const avgSpeed = ((parseFloat(data.speed.c1) + parseFloat(data.speed.c2)) / 2).toFixed(1);
                document.getElementById('avgSpeed').textContent = avgSpeed;

                const errorCount = data.stats.c1.errors + data.stats.c2.errors;
                document.getElementById('errors').textContent = errorCount;
                document.getElementById('restarts').textContent = data.health.totalRestarts;
                
                const healthPercent = Math.max(0, 100 - (errorCount * 2));
                document.getElementById('healthStatus').textContent = healthPercent + '%';

                updateAccount(1, data.stats.c1);
                updateAccount(2, data.stats.c2);

                document.getElementById('apiCalls').textContent = data.health.apiCalls.toLocaleString();
                document.getElementById('watchdog').textContent = data.health.watchdogTriggers;

            } catch (e) {
                console.error('Update error:', e);
            }
        }

        function updateAccount(num, stats) {
            document.getElementById(\`n\${num}\`).textContent = stats.name;
            document.getElementById(\`p\${num}\`).textContent = stats.ping;
            document.getElementById(\`total\${num}\`).textContent = stats.total.toLocaleString();
            document.getElementById(\`ar\${num}\`).textContent = stats.ar.toLocaleString();
            document.getElementById(\`en\${num}\`).textContent = stats.en.toLocaleString();
        }

        updateData();
        setInterval(updateData, 1500);
        
        setInterval(() => {
            const timeDiff = Math.floor((Date.now() - lastUpdateTime) / 1000);
            document.getElementById('lastUpdate').textContent = 
                timeDiff < 5 ? 'Just now' : \`\${timeDiff}s ago\`;
        }, 1000);
    </script>
</body>
</html>
  `);
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 2000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🚀 ELITE DISCORD LEVELING SYSTEM 2026             ║
║        Advanced Automation & Control Center               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

✓ Web Server: http://localhost:${PORT}
✓ Dashboard: http://localhost:${PORT}
✓ API: http://localhost:${PORT}/api/public-data

📍 AR Channel: ${CH_AR}
📍 EN Channel: ${CH_EN}
⏱️  Message Interval: 12 seconds

⏳ Waiting for Discord connections...
  `);
});

// WebSocket
wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔌 [WS] Client connected");
  
  ws.send(JSON.stringify({ 
    type: "init", 
    data: buildDataPayload(),
    levelingStatus: levelingActive
  }));

  ws.on("close", () => {
    console.log("🔌 [WS] Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("❌ [WS ERROR]:", err.message);
  });
});

// Status Log
setInterval(() => {
  const uptime = Math.floor((Date.now() - startTime) / 1000 / 60);
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║ STATUS UPDATE - Uptime: ${uptime} minutes
╠═══════════════════════════════════════════════════════════╣
║ Account 1: ${stats.c1.total} msgs (AR: ${stats.c1.ar} | EN: ${stats.c1.en}) | ${stats.c1.status}
║ Account 2: ${stats.c2.total} msgs (AR: ${stats.c2.ar} | EN: ${stats.c2.en}) | ${stats.c2.status}
║ Total: ${stats.c1.total + stats.c2.total} messages
║ Errors: ${systemHealth.errors.length}
╚═══════════════════════════════════════════════════════════╝
  `);
}, 30000);

console.log("\n✨ [SYSTEM] All systems initialized. Ready!\n");
