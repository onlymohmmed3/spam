require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const axios = require('axios');
const express = require("express");

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

let stats = {
    c1: { total: 0, ar: 0, en: 0, name: "Disconnected" },
    c2: { total: 0, ar: 0, en: 0, name: "Disconnected" }
};

// إعداد العملاء مع إزالة القيود لضمان الاتصال
const client = new Discord.Client({ checkUpdate: false });
const client2 = new Discord.Client({ checkUpdate: false });

const trackMessage = (msg, botKey) => {
    const currentClient = botKey === 'c1' ? client : client2;
    if (msg.author.id === currentClient.user.id) {
        stats[botKey].total++;
        if (msg.channelId === CH_AR) stats[botKey].ar++;
        if (msg.channelId === CH_EN) stats[botKey].en++;
    }
};

client.on("messageCreate", (msg) => trackMessage(msg, 'c1'));
client2.on("messageCreate", (msg) => trackMessage(msg, 'c2'));

// معالجة نجاح الاتصال
client.on("ready", () => {
    stats.c1.name = client.user.username;
    console.log(`✅ Account 1 Connected: ${client.user.tag}`);
    new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 13000, type: "ar" });
    new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 13000, type: "eng" });
});

client2.on("ready", () => {
    stats.c2.name = client2.user.username;
    console.log(`✅ Account 2 Connected: ${client2.user.tag}`);
    setTimeout(() => {
        new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 13500, type: "ar" });
        new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 13500, type: "eng" });
    }, 5000);
});

// معالجة أخطاء الاتصال (هنا ستعرف المشكلة)
client.on("error", (err) => console.error("❌ Acc 1 Error:", err.message));
client2.on("error", (err) => console.error("❌ Acc 2 Error:", err.message));

// محاولة تسجيل الدخول مع التحقق من وجود التوكن
if (process.env.token) client.login(process.env.token).catch(e => console.error("❌ Login Failed Acc 1:", e.message));
if (process.env.token2) client2.login(process.env.token2).catch(e => console.error("❌ Login Failed Acc 2:", e.message));

// --- واجهة الويب (نفس التصميم الإنجليزي الفخم) ---
const startTime = Date.now();
const app = express();
app.use(express.json());

app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({ 
        uptime: { d: Math.floor(s/86400), h: Math.floor((s%86400)/3600), m: Math.floor((s%3600)/60), s: s%60 }, 
        stats,
        status: { c1: client.isReady(), c2: client2.isReady() }
    });
});

app.post("/api/reset", (req, res) => {
    stats.c1 = { ...stats.c1, total: 0, ar: 0, en: 0 };
    stats.c2 = { ...stats.c2, total: 0, ar: 0, en: 0 };
    res.json({ success: true });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SPAM PRO | Console</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                height: 100vh; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle at top right, #1a1a3a, #050505);
                font-family: 'Segoe UI', sans-serif; color: #fff;
            }
            .glass-container {
                background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 40px;
                width: 90%; max-width: 800px; padding: 50px 20px; text-align: center;
            }
            .uptime-clock { font-size: 4rem; font-weight: 800; margin-bottom: 40px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .card {
                background: rgba(0, 0, 0, 0.3); border-radius: 25px; padding: 30px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; }
            .online { background: #00ff88; box-shadow: 0 0 10px #00ff88; }
            .offline { background: #ff4444; box-shadow: 0 0 10px #ff4444; }
            .counter { font-size: 4rem; font-weight: bold; color: #00d4ff; }
            .btn { padding: 15px 30px; border-radius: 15px; border: none; font-weight: bold; cursor: pointer; background: #fff; color: #000; }
        </style>
    </head>
    <body>
        <div class="glass-container">
            <div id="uptime">0d 0h 0m 0s</div>
            <div class="grid">
                <div class="card">
                    <div style="font-size: 0.8rem; margin-bottom: 10px;">
                        <span id="dot1" class="status-dot offline"></span> <span id="n1">ACCOUNT 1</span>
                    </div>
                    <div class="counter" id="t1">0</div>
                    <div style="font-size: 0.7rem; opacity: 0.5;">AR: <span id="a1">0</span> | EN: <span id="e1">0</span></div>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; margin-bottom: 10px;">
                        <span id="dot2" class="status-dot offline"></span> <span id="n2">ACCOUNT 2</span>
                    </div>
                    <div class="counter" id="t2">0</div>
                    <div style="font-size: 0.7rem; opacity: 0.5;">AR: <span id="a2">0</span> | EN: <span id="e2">0</span></div>
                </div>
            </div>
            <button class="btn" onclick="fetch('/api/reset', {method:'POST'}).then(()=>location.reload())">RESET COUNTERS</button>
        </div>
        <script>
            setInterval(async () => {
                const r = await fetch('/api/data');
                const d = await r.json();
                document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                ['c1', 'c2'].forEach((key, i) => {
                    const n = i+1;
                    document.getElementById('n'+n).innerText = d.stats[key].name;
                    document.getElementById('t'+n).innerText = d.stats[key].total;
                    document.getElementById('a'+n).innerText = d.stats[key].ar;
                    document.getElementById('e'+n).innerText = d.stats[key].e; // Corrected typo here
                    document.getElementById('dot'+n).className = d.status[key] ? "status-dot online" : "status-dot offline";
                });
            }, 1000);
        </script>
    </body>
    </html>
    `);
});

app.listen(process.env.PORT || 2000);
