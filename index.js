require("dotenv").config();

const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const axios = require("axios");
const express = require("express");

// =====================
// 0) Tracking / Stats
// =====================
const startTime = Date.now();

const stats = {
  c1: { name: "ACCOUNT 1", total: 0, ar: 0, en: 0, ping: 0 },
  c2: { name: "ACCOUNT 2", total: 0, ar: 0, en: 0, ping: 0 },
};

// وقت آخر رسالة لكل قناة على حدة
let lastChangeTimes = {
  c1_ar: Date.now(),
  c1_en: Date.now(),
  c2_ar: Date.now(),
  c2_en: Date.now()
};

const client = new Discord.Client();
const client2 = new Discord.Client();

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

const getRandomTime = () => Math.floor(Math.random() * (17000 - 12000 + 1) + 12000);

// =====================
// 1) Ready Events
// =====================
client.on("ready", () => {
  console.log(`[SYSTEM] Account 1 ONLINE`);
  stats.c1.name = client.user.username;
});

client2.on("ready", () => {
  console.log(`[SYSTEM] Account 2 ONLINE`);
  stats.c2.name = client2.user.username;
});

// =====================
// 2) Leveling
// =====================
new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: getRandomTime(), type: "ar" });
new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: getRandomTime(), type: "eng" });
new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: getRandomTime(), type: "ar" });
new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: getRandomTime(), type: "eng" });

// =====================
// 3) Counter Logic
// =====================
function bumpCounters(acc, channelId) {
  stats[acc].total += 1;
  if (channelId === CH_AR) {
    stats[acc].ar += 1;
    lastChangeTimes[`${acc}_ar`] = Date.now();
  } else if (channelId === CH_EN) {
    stats[acc].en += 1;
    lastChangeTimes[`${acc}_en`] = Date.now();
  }
}

client.on("messageCreate", (msg) => {
  if (msg?.author?.id === client.user?.id) bumpCounters("c1", msg.channel?.id);
});

client2.on("messageCreate", (msg) => {
  if (msg?.author?.id === client2.user?.id) bumpCounters("c2", msg.channel?.id);
});

// =====================
// 4) Watchdog (Restart if any of 4 streams stop for 5 mins)
// =====================
setInterval(async () => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  const checks = [
    { label: "Acc 1 AR", time: lastChangeTimes.c1_ar },
    { label: "Acc 1 EN", time: lastChangeTimes.c1_en },
    { label: "Acc 2 AR", time: lastChangeTimes.c2_ar },
    { label: "Acc 2 EN", time: lastChangeTimes.c2_en }
  ];

  for (const check of checks) {
    if (now - check.time > fiveMinutes) {
      console.log(`[WATCHDOG] ${check.label} is STUCK. Triggering restart...`);
      await triggerRestart();
      break;
    }
  }
}, 30000); // يفحص كل 30 ثانية لدقة أعلى

async function triggerRestart() {
  const key = process.env.RENDER_API_KEY;
  const id = process.env.SERVICE_ID;
  if (key && id) {
    try {
      await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, {
        headers: { Authorization: `Bearer ${key}` }
      });
      // منع تكرار الطلب
      const future = Date.now() + 600000;
      lastChangeTimes = { c1_ar: future, c1_en: future, c2_ar: future, c2_en: future };
    } catch (e) { console.error("Restart API Error"); }
  }
}

client.login(process.env.token);
client2.login(process.env.token2);

// =====================
// 5) Web Dashboard
// =====================
const app = express();

app.get("/api/data", (req, res) => {
  const s = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    uptime: `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`,
    stats,
    status: { c1: client.isReady?.() || false, c2: client2.isReady?.() || false }
  });
});

app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
      <title>SPAM MONITOR PRO</title>
      <style>
          body { background: #0a0a0c; color: white; font-family: sans-serif; display: flex; justify-content: center; padding-top: 50px; }
          .container { width: 90%; max-width: 800px; background: #16161a; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 20px; }
          .uptime { color: #00ff88; font-size: 1.2em; font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .card { background: #1f1f27; padding: 20px; border-radius: 15px; position: relative; border-left: 5px solid #555; }
          .card.online { border-left-color: #00ff88; }
          .card h3 { margin-top: 0; color: #00d4ff; }
          .stat-line { display: flex; justify-content: space-between; margin: 10px 0; font-size: 0.9em; }
          .val { font-weight: bold; color: #fff; }
          .label { color: #888; }
          .footer-note { text-align: center; margin-top: 20px; font-size: 0.7em; color: #555; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>SYSTEM MONITOR</h1>
              <div class="uptime">UPTIME: <span id="uptime">Loading...</span></div>
          </div>
          <div class="grid">
              <div id="card1" class="card">
                  <h3 id="n1">Account 1</h3>
                  <div class="stat-line"><span class="label">Total Messages:</span> <span class="val" id="t1">0</span></div>
                  <div class="stat-line"><span class="label">Arabic (AR):</span> <span class="val" id="a1">0</span></div>
                  <div class="stat-line"><span class="label">English (EN):</span> <span class="val" id="e1">0</span></div>
              </div>
              <div id="card2" class="card">
                  <h3 id="n2">Account 2</h3>
                  <div class="stat-line"><span class="label">Total Messages:</span> <span class="val" id="t2">0</span></div>
                  <div class="stat-line"><span class="label">Arabic (AR):</span> <span class="val" id="a2">0</span></div>
                  <div class="stat-line"><span class="label">English (EN):</span> <span class="val" id="e2">0</span></div>
              </div>
          </div>
          <div class="footer-note">Watchdog active: Auto-restart if any counter stops for 5 mins.</div>
      </div>
      <script>
          setInterval(async () => {
              try {
                  const r = await fetch('/api/data'); const d = await r.json();
                  document.getElementById('uptime').innerText = d.uptime;
                  ['c1','c2'].forEach((k,i)=>{
                      const n = i+1;
                      document.getElementById('n'+n).innerText = d.stats[k].name;
                      document.getElementById('t'+n).innerText = d.stats[k].total;
                      document.getElementById('a'+n).innerText = d.stats[k].ar;
                      document.getElementById('e'+n).innerText = d.stats[k].en;
                      document.getElementById('card'+n).className = d.status[k] ? "card online" : "card";
                  });
              } catch(e){}
          }, 2000);
      </script>
  </body>
  </html>
  `);
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));
