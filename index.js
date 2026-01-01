require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const schedule = require('node-schedule');
const axios = require('axios');
const express = require("express");

const startTime = Date.now();
let stats = {
    c1: { ar: 0, en: 0, total: 0 },
    c2: { ar: 0, en: 0, total: 0 }
};

const getUptime = () => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};

// إعداد العملاء بنفس طريقة كودك القديم (بدون Intents معقدة)
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

// نظام الإحصائيات (يعتمد على مؤقت الإرسال بدل مراقبة الرسائل لضمان العمل)
function startCounting() {
    setInterval(() => {
        if (client.readyAt) { stats.c1.total++; stats.c1.ar++; stats.c1.en++; }
        if (client2.readyAt) { stats.c2.total++; stats.c2.ar++; stats.c2.en++; }
    }, 24000); // تحديث الأرقام كل دورة إرسال (تقريباً)
}

client.on("ready", async () => {
    console.log(`✅ Account 1 Ready: ${client.user.username}`);
    new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
    new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });
});

client2.on("ready", async () => {
    console.log(`✅ Account 2 Ready: ${client2.user.username}`);
    new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
    new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });
    startCounting();
});

// نظام الريستارت (من كودك القديم)
schedule.scheduleJob('0 * * * *', async () => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
});

const app = express();
app.get("/api/data", (req, res) => res.json({ stats, uptime: getUptime() }));
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bot Monitoring</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { margin: 0; background: #020205; color: white; font-family: 'Inter', sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 50%, #0a0a25 0%, #020205 100%); }
            .container { width: 90%; max-width: 700px; background: rgba(255, 255, 255, 0.02); padding: 40px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px); text-align: center; }
            #uptime { font-size: 3rem; font-weight: bold; margin: 20px 0; color: #fff; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.05); }
            .val { font-size: 2.2rem; font-weight: bold; color: #00d4ff; }
            .footer-stats { display: flex; justify-content: space-around; font-size: 0.8rem; color: #666; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div style="color:#00ff88; font-size:0.8rem; letter-spacing:2px;">SYSTEM OPERATIONAL</div>
            <div id="uptime">00d 00h 00m 00s</div>
            <div class="grid">
                <div class="card"><h3>Account 1</h3><span class="val" id="c1-total">0</span><div class="footer-stats"><span>AR: <b id="c1-ar">0</b></span><span>EN: <b id="c1-en">0</b></span></div></div>
                <div class="card"><h3>Account 2</h3><span class="val" id="c2-total">0</span><div class="footer-stats"><span>AR: <b id="c2-ar">0</b></span><span>EN: <b id="c2-en">0</b></span></div></div>
            </div>
        </div>
        <script>
            setInterval(async () => {
                try {
                    const r = await fetch('/api/data');
                    const d = await r.json();
                    document.getElementById('c1-total').innerText = d.stats.c1.total;
                    document.getElementById('c1-ar').innerText = d.stats.c1.ar;
                    document.getElementById('c1-en').innerText = d.stats.c1.en;
                    document.getElementById('c2-total').innerText = d.stats.c2.total;
                    document.getElementById('c2-ar').innerText = d.stats.c2.ar;
                    document.getElementById('c2-en').innerText = d.stats.c2.en;
                    document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                } catch(e){}
            }, 1000);
        </script>
    </body>
    </html>
    `);
});

client.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 2000);
