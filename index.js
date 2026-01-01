require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const schedule = require('node-schedule');
const axios = require('axios');
const express = require("express");

// --- 1. إعداد الحسابات (نفس الهيكلية الناجحة) ---
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

client.on("ready", async () => { console.log(`[SYSTEM] Account 1: ${client.user.username} is ONLINE`); });
client2.on("ready", async () => { console.log(`[SYSTEM] Account 2: ${client2.user.username} is ONLINE`); });

// تفعيل الليفلينج (Leveling) بنفس الطريقة التي نجحت
new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });

new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 12000, type: "ar" });
new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 12000, type: "eng" });

// تسجيل الدخول
client.login(process.env.token);
client2.login(process.env.token2);

// --- 2. واجهة الويب الاحترافية (التصميم النهائي) ---
const startTime = Date.now();
const app = express();

app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({
        uptime: {
            d: Math.floor(s / 86400),
            h: Math.floor((s % 86400) / 3600),
            m: Math.floor((s % 3600) / 60),
            s: s % 60
        },
        c1: { name: client.user ? client.user.username : "Connecting...", status: client.isReady() },
        c2: { name: client2.user ? client2.user.username : "Connecting...", status: client2.isReady() }
    });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Control Center</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { 
                margin: 0; background: #020205; color: white; font-family: 'Inter', sans-serif;
                height: 100vh; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle at 50% 50%, #0a0a25 0%, #020205 100%);
            }
            .container {
                width: 90%; max-width: 650px; background: rgba(255, 255, 255, 0.02);
                padding: 40px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px); text-align: center; box-shadow: 0 40px 80px rgba(0,0,0,0.7);
            }
            .status-badge { background: rgba(0, 255, 136, 0.1); color: #00ff88; padding: 6px 16px; border-radius: 50px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(0, 255, 136, 0.2); letter-spacing: 1px; }
            h1 { font-size: 0.8rem; color: #555; text-transform: uppercase; letter-spacing: 3px; margin: 25px 0 5px 0; }
            #uptime { font-size: 3.2rem; font-weight: bold; margin-bottom: 30px; color: #fff; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.05); }
            .card h3 { font-size: 0.7rem; color: #444; margin: 0 0 10px 0; text-transform: uppercase; }
            .user-name { font-size: 1.1rem; font-weight: bold; color: #00d4ff; display: block; margin-bottom: 5px; }
            .stat-label { font-size: 0.7rem; font-weight: bold; letter-spacing: 1px; }
            .online { color: #00ff88; }
            .offline { color: #ff4444; }
        </style>
    </head>
    <body>
        <div class="container">
            <span class="status-badge">SYSTEM OPERATIONAL</span>
            <h1>Total Running Time</h1>
            <div id="uptime">0d 0h 0m 0s</div>
            <div class="grid">
                <div class="card">
                    <h3>Account 1</h3>
                    <span class="user-name" id="n1">Loading...</span>
                    <span class="stat-label" id="s1">OFFLINE</span>
                </div>
                <div class="card">
                    <h3>Account 2</h3>
                    <span class="user-name" id="n2">Loading...</span>
                    <span class="stat-label" id="s2">OFFLINE</span>
                </div>
            </div>
        </div>
        <script>
            async function sync() {
                try {
                    const res = await fetch('/api/data');
                    const d = await res.json();
                    document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                    document.getElementById('n1').innerText = d.c1.name;
                    document.getElementById('s1').innerText = d.c1.status ? "ONLINE" : "OFFLINE";
                    document.getElementById('s1').className = d.c1.status ? "stat-label online" : "stat-label offline";
                    document.getElementById('n2').innerText = d.c2.name;
                    document.getElementById('s2').innerText = d.c2.status ? "ONLINE" : "OFFLINE";
                    document.getElementById('s2').className = d.c2.status ? "stat-label online" : "stat-label offline";
                } catch (e) {}
            }
            setInterval(sync, 1000);
        </script>
    </body>
    </html>
    `);
});

// --- 3. نظام الريستارت التلقائي ---
schedule.scheduleJob('0 * * * *', async () => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { 
            await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { 
                headers: { 'Authorization': `Bearer ${key}` } 
            }); 
            console.log("Auto-Restart executed successfully.");
        } catch (e) { console.error("Restart Error"); }
    }
});

app.listen(process.env.PORT || 2000);
