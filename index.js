require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const schedule = require('node-schedule');
const axios = require('axios');
const express = require("express");

const startTime = Date.now();
const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

// --- الحساب الأول ---
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
client1.on("ready", () => {
    console.log(`✅ Account 1 Ready: ${client1.user.username}`);
    // تشغيل الحساب الأول
    const bot1 = new userAccount(client1, Discord);
    bot1.leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
    bot1.leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });
});

// --- الحساب الثاني (مع تأخير تشغيل 10 ثواني لضمان الاستقرار) ---
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
client2.on("ready", () => {
    console.log(`✅ Account 2 Ready: ${client2.user.username}`);
    setTimeout(() => {
        const bot2 = new userAccount(client2, Discord);
        bot2.leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
        bot2.leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });
    }, 10000); // تأخير بسيط ليبدأ بعد الحساب الأول
});

// تسجيل الدخول
client1.login(process.env.token);
client2.login(process.env.token2);

// --- واجهة الويب الاحترافية ---
const app = express();
app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({
        uptime: { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 },
        c1: client1.isReady(), c2: client2.isReady()
    });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { margin: 0; background: #020205; color: white; font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 50%, #0a0a25 0%, #020205 100%); }
            .container { width: 90%; max-width: 600px; background: rgba(255, 255, 255, 0.02); padding: 40px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px); text-align: center; }
            #uptime { font-size: 3.5rem; font-weight: bold; margin: 20px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .node { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); }
            .on { color: #00ff88; font-weight: bold; }
            .off { color: #ff4444; }
        </style>
    </head>
    <body>
        <div class="container">
            <div style="color:#00d4ff; font-size:0.8rem; letter-spacing:3px;">SYSTEM CORE ACTIVE</div>
            <div id="uptime">0d 0h 0m 0s</div>
            <div class="grid">
                <div class="node">Account 1<br><span id="s1" class="off">OFFLINE</span></div>
                <div class="node">Account 2<br><span id="s2" class="off">OFFLINE</span></div>
            </div>
        </div>
        <script>
            setInterval(async () => {
                const r = await fetch('/api/data');
                const d = await r.json();
                document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                document.getElementById('s1').innerText = d.c1 ? "ONLINE" : "OFFLINE";
                document.getElementById('s1').className = d.c1 ? "on" : "off";
                document.getElementById('s2').innerText = d.c2 ? "ONLINE" : "OFFLINE";
                document.getElementById('s2').className = d.c2 ? "on" : "off";
            }, 1000);
        </script>
    </body>
    </html>
    `);
});

// نظام الريستارت
schedule.scheduleJob('0 * * * *', async () => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
});

app.listen(process.env.PORT || 2000);
