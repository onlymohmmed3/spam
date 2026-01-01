require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const schedule = require('node-schedule');
const axios = require('axios');
const express = require("express");

const startTime = Date.now();
const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

const client1 = new Discord.Client({ checkUpdate: false });
const client2 = new Discord.Client({ checkUpdate: false });

// --- الحساب الأول ---
client1.on("ready", async () => {
    console.log(`[1] Logged in as: ${client1.user.tag}`);
    const bot1 = new userAccount(client1, Discord);
    bot1.leveling({ channel: CH_AR, randomLetters: false, time: 13000, type: "ar" });
    bot1.leveling({ channel: CH_EN, randomLetters: false, time: 13000, type: "eng" });
});

// --- الحساب الثاني (مع تأخير 10 ثواني) ---
client2.on("ready", async () => {
    console.log(`[2] Logged in as: ${client2.user.tag}`);
    setTimeout(() => {
        const bot2 = new userAccount(client2, Discord);
        bot2.leveling({ channel: CH_AR, randomLetters: false, time: 13500, type: "ar" });
        bot2.leveling({ channel: CH_EN, randomLetters: false, time: 13500, type: "eng" });
    }, 10000);
});

// تسجيل الدخول
client1.login(process.env.token);
client2.login(process.env.token2);

// --- واجهة الويب ---
const app = express();
app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({
        uptime: { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 },
        u1: client1.user ? client1.user.username : "Connecting...",
        u2: client2.user ? client2.user.username : "Connecting...",
        s1: client1.isReady(), s2: client2.isReady()
    });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Debug Mode</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { margin: 0; background: #020205; color: white; font-family: 'Inter', sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 50%, #0a0a25 0%, #020205 100%); }
            .container { width: 90%; max-width: 600px; background: rgba(255, 255, 255, 0.02); padding: 40px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px); text-align: center; }
            #uptime { font-size: 3rem; font-weight: bold; margin: 20px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
            .name { font-size: 0.8rem; color: #888; margin-bottom: 5px; }
            .status { font-weight: bold; font-size: 1.2rem; }
            .on { color: #00ff88; } .off { color: #ff4444; }
        </style>
    </head>
    <body>
        <div class="container">
            <div style="color:#00d4ff; font-size:0.8rem; letter-spacing:2px;">TESTING SESSION</div>
            <div id="uptime">0d 0h 0m 0s</div>
            <div class="grid">
                <div class="card"><div class="name" id="n1">Loading...</div><div id="s1" class="off">OFFLINE</div></div>
                <div class="card"><div class="name" id="n2">Loading...</div><div id="s2" class="off">OFFLINE</div></div>
            </div>
        </div>
        <script>
            setInterval(async () => {
                try {
                    const r = await fetch('/api/data');
                    const d = await r.json();
                    document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                    document.getElementById('n1').innerText = d.u1;
                    document.getElementById('n2').innerText = d.u2;
                    document.getElementById('s1').innerText = d.s1 ? "ACTIVE" : "OFFLINE";
                    document.getElementById('s1').className = d.s1 ? "status on" : "status off";
                    document.getElementById('s2').innerText = d.s2 ? "ACTIVE" : "OFFLINE";
                    document.getElementById('s2').className = d.s2 ? "status on" : "status off";
                } catch(e){}
            }, 1000);
        </script>
    </body>
    </html>
    `);
});

// ريستارت تلقائي
schedule.scheduleJob('0 * * * *', async () => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
});

app.listen(process.env.PORT || 2000);
