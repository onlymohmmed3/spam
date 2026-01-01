require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const schedule = require('node-schedule');
const axios = require('axios');
const express = require("express");

// --- الجزء الأول: تشغيل الحسابات (نفس كودك القديم بالضبط) ---

// الحساب الأول
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});

client.on("ready", async () => {
  console.log(`${client.user.username} is ready! (Account 1)`);
});

// الحساب الثاني
const client2 = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});

client2.on("ready", async () => {
  console.log(`${client2.user.username} is ready! (Account 2)`);
});

// تفعيل الليفلينج (Leveling) لكل حساب بشكل مستقل كما في كودك الناجح
new userAccount(client, Discord).leveling({
  channel: "1261662361660555315",
  randomLetters: false,
  time: 12000,
  type: "ar",
});

new userAccount(client, Discord).leveling({
  channel: "1246427655855804477",
  randomLetters: false,
  time: 12000,
  type: "eng",
});

new userAccount(client2, Discord).leveling({
  channel: "1261662361660555315",
  randomLetters: false,
  time: 12000,
  type: "ar",
});

new userAccount(client2, Discord).leveling({
  channel: "1246427655855804477",
  randomLetters: false,
  time: 12000,
  type: "eng",
});

// تسجيل الدخول
client.login(process.env.token);
client2.login(process.env.token2);

// --- الجزء الثاني: واجهة الويب والريستارت ---

const startTime = Date.now();
const app = express();

app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({
        uptime: { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 },
        status: { c1: client.isReady(), c2: client2.isReady() }
    });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bot Monitoring</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { margin: 0; background: #020205; color: white; font-family: 'Inter', sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 50%, #0a0a25 0%, #020205 100%); }
            .container { width: 90%; max-width: 650px; background: rgba(255, 255, 255, 0.02); padding: 40px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px); text-align: center; }
            #uptime { font-size: 3.5rem; font-weight: bold; margin: 20px 0; color: #fff; }
            .status-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .node { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); }
            .online { color: #00ff88; font-weight: bold; }
            .offline { color: #ff4444; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div style="color:#00d4ff; font-size:0.8rem; letter-spacing:3px;">SYSTEM RUNNING</div>
            <div id="uptime">0d 0h 0m 0s</div>
            <div class="status-box">
                <div class="node"><div>Account 1</div><div id="s1" class="offline">Checking...</div></div>
                <div class="node"><div>Account 2</div><div id="s2" class="offline">Checking...</div></div>
            </div>
        </div>
        <script>
            setInterval(async () => {
                try {
                    const r = await fetch('/api/data');
                    const d = await r.json();
                    document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                    document.getElementById('s1').innerText = d.status.c1 ? "ONLINE" : "OFFLINE";
                    document.getElementById('s1').className = d.status.c1 ? "online" : "offline";
                    document.getElementById('s2').innerText = d.status.c2 ? "ONLINE" : "OFFLINE";
                    document.getElementById('s2').className = d.status.c2 ? "online" : "offline";
                } catch(e){}
            }, 1000);
        </script>
    </body>
    </html>
    `);
});

// نظام الريستارت (من كودك القديم)
schedule.scheduleJob('0 * * * *', async () => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
});

app.listen(process.env.PORT || 2000);
