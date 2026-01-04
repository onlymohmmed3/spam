require("dotenv").config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const axios = require("axios");
const express = require("express");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

// =====================
// 0) Tracking / Stats
// =====================
const startTime = Date.now();

const stats = {
  c1: { name: "ACCOUNT 1", total: 0, ar: 0, en: 0, ping: 0 },
  c2: { name: "ACCOUNT 2", total: 0, ar: 0, en: 0, ping: 0 },
};

// مراقبة الـ 4 أرقام (وقت آخر رسالة لكل قناة)
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

// =====================
// 1) Discord Clients
// =====================
client.on("ready", async () => {
  console.log(`[SYSTEM] Account 1: ${client.user.username} is ONLINE`);
  stats.c1.name = client.user.username;
});

client2.on("ready", async () => {
  console.log(`[SYSTEM] Account 2: ${client2.user.username} is ONLINE`);
  stats.c2.name = client2.user.username;
});

// تحديث ping
setInterval(() => {
  stats.c1.ping = client.ws?.ping ?? stats.c1.ping;
  stats.c2.ping = client2.ws?.ping ?? stats.c2.ping;
}, 5000);

// =====================
// 2) Leveling (Sphinx-run)
// =====================
new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });
new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });

// =====================
// 3) Counting & Watchdog Update
// =====================
function bumpCounters(acc, channelId) {
  stats[acc].total += 1;
  if (channelId === CH_AR) {
    stats[acc].ar += 1;
    lastChangeTimes[`${acc}_ar`] = Date.now();
  }
  if (channelId === CH_EN) {
    stats[acc].en += 1;
    lastChangeTimes[`${acc}_en`] = Date.now();
  }
}

client.on("messageCreate", (msg) => {
  try {
    if (msg?.author?.id === client.user?.id) bumpCounters("c1", msg.channel?.id);
  } catch {}
});

client2.on("messageCreate", (msg) => {
  try {
    if (msg?.author?.id === client2.user?.id) bumpCounters("c2", msg.channel?.id);
  } catch {}
});

// نظام الفحص التلقائي (الـ 4 أرقام)
setInterval(async () => {
  const now = Date.now();
  const limit = 5 * 60 * 1000; // 5 دقائق

  const streams = [
    { n: "Acc1 AR", t: lastChangeTimes.c1_ar },
    { n: "Acc1 EN", t: lastChangeTimes.c1_en },
    { n: "Acc2 AR", t: lastChangeTimes.c2_ar },
    { n: "Acc2 EN", t: lastChangeTimes.c2_en },
  ];

  for (const s of streams) {
    if (now - s.t > limit) {
      console.log(`[WATCHDOG] Stream ${s.n} stuck! Restarting system...`);
      return await triggerRestart();
    }
  }
}, 60000);

async function triggerRestart() {
  const key = process.env.RENDER_API_KEY;
  const id = process.env.SERVICE_ID;

  // حماية: لا تحاول restart إذا مافي مفاتيح
  if (!key || !id) return;

  try {
    await axios.post(
      `https://api.render.com/v1/services/${id}/restart`,
      {},
      { headers: { Authorization: `Bearer ${key}` } }
    );

    // تصفير مؤقت لمنع التكرار
    const delay = Date.now() + 600000;
    lastChangeTimes = { c1_ar: delay, c1_en: delay, c2_ar: delay, c2_en: delay };
  } catch (e) {
    console.error("Auto-Restart Error:", e?.message || e);
  }
}

client.login(process.env.token);
client2.login(process.env.token2);

// =====================
// 5) Web Server
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

// Rate limit عام للـ API
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Rate limit قوي للعمليات الخطيرة
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/reset", strictLimiter);
app.use("/api/restart", rateLimit({ windowMs: 60 * 1000, max: 2, standardHeaders: true, legacyHeaders: false }));

// =====================
// Admin Key (Only reset/restart)
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
    if (!ok) return res.status(403).json({ success: false, error: "Bad admin key" });
  } catch {
    return res.status(403).json({ success: false, error: "Bad admin key" });
  }

  next();
}

