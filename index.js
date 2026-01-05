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

const client = new Discord.Client();
const client2 = new Discord.Client();

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

// Leveling status tracker
const levelingActive = {
  c1_ar: false,
  c1_en: false,
  c2_ar: false,
  c2_en: false
};

// =====================
// WEBSOCKET FOR REAL-TIME UPDATES
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
// DISCORD CLIENTS SETUP
// =====================
// =====================
// LEVELING SYSTEM WITH ERROR HANDLING
// =====================
let levelingActive = {
  c1_ar: false,
  c1_en: false,
  c2_ar: false,
  c2_en: false
};

// Wait for clients to be ready before starting leveling
client.once("ready", async () => {
  console.log(`[SYSTEM] Account 1: ${client.user.username} is ONLINE`);
  stats.c1.name = client.user.username;
  stats.c1.status = "online";
  
  // Wait 3 seconds then start leveling
  setTimeout(() => {
    try {
      console.log("[LEVELING] Starting Account 1 leveling systems...");
      
      new userAccount(client, Discord).leveling({ 
        channel: CH_AR, 
        randomLetters: false, 
        time: 12000, 
        type: "ar" 
      });
      levelingActive.c1_ar = true;
      console.log("[✓] Client 1 - AR channel active");
      
      new userAccount(client, Discord).leveling({ 
        channel: CH_EN, 
        randomLetters: false, 
        time: 12000, 
        type: "eng" 
      });
      levelingActive.c1_en = true;
      console.log("[✓] Client 1 - EN channel active");
      
    } catch (error) {
      console.error("[✗] Account 1 leveling failed:", error.message);
    }
  }, 3000);
  
  broadcast({ type: "status", account: "c1", status: "online" });
});

client2.once("ready", async () => {
  console.log(`[SYSTEM] Account 2: ${client2.user.username} is ONLINE`);
  stats.c2.name = client2.user.username;
  stats.c2.status = "online";
  
  // Wait 3 seconds then start leveling
  setTimeout(() => {
    try {
      console.log("[LEVELING] Starting Account 2 leveling systems...");
      
      new userAccount(client2, Discord).leveling({ 
        channel: CH_AR, 
        randomLetters: false, 
        time: 12000, 
        type: "ar" 
      });
      levelingActive.c2_ar = true;
      console.log("[✓] Client 2 - AR channel active");
      
      new userAccount(client2, Discord).leveling({ 
        channel: CH_EN, 
        randomLetters: false, 
        time: 12000, 
        type: "eng" 
      });
      levelingActive.c2_en = true;
      console.log("[✓] Client 2 - EN channel active");
      
    } catch (error) {
      console.error("[✗] Account 2 leveling failed:", error.message);
    }
  }, 3000);
  
  broadcast({ type: "status", account: "c2", status: "online" });
});

// Error handling with logging
client.on("error", (err) => {
  console.error("[CLIENT 1 ERROR]:", err.message);
  stats.c1.errors++;
  stats.c1.status = "error";
  systemHealth.errors.push({ time: Date.now(), account: "c1", error: err.message });
  if (systemHealth.errors.length > 50) systemHealth.errors.shift();
  broadcast({ type: "error", account: "c1", message: err.message });
});

client2.on("error", (err) => {
  console.error("[CLIENT 2 ERROR]:", err.message);
  stats.c2.errors++;
  stats.c2.status = "error";
  systemHealth.errors.push({ time: Date.now(), account: "c2", error: err.message });
  if (systemHealth.errors.length > 50) systemHealth.errors.shift();
  broadcast({ type: "error", account: "c2", message: err.message });
});

// Connection status monitoring
client.on("disconnect", () => {
  console.log("[CLIENT 1] Disconnected");
  stats.c1.status = "disconnected";
  broadcast({ type: "status", account: "c1", status: "disconnected" });
});

client2.on("disconnect", () => {
  console.log("[CLIENT 2] Disconnected");
  stats.c2.status = "disconnected";
  broadcast({ type: "status", account: "c2", status: "disconnected" });
});

// Ping monitoring
setInterval(() => {
  stats.c1.ping = client.ws?.ping ?? stats.c1.ping;
  stats.c2.ping = client2.ws?.ping ?? stats.c2.ping;
  broadcast({ type: "ping", c1: stats.c1.ping, c2: stats.c2.ping });
}, 3000);

// =====================
// LEVELING SYSTEM WITH ERROR HANDLING
// =====================
let levelingActive = {
  c1_ar: false,
  c1_en: false,
  c2_ar: false,
  c2_en: false
};

