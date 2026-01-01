require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const axios = require('axios');
const express = require("express");

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

// --- Data & Statistics ---
let stats = {
    c1: { total: 0, ar: 0, en: 0, name: "Connecting..." },
    c2: { total: 0, ar: 0, en: 0, name: "Connecting..." }
};

const client = new Discord.Client({ checkUpdate: false });
const client2 = new Discord.Client({ checkUpdate: false });

const trackMessage = (msg, botKey) => {
    if (msg.author.id === (botKey === 'c1' ? client.user.id : client2.user.id)) {
        stats[botKey].total++;
        if (msg.channelId === CH_AR) stats[botKey].ar++;
        if (msg.channelId === CH_EN) stats[botKey].en++;
    }
};

client.on("messageCreate", (msg) => trackMessage(msg, 'c1'));
client2.on("messageCreate", (msg) => trackMessage(msg, 'c2'));

client.on("ready", () => {
    stats.c1.name = client.user.username;
    new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 13000, type: "ar" });
    new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 13000, type: "eng" });
});

client2.on("ready", () => {
    stats.c2.name = client2.user.username;
    setTimeout(() => {
        new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: 13500, type: "ar" });
        new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: 13500, type: "eng" });
    }, 5000);
});

client.login(process.env.token);
client2.login(process.env.token2);

const startTime = Date.now();
const app = express();
app.use(express.json());

// API Endpoints
app.post("/api/reset", (req, res) => {
    stats.c1 = { ...stats.c1, total: 0, ar: 0, en: 0 };
    stats.c2 = { ...stats.c2, total: 0, ar: 0, en: 0 };
    res.json({ success: true });
});

app.post("/api/restart", async (req, res) => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) {
        try { await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } }); } catch (e) {}
    }
    res.json({ success: true });
});

app.get("/api/data", (req, res) => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    res.json({ uptime: { d: Math.floor(s/86400), h: Math.floor((s%86400)/3600), m: Math.floor((s%3600)/60), s: s%60 }, stats });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SPAM PRO | System Dashboard</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                height: 100vh; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle at top right, #3d1a5c, #0d0d2b, #050505);
                background-size: 400% 400%; animation: aurora 15s ease infinite;
                font-family: 'Inter', 'Segoe UI', sans-serif;
                overflow: hidden; color: #fff;
            }
            @keyframes aurora { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }

            .glass-container {
                background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(30px);
                border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 40px;
                width: 90%; max-width: 800px; padding: 60px 20px;
                text-align: center; box-shadow: 0 40px 100px rgba(0,0,0,0.8);
            }

            .header-label { color: rgba(255, 255, 255, 0.4); font-size: 0.75rem; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 10px; }
            .uptime-clock { font-size: 4.5rem; font-weight: 800; margin-bottom: 45px; letter-spacing: -1.5px; }
            
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 45px; }
            .card {
                background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 25px; padding: 30px 15px; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .card:hover { transform: scale(1.02); background: rgba(255, 255, 255, 0.05); border-color: #00d4ff; }
            
            .acc-id { color: #00d4ff; font-size: 0.75rem; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; }
            .counter { font-size: 4.5rem; font-weight: 800; line-height: 1; margin-bottom: 8px; }
            .msg-label { font-size: 0.8rem; color: rgba(255, 255, 255, 0.3); margin-bottom: 20px; }
            
            .node-info { display: flex; justify-content: center; gap: 15px; font-size: 0.8rem; font-weight: 600; }
            .node-info span { color: #00d4ff; margin-left: 4px; }

            .footer-actions { display: flex; gap: 15px; justify-content: center; }
            .btn {
                padding: 14px 35px; border-radius: 15px; font-size: 0.85rem; font-weight: bold;
                cursor: pointer; transition: 0.3s; border: none; text-transform: uppercase; letter-spacing: 1px;
            }
            .btn-reset { 
                background: transparent; color: #ff4757; border: 1px solid #ff4757;
            }
            .btn-reset:hover { background: #ff4757; color: #fff; box-shadow: 0 0 20px rgba(255, 71, 87, 0.3); }
            
            .btn-restart {
                background: #fff; color: #000;
            }
            .btn-restart:hover { background: #00d4ff; box-shadow: 0 0 25px rgba(0, 212, 255, 0.4); }

        </style>
    </head>
    <body>
        <div class="glass-container">
            <div class="header-label">System Runtime</div>
            <div class="uptime-clock" id="uptime">0d 0h 0m 0s</div>

            <div class="grid">
                <div class="card">
                    <div class="acc-id" id="n1">ACCOUNT 1</div>
                    <div class="counter" id="t1">0</div>
                    <div class="msg-label">Total Messages</div>
                    <div class="node-info">
                        <div>AR: <span id="a1">0</span></div>
                        <div>EN: <span id="e1">0</span></div>
                    </div>
                </div>

                <div class="card">
                    <div class="acc-id" id="n2">ACCOUNT 2</div>
                    <div class="counter" id="t2">0</div>
                    <div class="msg-label">Total Messages</div>
                    <div class="node-info">
                        <div>AR: <span id="a2">0</span></div>
                        <div>EN: <span id="e2">0</span></div>
                    </div>
                </div>
            </div>

            <div class="footer-actions">
                <button class="btn btn-reset" onclick="trigger('reset')">Reset Counters</button>
                <button class="btn btn-restart" onclick="trigger('restart')">Restart System</button>
            </div>
        </div>

        <script>
            async function trigger(type) {
                if(!confirm('Are you sure you want to ' + type + '?')) return;
                await fetch('/api/' + type, { method: 'POST' });
                if(type === 'restart') alert('System is restarting, please wait...');
                location.reload();
            }

            setInterval(async () => {
                try {
                    const r = await fetch('/api/data');
                    const d = await r.json();
                    document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                    
                    ['c1', 'c2'].forEach((b, i) => {
                        const idx = i + 1;
                        document.getElementById('n'+idx).innerText = d.stats[b].name;
                        document.getElementById('t'+idx).innerText = d.stats[b].total;
                        document.getElementById('a'+idx).innerText = d.stats[b].ar;
                        document.getElementById('e'+idx).innerText = d.stats[b].en;
                    });
                } catch(e) {}
            }, 1000);
        </script>
    </body>
    </html>
    `);
});

app.listen(process.env.PORT || 2000);