// =====================
// Read Key (Protect /api/data + /api/health)
// =====================
function requireReadKey(req, res, next) {
  const readKey = process.env.READ_KEY;
  if (!readKey) return res.status(500).json({ ok: false, error: "READ_KEY missing" });

  const k = req.headers["x-read-key"];
  if (!k) return res.status(401).json({ ok: false, error: "Missing read key" });

  try {
    const ok =
      Buffer.byteLength(k) === Buffer.byteLength(readKey) &&
      crypto.timingSafeEqual(Buffer.from(k), Buffer.from(readKey));
    if (!ok) return res.status(403).json({ ok: false, error: "Bad read key" });
  } catch {
    return res.status(403).json({ ok: false, error: "Bad read key" });
  }

  next();
}

// =====================
// Protected Read Endpoints (READ_KEY REQUIRED)
// =====================
app.get("/api/health", requireReadKey, (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.get("/api/data", requireReadKey, (req, res) => {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.max(s / 60, 1);

  res.json({
    uptime: {
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      s: s % 60,
    },
    stats,
    speed: {
      c1: (stats.c1.total / mins).toFixed(1),
      c2: (stats.c2.total / mins).toFixed(1),
    },
  });
});

// =====================
// Protected Endpoints (ADMIN_KEY REQUIRED)
// =====================
app.post("/api/reset", requireAdminKey, (req, res) => {
  stats.c1 = { ...stats.c1, total: 0, ar: 0, en: 0 };
  stats.c2 = { ...stats.c2, total: 0, ar: 0, en: 0 };
  res.json({ success: true });
});

app.post("/api/restart", requireAdminKey, async (req, res) => {
  const key = process.env.RENDER_API_KEY;
  const id = process.env.SERVICE_ID;

  if (!key || !id) {
    return res.status(500).json({ success: false, error: "Missing RENDER_API_KEY or SERVICE_ID" });
  }

  try {
    await axios.post(
      `https://api.render.com/v1/services/${id}/restart`,
      {},
      { headers: { Authorization: `Bearer ${key}` } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || String(e) });
  }
});

// =====================
// Dashboard Page (OPEN)
// =====================
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>ELITE DASHBOARD</title>
      <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
              height: 100vh; display: flex; align-items: center; justify-content: center;
              background: radial-gradient(circle at top right, #3d1a5c, #0d0d2b, #050505);
              background-size: 400% 400%; animation: aurora 15s ease infinite;
              font-family: 'Inter', sans-serif; color: #fff; overflow: hidden;
          }
          @keyframes aurora { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
          .glass {
              background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(35px);
              border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 50px;
              width: 95%; max-width: 900px; padding: 50px; text-align: center;
              box-shadow: 0 50px 100px rgba(0,0,0,0.7);
          }
          .uptime { font-size: 4.5rem; font-weight: 900; margin-bottom: 40px; letter-spacing: -2px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
          .card {
              background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 35px; padding: 40px 15px; transition: 0.4s; position: relative;
          }
          .acc-name { color: #00d4ff; font-size: 0.8rem; font-weight: 700; letter-spacing: 2px; margin-bottom: 10px; text-transform: uppercase; }
          .count { font-size: 5rem; font-weight: 900; line-height: 1; }
          .metrics { display: flex; justify-content: center; gap: 15px; margin-top: 20px; font-size: 0.8rem; font-weight: bold; }
          .metrics b { color: #00ff88; }
          .btn-group { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
          .btn { padding: 18px 45px; border-radius: 20px; font-weight: 800; cursor: pointer; border: none; text-transform: uppercase; font-size: 0.85rem; transition: 0.3s; }
          .btn-reset { background: rgba(255,255,255,0.05); color: #ff4757; border: 1px solid rgba(255, 71, 87, 0.3); }
          .btn-restart { background: #fff; color: #000; }
          .admin { margin-top: 18px; opacity: 0.85; font-size: 0.85rem; }
          input {
            padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);
            background: rgba(0,0,0,0.25); color: #fff; outline: none;
          }
          .row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
          .hint { font-size: 0.75rem; opacity: 0.6; margin-top: 6px; }
      </style>
  </head>
  <body>
      <div class="glass">
          <div style="font-size: 0.75rem; letter-spacing: 5px; opacity: 0.4; margin-bottom: 10px;">SYSTEM LIVE MONITOR</div>
          <div class="uptime" id="uptime">LOCKED</div>

          <div class="grid">
              <div class="card">
                  <div class="acc-name" id="n1">ACCOUNT 1</div>
                  <div class="count" id="t1">-</div>
                  <div class="metrics">AR: <b id="a1">-</b> | EN: <b id="e1">-</b></div>
              </div>
              <div class="card">
                  <div class="acc-name" id="n2">ACCOUNT 2</div>
                  <div class="count" id="t2">-</div>
                  <div class="metrics">AR: <b id="a2">-</b> | EN: <b id="e2">-</b></div>
              </div>
          </div>

          <div class="admin">
            <div style="margin-bottom:8px;">Read Key (required to view data)</div>
            <div class="row">
              <input id="readkey" type="password" placeholder="Enter READ_KEY" style="width: 320px; max-width: 90%;" />
              <button class="btn" style="padding: 12px 18px; border-radius: 14px;" onclick="saveKeys()">Save</button>
            </div>
            <div class="hint">* بدون READ_KEY لن يتم عرض /api/data و /api/health</div>
          </div>

          <div class="admin" style="margin-top:14px;">
            <div style="margin-bottom:8px;">Admin Key (required for Reset/Restart)</div>
            <input id="adminkey" type="password" placeholder="Enter ADMIN_KEY" style="width: 320px; max-width: 90%;" />
          </div>

          <div class="btn-group" style="margin-top:18px;">
              <button class="btn btn-reset" onclick="act('reset')">Reset Data</button>
              <button class="btn btn-restart" onclick="act('restart')">Restart</button>
          </div>
      </div>

      <script>
        // Persist keys locally in browser (optional)
        const rk = localStorage.getItem("READ_KEY") || "";
        if (rk) document.getElementById("readkey").value = rk;

        function saveKeys() {
          const readKey = document.getElementById("readkey").value || "";
          localStorage.setItem("READ_KEY", readKey);
          location.reload();
        }

        async function act(type) {
          try {
            if (!confirm("Are you sure?")) return;

            const adminKey = document.getElementById("adminkey").value || "";
            if (!adminKey) { alert("ADMIN_KEY required"); return; }

            const response = await fetch('/api/' + type, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-key': adminKey
              },
              body: JSON.stringify({})
            });

            const result = await response.json().catch(()=> ({}));
            if (response.ok && result.success) location.reload();
            else alert(result.error || ("Failed: " + response.status));
          } catch (e) { alert("Error"); }
        }

        async function loadData() {
          try {
            const readKey = document.getElementById("readkey").value || "";
            if (!readKey) {
              document.getElementById('uptime').innerText = "LOCKED";
              return;
            }

            const r = await fetch('/api/data', {
              headers: { 'x-read-key': readKey }
            });

            if(!r.ok) {
              document.getElementById('uptime').innerText = "LOCKED";
              return;
            }

            const d = await r.json();

            document.getElementById('uptime').innerText =
              d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";

            document.getElementById('n1').innerText = d.stats.c1.name;
            document.getElementById('t1').innerText = d.stats.c1.total;
            document.getElementById('a1').innerText = d.stats.c1.ar;
            document.getElementById('e1').innerText = d.stats.c1.en;

            document.getElementById('n2').innerText = d.stats.c2.name;
            document.getElementById('t2').innerText = d.stats.c2.total;
            document.getElementById('a2').innerText = d.stats.c2.ar;
            document.getElementById('e2').innerText = d.stats.c2.en;
          } catch(e){
            document.getElementById('uptime').innerText = "LOCKED";
          }
        }

        // initial + interval
        loadData();
        setInterval(loadData, 1500);
      </script>
  </body>
  </html>
  `);
});

// =====================
// 6) Start Server
// =====================
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
