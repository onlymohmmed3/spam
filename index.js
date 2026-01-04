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
// 4) Web Server (🔥 Strong Security)
// =====================
const app = express();

// خلف Cloudflare/Render: مفيد لقراءة IP الحقيقي لو احتجته
app.set("trust proxy", 1);

// أساسيات
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// إخفاء البصمة
app.disable("x-powered-by");

// هيدرز أمنية
app.use(
  helmet({
    // لأنك تستخدم inline script/style في HTML، نترك CSP off لتفادي كسر الصفحة
    // إذا تبي CSP قوي، نعدله مع nonce.
    contentSecurityPolicy: false,
  })
);

// Rate limit عام
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
// 4.1) Auth Layers
// =====================

// (A) Basic Auth على كل الموقع
function basicAuth(req, res, next) {
  const user = process.env.DASH_USER;
  const pass = process.env.DASH_PASS;

  if (!user || !pass) {
    return res.status(500).send("Dashboard auth not configured (DASH_USER / DASH_PASS missing)");
  }

  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");

  if (type !== "Basic" || !token) {
    res.set("WWW-Authenticate", 'Basic realm="Dashboard"');
    return res.status(401).send("Auth required");
  }

  const decoded = Buffer.from(token, "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  const u = decoded.slice(0, idx);
  const p = decoded.slice(idx + 1);

  // timing-safe compare (منع تسريبات زمنية)
  try {
    const okU =
      Buffer.byteLength(u) === Buffer.byteLength(user) &&
      crypto.timingSafeEqual(Buffer.from(u), Buffer.from(user));
    const okP =
      Buffer.byteLength(p) === Buffer.byteLength(pass) &&
      crypto.timingSafeEqual(Buffer.from(p), Buffer.from(pass));

    if (okU && okP) return next();
  } catch {}

  return res.status(403).send("Forbidden");
}

// (B) Allowlist IP (اختياري قوي جدًا)
// حط ALLOW_IPS="1.2.3.4,5.6.7.8"
function ipAllowlist(req, res, next) {
  const raw = process.env.ALLOW_IPS;
  if (!raw) return next(); // غير مفعل
  const allow = raw.split(",").map((x) => x.trim()).filter(Boolean);
  const ip = req.ip;

  if (allow.includes(ip)) return next();
  return res.status(403).send("IP not allowed");
}

// فعّل الاثنين على كامل الموقع
app.use(basicAuth);
app.use(ipAllowlist);

// (C) CSRF token للطلبات POST
function ensureCsrf(req, res, next) {
  let token = req.cookies?.csrf;
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie("csrf", token, {
      httpOnly: true,
      sameSite: "Strict",
      secure: true, // Render على https
    });
  }
  next();
}
app.use(ensureCsrf);

function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.csrf;
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || !headerToken) return res.status(401).json({ success: false, error: "Missing CSRF token" });

  try {
    const ok =
      Buffer.byteLength(cookieToken) === Buffer.byteLength(headerToken) &&
      crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
    if (!ok) return res.status(403).json({ success: false, error: "Bad CSRF token" });
  } catch {
    return res.status(403).json({ success: false, error: "Bad CSRF token" });
  }

  next();
}

// (D) Admin Key إضافية للـ reset/restart (طبقة ثانية)
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
// 4.2) API Routes (Protected)
// =====================

app.get("/api/data", (req, res) => {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.max(s / 60, 1);
  res.json({
    uptime: {
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      s: s % 60,
    },
    stats: stats,
    speed: {
      c1: (stats.c1.total / mins).toFixed(1),
      c2: (stats.c2.total / mins).toFixed(1),
    },
    status: { c1: client.isReady?.() ?? false, c2: client2.isReady?.() ?? false },
  });
});

app.post("/api/reset", requireCsrf, requireAdminKey, (req, res) => {
  stats.c1 = { ...stats.c1, total: 0, ar: 0, en: 0 };
  stats.c2 = { ...stats.c2, total: 0, ar: 0, en: 0 };
  res.json({ success: true });
});

app.post("/api/restart", requireCsrf, requireAdminKey, async (req, res) => {
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
    res.status(500).json({ success: false, error: e.message });
  }
});