// Wait for clients to be ready before starting leveling
client.once("ready", async () => {
  console.log(`[SYSTEM] Account 1: ${client.user.username} is ONLINE`);
  stats.c1.name = client.user.username;
  stats.c1.status = "online";
  
  // Wait 3 seconds then start leveling
  setTimeout(() => {
    try {
      console.log("[LEVELING] Starting Account 1 leveling systems...");
      
      new userAccount(client, Discord).leveling({ 
        channel: CH_AR, 
        randomLetters: false, 
        time: 12000, 
        type: "ar" 
      });
      levelingActive.c1_ar = true;
      console.log("[✓] Client 1 - AR channel active");
      
      new userAccount(client, Discord).leveling({ 
        channel: CH_EN, 
        randomLetters: false, 
        time: 12000, 
        type: "eng" 
      });
      levelingActive.c1_en = true;
      console.log("[✓] Client 1 - EN channel active");
      
    } catch (error) {
      console.error("[✗] Account 1 leveling failed:", error.message);
    }
  }, 3000);
  
  broadcast({ type: "status", account: "c1", status: "online" });
});

client2.once("ready", async () => {
  console.log(`[SYSTEM] Account 2: ${client2.user.username} is ONLINE`);
  stats.c2.name = client2.user.username;
  stats.c2.status = "online";
  
  // Wait 3 seconds then start leveling
  setTimeout(() => {
    try {
      console.log("[LEVELING] Starting Account 2 leveling systems...");
      
      new userAccount(client2, Discord).leveling({ 
        channel: CH_AR, 
        randomLetters: false, 
        time: 12000, 
        type: "ar" 
      });
      levelingActive.c2_ar = true;
      console.log("[✓] Client 2 - AR channel active");
      
      new userAccount(client2, Discord).leveling({ 
        channel: CH_EN, 
        randomLetters: false, 
        time: 12000, 
        type: "eng" 
      });
      levelingActive.c2_en = true;
      console.log("[✓] Client 2 - EN channel active");
      
    } catch (error) {
      console.error("[✗] Account 2 leveling failed:", error.message);
    }
  }, 3000);
  
  broadcast({ type: "status", account: "c2", status: "online" });
});

// Error handling with logging
client.on("error", (err) => {
  console.error("[CLIENT 1 ERROR]:", err.message);
  stats.c1.errors++;
  stats.c1.status = "error";
  systemHealth.errors.push({ time: Date.now(), account: "c1", error: err.message });
  if (systemHealth.errors.length > 50) systemHealth.errors.shift();
  broadcast({ type: "error", account: "c1", message: err.message });
});

client2.on("error", (err) => {
  console.error("[CLIENT 2 ERROR]:", err.message);
  stats.c2.errors++;
  stats.c2.status = "error";
  systemHealth.errors.push({ time: Date.now(), account: "c2", error: err.message });
  if (systemHealth.errors.length > 50) systemHealth.errors.shift();
  broadcast({ type: "error", account: "c2", message: err.message });
});

// Connection status monitoring
client.on("disconnect", () => {
  console.log("[CLIENT 1] Disconnected");
  stats.c1.status = "disconnected";
  broadcast({ type: "status", account: "c1", status: "disconnected" });
});

client2.on("disconnect", () => {
  console.log("[CLIENT 2] Disconnected");
  stats.c2.status = "disconnected";
  broadcast({ type: "status", account: "c2", status: "disconnected" });
});

// Ping monitoring
setInterval(() => {
  stats.c1.ping = client.ws?.ping ?? stats.c1.ping;
  stats.c2.ping = client2.ws?.ping ?? stats.c2.ping;
  broadcast({ type: "ping", c1: stats.c1.ping, c2: stats.c2.ping });
}, 3000);
function bumpCounters(acc, channelId) {
  stats[acc].total += 1;
  stats[acc].lastMsg = Date.now();
  
  if (channelId === CH_AR) {
    stats[acc].ar += 1;
    lastChangeTimes[`${acc}_ar`] = Date.now();
  }
  if (channelId === CH_EN) {
    stats[acc].en += 1;
    lastChangeTimes[`${acc}_en`] = Date.now();
  }

  // Calculate average speed
  const uptime = (Date.now() - startTime) / 1000 / 60;
  stats[acc].avgSpeed = (stats[acc].total / Math.max(uptime, 1)).toFixed(2);

  // Broadcast real-time update
  broadcast({ 
    type: "update", 
    account: acc, 
    stats: stats[acc] 
  });
}

