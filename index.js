require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const schedule = require('node-schedule');
const axios = require('axios');
const express = require("express");

// 1. تشغيل الحسابات (نفس كودك القديم بالضبط)
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.on("ready", async () => { console.log(`Account 1 (${client.user.username}) is Ready!`); });
client2.on("ready", async () => { console.log(`Account 2 (${client2.user.username}) is Ready!`); });

// 2. تفعيل الليفلينج (Leveling) - وضعناهم بشكل مباشر كما في كودك الناجح
new userAccount(client, Discord).leveling({ channel: "1261662361660555315", randomLetters: false, time: 12000, type: "ar" });
new userAccount(client, Discord).leveling({ channel: "1246427655855804477", randomLetters: false, time: 12000, type: "eng" });

new userAccount(client2, Discord).leveling({ channel: "1261662361660555315", randomLetters: false, time: 12000, type: "ar" });
new userAccount(client2, Discord).leveling({ channel: "1246427655855804477", randomLetters: false, time: 12000, type: "eng" });

// 3. تسجيل الدخول
client.login(process.env.token);
client2.login(process.env.token2);

// 4. واجهة الويب (تعمل بشكل مستقل تماماً)
const startTime = Date.now();
const app = express();
app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({
        uptime: `${Math.floor(s/86400)}d ${Math.floor((s%86400)/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`,
        c1: client.isReady() ? "ONLINE" : "OFFLINE",
        c2: client2.isReady() ? "ONLINE" : "OFFLINE"
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
            .container { width: 90%; max-width: 600px; background: rgba(255, 255, 255, 0.02); padding: 50px; border-radius: 40px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); text-align: center; }
            h2 { color: #00d4ff; letter-spacing: 5px; font-size: 0.9rem; margin-bottom: 30px; }
            #uptime { font-size: 3.5rem; font-weight: bold; margin-bottom: 40px; }
            .status { display: flex; justify-content: space-around; font-weight: bold; }
            .on { color: #00ff88; } .off { color: #ff4444; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>SYSTEM MONITOR</h2>
            <div id="uptime">Loading...</div>
            <div class="status">
                <div>ACC 1: <span id="s1" class="off">...</span></div>
                <div>ACC 2: <span id="s2" class="off">...</span></div>
            </div>
        </div>
        <script>
            setInterval(async () => {
                const r = await fetch('/api/data');
                const d = await r.json();
                document.getElementById('uptime').innerText = d.uptime;
                document.getElementById('s1').innerText = d.c1;
                document.getElementById('s1').className = d.c1 === "ONLINE" ? "on" : "off";
                document.getElementById('s2').innerText = d.c2;
                document.getElementById('s2').className = d.c2 === "ONLINE" ? "on" : "off";
            }, 1000);
        </script>
    </body>
    </html>`);
});

// 5. الريستارت (نفس كودك القديم)
schedule.scheduleJob('0 * * * *', async () => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
});

app.listen(process.env.PORT || 2000);