// =====================
// 4.3) Dashboard Page
// =====================
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>SPAM PRO | ELITE DASHBOARD</title>
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
          .card:hover { transform: translateY(-10px); border-color: #00d4ff; background: rgba(255,255,255,0.06); }
          .dot { position: absolute; top: 25px; right: 25px; width: 10px; height: 10px; border-radius: 50%; background: #ff4757; }
          .online { background: #00ff88; box-shadow: 0 0 15px #00ff88; }
          .acc-name { color: #00d4ff; font-size: 0.8rem; font-weight: 700; letter-spacing: 2px; margin-bottom: 10px; text-transform: uppercase; }
          .count { font-size: 5rem; font-weight: 900; line-height: 1; }
          .metrics { display: flex; justify-content: center; gap: 15px; margin-top: 20px; font-size: 0.8rem; font-weight: bold; }
          .metrics b { color: #00ff88; }
          .btn-group { display: flex; gap: 15px; justify-content: center; }
          .btn { padding: 18px 45px; border-radius: 20px; font-weight: 800; cursor: pointer; border: none; text-transform: uppercase; font-size: 0.85rem; transition: 0.3s; }
          .btn-reset { background: rgba(255,255,255,0.05); color: #ff4757; border: 1px solid rgba(255, 71, 87, 0.3); }
          .btn-reset:hover { background: #ff4757; color: #fff; }
          .btn-restart { background: #fff; color: #000; }
          .btn-restart:hover { background: #00d4ff; transform: scale(1.05); }
          .admin { margin-top: 18px; opacity: 0.85; font-size: 0.85rem; }
          input {
            padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);
            background: rgba(0,0,0,0.25); color: #fff; outline: none;
          }
      </style>
  </head>
  <body>
      <div class="glass">
          <div style="font-size: 0.75rem; letter-spacing: 5px; opacity: 0.4; margin-bottom: 10px;">SYSTEM LIVE MONITOR</div>
          <div class="uptime" id="uptime">0d 0h 0m 0s</div>

          <div class="grid">
              <div class="card">
                  <div id="dot1" class="dot"></div>
                  <div class="acc-name" id="n1">ACCOUNT 1</div>
                  <div class="count" id="t1">0</div>
                  <div class="metrics">⚡ <b id="s1">0.0</b> MSG/M | 📡 <b id="p1">0</b>ms</div>
                  <div class="metrics" style="opacity:0.5">AR: <span id="a1">0</span> | EN: <span id="e1">0</span></div>
              </div>
              <div class="card">
                  <div id="dot2" class="dot"></div>
                  <div class="acc-name" id="n2">ACCOUNT 2</div>
                  <div class="count" id="t2">0</div>
                  <div class="metrics">⚡ <b id="s2">0.0</b> MSG/M | 📡 <b id="p2">0</b>ms</div>
                  <div class="metrics" style="opacity:0.5">AR: <span id="a2">0</span> | EN: <span id="e2">0</span></div>
              </div>
          </div>

          <div class="admin">
            <div style="margin-bottom:8px;">Admin Key (required for Reset/Restart)</div>
            <input id="adminkey" type="password" placeholder="Enter ADMIN_KEY" style="width: 320px; max-width: 90%;" />
          </div>

          <div class="btn-group" style="margin-top:18px;">
              <button class="btn btn-reset" onclick="act('reset')">Reset Data</button>
              <button class="btn btn-restart" onclick="act('restart')">Restart</button>
          </div>
      </div>

      <script>
        function getCookie(name) {
          const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return m ? decodeURIComponent(m[2]) : null;
        }

        async function act(type) {
          try {
            if (!confirm("Are you sure?")) return;

            const adminKey = document.getElementById("adminkey").value || "";
            if (!adminKey) { alert("ADMIN_KEY required"); return; }

            const csrf = getCookie("csrf");
            if (!csrf) { alert("Missing CSRF cookie, refresh page."); return; }

            const response = await fetch('/api/' + type, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrf,
                'x-admin-key': adminKey
              },
              body: JSON.stringify({})
            });

            const result = await response.json().catch(()=> ({}));
            if (response.ok && result.success) location.reload();
            else alert(result.error || ("Failed: " + response.status));
          } catch (e) {}
        }

        setInterval(async () => {
          try {
            const r = await fetch('/api/data');
            if(!r.ok) return;
            const d = await r.json();

            document.getElementById('uptime').innerText =
              d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";

            ['c1','c2'].forEach((k,i)=>{
              const n = i+1;
              document.getElementById('n'+n).innerText = d.stats[k].name;
              document.getElementById('t'+n).innerText = d.stats[k].total;
              document.getElementById('a'+n).innerText = d.stats[k].ar;
              document.getElementById('e'+n).innerText = d.stats[k].en;
              document.getElementById('s'+n).innerText = d.speed[k];
              document.getElementById('p'+n).innerText = d.stats[k].ping;
              document.getElementById('dot'+n).className = d.status[k] ? "dot online" : "dot";
            });
          } catch(e){}
        }, 1500);
      </script>
  </body>
  </html>
  `);
});

// =====================
// 5) Start Server
// =====================
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
