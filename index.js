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
const client1 = new Discord.Client({ checkUpdate: false });
client1.on("ready", async () => {
    console.log(`✅ Account 1 Ready: ${client1.user.username}`);
    // تشغيل الإرسال للحساب الأول فوراً
    const runner1 = new userAccount(client1, Discord);
    runner1.leveling({ channel: CH_AR, randomLetters: false, time: 13000, type: "ar" });
    runner1.leveling({ channel: CH_EN, randomLetters: false, time: 13500, type: "eng" });
});

// --- الحساب الثاني ---
const client2 = new Discord.Client({ checkUpdate: false });
client2.on("ready", async () => {
    console.log(`✅ Account 2 Ready: ${client2.user.username}`);
    // انتظار 15 ثانية قبل تشغيل الحساب الثاني لضمان عدم حدوث تداخل
    setTimeout(() => {
        const runner2 = new userAccount(client2, Discord);
        runner2.leveling({ channel: CH_AR, randomLetters: false, time: 14000, type: "ar" });
        runner2.leveling({ channel: CH_EN, randomLetters: false, time: 14500, type: "eng" });
    }, 15000);
});

// تسجيل الدخول (نفس كودك القديم)
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
            .container { width: 90%; max-width: 600px; background: rgba(255, 255, 255, 0.02); padding: 45px; border-radius: 35px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(25px); text-align: center; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
            h1 { font-size: 0.8rem; color: #555; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 5px; }
            #uptime { font-size: 3.2rem; font-weight: bold; margin-bottom: 35px; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.1); }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .node { background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
            .label { font-size: 0.7rem; color: #888; margin-bottom: 10px; text-transform: uppercase; }
            .on { color: #00ff88; font-weight: bold; text-shadow: 0 0 10px rgba(0,255,136,0.3); }
            .off { color: #ff4444; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Running Time</h1>
            <div id="uptime">0d 0h 0m 0s</div>
            <div class="grid">
                <div class="node"><div class="label">Account 01</div><span id="s1" class="off">OFFLINE</span></div>
                <div class="node"><div class="label">Account 02</div><span id="s2" class="off">OFFLINE</span></div>
            </div>
        </div>
        <script>
            setInterval(async () => {
                try {
                    const r = await fetch('/api/data');
                    const d = await r.json();
                    document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                    document.getElementById('s1').innerText = d.c1 ? "ONLINE" : "OFFLINE";
                    document.getElementById('s1').className = d.c1 ? "on" : "off";
                    document.getElementById('s2').innerText = d.c2 ? "ONLINE" : "OFFLINE";
                    document.getElementById('s2').className = d.c2 ? "on" : "off";
                } catch(e){}
            }, 1000);
        </script>
    </body>
    </html>
    `);
});

// نظام الريستارت (من كودك)
schedule.scheduleJob('0 * * * *', async () => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
});

app.listen(process.env.PORT || 2000);