client.on("messageCreate", (msg) => {
  try {
    if (msg?.author?.id === client.user?.id) {
      bumpCounters("c1", msg.channel?.id);
      console.log(`[C1] Message sent in channel ${msg.channel?.id}`);
    }
  } catch (e) {
    console.error("[C1 MESSAGE ERROR]:", e.message);
  }
});

client2.on("messageCreate", (msg) => {
  try {
    if (msg?.author?.id === client2.user?.id) {
      bumpCounters("c2", msg.channel?.id);
      console.log(`[C2] Message sent in channel ${msg.channel?.id}`);
    }
  } catch (e) {
    console.error("[C2 MESSAGE ERROR]:", e.message);
  }
});

// =====================
// INTELLIGENT WATCHDOG SYSTEM
// =====================
setInterval(async () => {
  const now = Date.now();
  const limit = 5 * 60 * 1000;

  const streams = [
    { n: "Acc1 AR", t: lastChangeTimes.c1_ar },
    { n: "Acc1 EN", t: lastChangeTimes.c1_en },
    { n: "Acc2 AR", t: lastChangeTimes.c2_ar },
    { n: "Acc2 EN", t: lastChangeTimes.c2_en },
  ];

  for (const s of streams) {
    if (now - s.t > limit) {
      console.log(`[WATCHDOG] Stream ${s.n} stuck! Triggering restart...`);
      systemHealth.watchdogTriggers++;
      broadcast({ type: "watchdog", stream: s.n });
      return await triggerRestart();
    }
  }
}, 60000);

async function triggerRestart() {
  const key = process.env.RENDER_API_KEY;
  const id = process.env.SERVICE_ID;

  if (!key || !id) return;

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
  } catch (e) {
    console.error("Auto-Restart Error:", e?.message || e);
  }
}

client.login(process.env.token).catch(err => {
  console.error("[CRITICAL] Client 1 login failed:", err.message);
  console.error("[HELP] Check your token in .env file");
});

client2.login(process.env.token2).catch(err => {
  console.error("[CRITICAL] Client 2 login failed:", err.message);
  console.error("[HELP] Check your token2 in .env file");
});

// =====================
// EXPRESS SERVER SETUP
// =====================
const app = express();
app.set("trust proxy", 1);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

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
// AUTHENTICATION MIDDLEWARE
// =====================
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return res.status(500).json({ success: false, error: "ADMIN_KEY missing" });

  const k = req.headers["x-admin-key"];
  if (!k) return res.status(401).json({ success: false, error: "Missing admin key" });

  try {
    const ok =
      Buffer.byteLength(k) === Buffer.byteLength(adminKey) &&
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
    const ok =
      Buffer.byteLength(k) === Buffer.byteLength(readKey) &&
      crypto.timingSafeEqual(Buffer.from(k), Buffer.from(readKey));
    if (!ok) return res.status(403).json({ ok: false, error: "Invalid read key" });
  } catch {
    return res.status(403).json({ ok: false, error: "Invalid read key" });
  }

  next();
}

