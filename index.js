require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const axios = require('axios');
const express = require("express");

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

// --- نظام العدادات ---
let stats = {
    c1: { total: 0, ar: 0, en: 0, name: "Account 1" },
    c2: { total: 0, ar: 0, en: 0, name: "Account 2" }
};

const client = new Discord.Client({ checkUpdate: false });
const client2 = new Discord.Client({ checkUpdate: false });

// دالة تتبع الرسائل بدقة
const trackMessage = (msg, botKey) => {
    if (msg.author.id === (botKey === 'c1' ? client.user.id : client2.user.id)) {
        stats[botKey].total++;
        if (msg.channelId === CH_AR) stats[botKey].ar++;
        if (msg.channelId === CH_EN) stats[botKey].en++;
    }
};

client.on("messageCreate", (msg) => trackMessage(msg, 'c1'));
client2.on("messageCreate", (msg) => trackMessage(msg, 'c2'));

client.on("ready", async () => {
    stats.c1.name = client.user.username;
    new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 13000, type: "ar" });
    new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 13000, type: "eng" });
});

client2.on("ready", async () => {
    stats.c2.name = client2.user.username;
    setTimeout(() => {
        new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 13500, type: "ar" });
        new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 13500, type: "eng" });
    }, 5000);
});

client.login(process.env.token);
client2.login(process.env.token2);

// --- واجهة الويب والتحكم ---
const startTime = Date.now();
const app = express();
app.use(express.json());

app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({
        uptime: { d: Math.floor(s/86400), h: Math.floor((s%86400)/3600), m: Math.floor((s%3600)/60), s: s%60 },
        stats: stats
    });
});

// تصفير العدادات
app.post("/api/reset", (req, res) => {
    stats.c1 = { ...stats.c1, total: 0, ar: 0, en: 0 };
    stats.c2 = { ...stats.c2, total: 0, ar: 0, en: 0 };
    res.json({ success: true });
});

// إعادة تشغيل النظام
app.post("/api/restart", async (req, res) => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
    res.json({ success: true });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Spam Pro | Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { margin: 0; background: #05050a; color: white; font-family: 'Inter', sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { width: 90%; max-width: 800px; text-align: center; }
            .badge { color: #00ff88; font-size: 0.7rem; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
            #uptime { font-size: 3rem; font-weight: bold; margin: 10px 0 30px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: rgba(255,255,255,0.03); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
            .main-val { font-size: 3.5rem; font-weight: bold; color: #00d4ff; margin: 10px 0; }
            .sub-row { display: flex; justify-content: space-around; font-size: 0.8rem; color: #555; border-top: 1px solid #111; padding-top: 10px; }
            .sub-row b { color: #fff; }
            .actions { margin-top: 30px; display: flex; gap: 15px; justify-content: center; }
            .btn { padding: 12px 25px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; transition: 0.3s; font-size: 0.8rem; }
            .btn-reset { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #222; }
            .btn-reset:hover { background: #ff4444; color: #000; border-color: #ff4444; }
            .btn-restart { background: #00d4ff; color: #000; }
            .btn-restart:hover { box-shadow: 0 0 20px rgba(0, 212, 255, 0.4); }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="badge">System Operational</div>
            <div id="uptime">0d 0h 0m 0s</div>
            <div class="grid">
                <div class="card">
                    <div id="n1" style="font-size:0.9rem; color:#666;">Account 1</div>
                    <div class="main-val" id="t1">0</div>
                    <div class="sub-row"><div>AR: <b id="a1">0</b></div><div>EN: <b id="e1">0</b></div></div>
                </div>
                <div class="card">
                    <div id="n2" style="font-size:0.9rem; color:#666;">Account 2</div>
                    <div class="main-val" id="t2">0</div>
                    <div class="sub-row"><div>AR: <b id="a2">0</b></div><div>EN: <b id="e2">0</b></div></div>
                </div>
            </div>
            <div class="actions">
                <button class="btn btn-reset" onclick="doAction('reset')">RESET COUNTERS</button>
                <button class="btn btn-restart" onclick="doAction('restart')">RESTART SYSTEM</button>
            </div>
        </div>
        <script>
            async function doAction(type) {
                if(!confirm('Are you sure you want to ' + type + '?')) return;
                await fetch('/api/' + type, { method: 'POST' });
                location.reload();
            }
            async function update() {
                const r = await fetch('/api/data');
                const d = await r.json();
                document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                ['c1', 'c2'].forEach((b, i) => {
                    document.getElementById('n'+(i+1)).innerText = d.stats[b].name;
                    document.getElementById('t'+(i+1)).innerText = d.stats[b].total;
                    document.getElementById('a'+(i+1)).innerText = d.stats[b].ar;
                    document.getElementById('e'+(i+1)).innerText = d.stats[b].en;
                });
            }
            setInterval(update, 1000);
        </script>
    </body>
    </html>
    `);
});

app.listen(process.env.PORT || 2000);