// =====================
// DATA PAYLOAD BUILDER
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
// ULTRA-ADVANCED DASHBOARD
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
            --dark: #0a0a1f;
            --glass: rgba(255, 255, 255, 0.03);
            --glow: 0 0 30px rgba(0, 255, 136, 0.3);
        }
        
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a1f 0%, #1a0a2e 50%, #0a0a1f 100%);
            font-family: 'Inter', sans-serif;
            color: #fff;
            overflow-x: hidden;
            position: relative;
        }
        
        /* Animated Background */
        .bg-animation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            background: var(--primary);
            border-radius: 50%;
            animation: float 20s infinite;
            opacity: 0.1;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(100px, -100px) scale(1.2); }
            66% { transform: translate(-100px, 100px) scale(0.8); }
        }
        
        /* Container */
        .container {
            position: relative;
            z-index: 1;
            max-width: 1800px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 40px;
            animation: slideDown 0.8s ease;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .logo {
            font-family: 'Orbitron', monospace;
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 5px;
            text-shadow: var(--glow);
            margin-bottom: 10px;
            animation: glow 2s ease-in-out infinite;
        }
        
        @keyframes glow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
        }
        
        .subtitle {
            font-size: 0.9rem;
            letter-spacing: 4px;
            opacity: 0.6;
            text-transform: uppercase;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: var(--glass);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 25px;
            padding: 30px;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: fadeIn 0.6s ease backwards;
        }
        
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            transform: scaleX(0);
            transition: transform 0.4s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 60px rgba(0, 255, 136, 0.2);
            border-color: rgba(0, 255, 136, 0.3);
        }
        
        .stat-card:hover::before {
            transform: scaleX(1);
        }
        
        .stat-label {
            font-size: 0.75rem;
            letter-spacing: 2px;
            opacity: 0.7;
            text-transform: uppercase;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--primary);
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
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
        
        .stat-details span {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .stat-details b {
            color: var(--primary);
            font-size: 1.2rem;
        }
        
        /* Main Grid */
        .main-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .panel {
            background: var(--glass);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 30px;
            padding: 35px;
            animation: fadeIn 0.8s ease backwards;
        }
        
        .panel-title {
            font-family: 'Orbitron', monospace;
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
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
            margin-bottom: 15px;
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
        
        /* Progress Bar */
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
            margin-top: 15px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 10px;
            transition: width 0.5s ease;
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: -100% 0; }
            100% { background-position: 100% 0; }
        }
        
        /* Control Panel */
        .controls {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .input-group label {
            font-size: 0.85rem;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
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
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        
        .btn:hover::before {
            width: 300px;
            height: 300px;
        }
        
        .btn span {
            position: relative;
            z-index: 1;
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
        
        /* System Health */
        .health-grid {
            display: grid;
            gap: 15px;
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
        
        /* Responsive */
        @media (max-width: 768px) {
            .logo { font-size: 2rem; }
            .stat-value { font-size: 2.5rem; }
            .main-grid { grid-template-columns: 1fr; }
            .btn-group { grid-template-columns: 1fr; }
        }
        
        /* Notification */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--glass);
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
    </style>
</head>
<body>
    <!-- Animated Background -->
    <div class="bg-animation" id="particles"></div>

    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">ELITE CONTROL</div>
            <div class="subtitle">Advanced Discord Automation System 2026</div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">
                    <span class="status-dot"></span>
                    SYSTEM UPTIME
                </div>
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

        <!-- Main Grid -->
        <div class="main-grid">
            <!-- Accounts Panel -->
            <div class="panel">
                <div class="panel-title">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                    ACCOUNTS STATUS
                </div>
                <div class="account-grid">
                    <!-- Account 1 -->
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
                        <div class="progress-bar">
                            <div class="progress-fill" id="prog1" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Account 2 -->
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
                        <div class="progress-bar">
                            <div class="progress-fill" id="prog2" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Control Panel -->
            <div class="panel">
                <div class="panel-title">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                    </svg>
                    CONTROL CENTER
                </div>
                <div class="controls">
                    <div class="input-group">
                        <label>ADMIN KEY</label>
                        <input id="adminkey" type="password" placeholder="Enter your admin key" />
                    </div>
                    
                    <div class="btn-group">
                        <button class="btn btn-reset" onclick="executeAction('reset')" onmouseenter="playSound('hover')">
                            <span>RESET DATA</span>
                        </button>
                        <button class="btn btn-restart" onclick="executeAction('restart')" onmouseenter="playSound('hover')">
                            <span>RESTART SYSTEM</span>
                        </button>
                    </div>

                    <!-- Sound Toggle Button -->
                    <button id="soundToggle" onclick="toggleSound()" class="btn" style="
                        margin-top: 15px;
                        background: rgba(255, 255, 255, 0.05);
                        color: var(--primary);
                        border: 1px solid var(--primary);
                        grid-column: 1 / -1;
                        padding: 12px;
                        font-size: 0.8rem;
                    " onmouseenter="playSound('hover')">
                        🔊 SOUND ON
                    </button>
                </div>

                <!-- System Health -->
                <div style="margin-top: 30px;">
                    <div class="panel-title" style="font-size: 1rem; margin-bottom: 15px;">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        SYSTEM METRICS
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
        // =====================
        // ADVANCED SOUND SYSTEM
        // =====================
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        
        // Sound Library
        const sounds = {
            // UI Sounds
            hover: { freq: 800, duration: 0.05, type: 'sine', volume: 0.1 },
            click: { freq: 1200, duration: 0.08, type: 'sine', volume: 0.15 },
            success: { freq: 600, duration: 0.2, type: 'sine', volume: 0.2 },
            error: { freq: 200, duration: 0.3, type: 'sawtooth', volume: 0.15 },
            notification: { freq: 880, duration: 0.15, type: 'sine', volume: 0.2 },
            
            // System Sounds
            startup: { freq: 440, duration: 0.5, type: 'sine', volume: 0.25 },
            update: { freq: 1000, duration: 0.03, type: 'sine', volume: 0.08 },
            restart: { freq: 300, duration: 0.4, type: 'triangle', volume: 0.2 },
            reset: { freq: 400, duration: 0.35, type: 'square', volume: 0.18 },
            
            // Achievement Sounds
            milestone: { freq: 523, duration: 0.3, type: 'sine', volume: 0.22 },
            levelUp: { freq: 659, duration: 0.25, type: 'sine', volume: 0.2 }
        };

        // Play Sound Function
        function playSound(soundName) {
            if (!sounds[soundName]) return;
            
            try {
                const sound = sounds[soundName];
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                oscillator.type = sound.type;
                oscillator.frequency.value = sound.freq;
                
                gainNode.gain.setValueAtTime(sound.volume, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + sound.duration);
                
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + sound.duration);
            } catch (e) {
                console.log('Audio error:', e);
            }
        }

        // Advanced Sound Effects
        function playSuccessChord() {
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.3);
                }, i * 80);
            });
        }

        function playErrorBuzz() {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }

        function playStartupSequence() {
            [261.63, 329.63, 392, 523.25].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.2);
                }, i * 100);
            });
        }

        // Sound Settings
        let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        
        function toggleSound() {
            soundEnabled = !soundEnabled;
            localStorage.setItem('soundEnabled', soundEnabled);
            playSound(soundEnabled ? 'success' : 'click');
            updateSoundButton();
        }

        function updateSoundButton() {
            const btn = document.getElementById('soundToggle');
            if (btn) {
                btn.innerHTML = soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF';
                btn.style.opacity = soundEnabled ? '1' : '0.5';
            }
        }

        // Wrap playSound to check if enabled
        const originalPlaySound = playSound;
        playSound = function(soundName) {
            if (soundEnabled) originalPlaySound(soundName);
        };

        // Play startup sound
        setTimeout(() => {
            if (soundEnabled) playStartupSequence();
        }, 500);

        // Particle Animation
        function createParticles() {
            const container = document.getElementById('particles');
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.width = Math.random() * 6 + 2 + 'px';
                particle.style.height = particle.style.width;
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDuration = Math.random() * 10 + 15 + 's';
                particle.style.animationDelay = Math.random() * 5 + 's';
                container.appendChild(particle);
            }
        }
        createParticles();

        // Notification System with Sound
        function showNotification(message, type = 'success') {
            const notif = document.createElement('div');
            notif.className = 'notification';
            notif.textContent = message;
            notif.style.borderColor = type === 'success' ? 'var(--primary)' : 'var(--danger)';
            document.body.appendChild(notif);
            
            // Play notification sound
            if (type === 'success') {
                playSuccessChord();
            } else {
                playErrorBuzz();
            }
            
            setTimeout(() => {
                notif.style.animation = 'slideIn 0.5s ease reverse';
                setTimeout(() => notif.remove(), 500);
            }, 3000);
        }

        // Execute Actions with Sounds
        async function executeAction(type) {
            playSound('click');
            
            const adminKey = document.getElementById('adminkey').value.trim();
            
            if (!adminKey) {
                showNotification('Please enter admin key', 'error');
                return;
            }
            
            if (!confirm(\`Are you sure you want to \${type} the system?\`)) {
                playSound('click');
                return;
            }

            playSound(type); // Play reset or restart sound

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

        // Data Update System with Sound Feedback
        let lastUpdateTime = Date.now();
        let lastTotalMessages = 0;
        let milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
        
        async function updateData() {
            try {
                const response = await fetch('/api/public-data');
                if (!response.ok) {
                    console.error('Failed to fetch data:', response.status);
                    return;
                }
                
                const data = await response.json();
                lastUpdateTime = Date.now();

                // Play update tick sound (subtle)
                playSound('update');

                // Check for milestones
                const total = data.stats.c1.total + data.stats.c2.total;
                if (total > lastTotalMessages) {
                    milestones.forEach(milestone => {
                        if (lastTotalMessages < milestone && total >= milestone) {
                            setTimeout(() => {
                                playSound('milestone');
                                showNotification(\`🎉 Milestone reached: \${milestone.toLocaleString()} messages!\`, 'success');
                            }, 500);
                        }
                    });
                }
                lastTotalMessages = total;

                // Update uptime
                const u = data.uptime;
                document.getElementById('uptime').textContent = 
                    \`\${u.d}d \${u.h}h \${u.m}m\`;

                // Update total messages
                const total = data.stats.c1.total + data.stats.c2.total;
                document.getElementById('totalMsg').textContent = total.toLocaleString();
                document.getElementById('t1').textContent = data.stats.c1.total.toLocaleString();
                document.getElementById('t2').textContent = data.stats.c2.total.toLocaleString();

                // Update speed
                const avgSpeed = ((parseFloat(data.speed.c1) + parseFloat(data.speed.c2)) / 2).toFixed(1);
                document.getElementById('avgSpeed').textContent = avgSpeed;

                // Update health
                const errorCount = data.stats.c1.errors + data.stats.c2.errors;
                document.getElementById('errors').textContent = errorCount;
                document.getElementById('restarts').textContent = data.health.totalRestarts;
                
                const healthPercent = Math.max(0, 100 - (errorCount * 2));
                document.getElementById('healthStatus').textContent = healthPercent + '%';

                // Update accounts
                updateAccount(1, data.stats.c1);
                updateAccount(2, data.stats.c2);

                // Update system metrics
                document.getElementById('apiCalls').textContent = data.health.apiCalls.toLocaleString();
                document.getElementById('watchdog').textContent = data.health.watchdogTriggers;

                // Update last update time
                const timeDiff = Math.floor((Date.now() - lastUpdateTime) / 1000);
                document.getElementById('lastUpdate').textContent = 
                    timeDiff < 5 ? 'Just now' : \`\${timeDiff}s ago\`;

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
            
            // Update progress bar
            const total = stats.total;
            const maxVal = Math.max(stats.ar, stats.en, 1);
            const percentage = Math.min((total / (maxVal * 10)) * 100, 100);
            document.getElementById(\`prog\${num}\`).style.width = percentage + '%';
        }

        // Initial update and interval
        updateData();
        setInterval(updateData, 1500);
        
        // Update sound button state
        updateSoundButton();
        
        // Add hover sounds to all interactive elements
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.stat-card, .account-item, input').forEach(el => {
                el.addEventListener('mouseenter', () => playSound('hover'));
            });
            
            document.querySelectorAll('input').forEach(input => {
                input.addEventListener('focus', () => playSound('click'));
            });
        });
        
        // Update "last update" text every second
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
// START SERVER & WEBSOCKET
// =====================
const PORT = process.env.PORT || 2000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        ELITE DISCORD LEVELING SYSTEM 2026 🚀             ║
║        Advanced Automation & Control Center               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

[✓] Web Server: http://localhost:${PORT}
[✓] Dashboard: http://localhost:${PORT}
[✓] API Endpoint: http://localhost:${PORT}/api/public-data
[✓] WebSocket: Ready for real-time updates

[INFO] AR Channel: ${CH_AR}
[INFO] EN Channel: ${CH_EN}
[INFO] Message Interval: 12 seconds

[WAITING] Connecting Discord clients...
  `);
});

// WebSocket Server
wss = new WebSocket.Server({ server });

let wsClients = 0;

wss.on("connection", (ws) => {
  wsClients++;
  console.log(`[WS] Client connected | Total clients: ${wsClients}`);
  
  // Send initial data
  ws.send(JSON.stringify({ 
    type: "init", 
    data: buildDataPayload(),
    levelingStatus: levelingActive
  }));

  ws.on("close", () => {
    wsClients--;
    console.log(`[WS] Client disconnected | Total clients: ${wsClients}`);
  });

  ws.on("error", (err) => {
    console.error("[WS ERROR]:", err.message);
  });
});

// Log system status every 30 seconds
setInterval(() => {
  console.log(`
[STATUS UPDATE]
├─ Uptime: ${Math.floor((Date.now() - startTime) / 1000 / 60)} minutes
├─ Account 1: ${stats.c1.total} messages (AR: ${stats.c1.ar} | EN: ${stats.c1.en}) | Status: ${stats.c1.status}
├─ Account 2: ${stats.c2.total} messages (AR: ${stats.c2.ar} | EN: ${stats.c2.en}) | Status: ${stats.c2.status}
├─ Total Messages: ${stats.c1.total + stats.c2.total}
├─ WebSocket Clients: ${wsClients}
├─ Leveling Status: C1_AR=${levelingActive.c1_ar} C1_EN=${levelingActive.c1_en} C2_AR=${levelingActive.c2_ar} C2_EN=${levelingActive.c2_en}
└─ System Health: ${systemHealth.errors.length} errors logged
  `);
}, 30000);

console.log("\n[SYSTEM] All systems initialized. Waiting for Discord connection...");
