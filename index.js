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

// --- واجهة الويب الاحترافية ---
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SPAM PRO | ELITE DASHBOARD</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                height: 100vh; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle at top right, #3d1a5c, #0d0d2b, #050505);
                background-size: 400% 400%; animation: aurora 15s ease infinite;
                font-family: 'Inter', sans-serif; color: #fff; overflow: hidden;
            }
            @keyframes aurora { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
            .glass {
                background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(35px);
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 50px;
                width: 95%; max-width: 900px; padding: 50px; text-align: center;
                box-shadow: 0 50px 100px rgba(0,0,0,0.7);
            }
            .uptime { font-size: 4.5rem; font-weight: 900; margin-bottom: 40px; letter-spacing: -2px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
            .card {
                background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 35px; padding: 40px 15px; transition: 0.4s; position: relative;
            }
            .card:hover { transform: translateY(-10px); border-color: #00d4ff; background: rgba(255,255,255,0.06); }
            .dot { position: absolute; top: 25px; right: 25px; width: 10px; height: 10px; border-radius: 50%; background: #ff4757; }
            .online { background: #00ff88; box-shadow: 0 0 15px #00ff88; }
            .acc-name { color: #00d4ff; font-size: 0.8rem; font-weight: 700; letter-spacing: 2px; margin-bottom: 10px; text-transform: uppercase; }
            .count { font-size: 5rem; font-weight: 900; line-height: 1; }
            .metrics { display: flex; justify-content: center; gap: 15px; margin-top: 20px; font-size: 0.8rem; font-weight: bold; }
            .metrics b { color: #00ff88; }
            .btn-group { display: flex; gap: 15px; justify-content: center; }
            .btn { padding: 18px 45px; border-radius: 20px; font-weight: 800; cursor: pointer; border: none; text-transform: uppercase; font-size: 0.85rem; transition: 0.3s; }
            .btn-reset { background: rgba(255,255,255,0.05); color: #ff4757; border: 1px solid rgba(255,71,87,0.3); }
            .btn-reset:hover { background: #ff4757; color: #fff; }
            .btn-restart { background: #fff; color: #000; }
            .btn-restart:hover { background: #00d4ff; transform: scale(1.05); }
        </style>
    </head>
    <body>
        <div class="glass">
            <div style="font-size: 0.75rem; letter-spacing: 5px; opacity: 0.4; margin-bottom: 10px;">SYSTEM LIVE MONITOR</div>
            <div class="uptime" id="uptime">0d 0h 0m 0s</div>
            <div class="grid">
                <div class="card">
                    <div id="dot1" class="dot"></div>
                    <div class="acc-name" id="n1">ACCOUNT 1</div>
                    <div class="count" id="t1">0</div>
                    <div class="metrics">⚡ <b id="s1">0.0</b> MSG/M | 📡 <b id="p1">0</b>ms</div>
                    <div class="metrics" style="opacity:0.5">AR: <span id="a1">0</span> | EN: <span id="e1">0</span></div>
                </div>
                <div class="card">
                    <div id="dot2" class="dot"></div>
                    <div class="acc-name" id="n2">ACCOUNT 2</div>
                    <div class="count" id="t2">0</div>
                    <div class="metrics">⚡ <b id="s2">0.0</b> MSG/M | 📡 <b id="p2">0</b>ms</div>
                    <div class="metrics" style="opacity:0.5">AR: <span id="a2">0</span> | EN: <span id="e2">0</span></div>
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-reset" onclick="act('reset')">Reset Stats</button>
                <button class="btn btn-restart" onclick="location.reload()">Refresh UI</button>
            </div>
        </div>
        <script>
            async function act(t){ if(confirm('Reset all counters?')) await fetch('/api/'+t,{method:'POST'}); location.reload(); }
            setInterval(async () => {
                try {
                    const r = await fetch('/api/data'); const d = await r.json();
                    document.getElementById('uptime').innerText = d.uptime.d+"d "+d.uptime.h+"h "+d.uptime.m+"m "+d.uptime.s+"s";
                    ['c1','c2'].forEach((k,i)=>{
                        const n = i+1;
                        document.getElementById('n'+n).innerText = d.stats[k].name;
                        document.getElementById('t'+n).innerText = d.stats[k].total;
                        document.getElementById('a'+n).innerText = d.stats[k].ar;
                        document.getElementById('e'+n).innerText = d.stats[k].en;
                        document.getElementById('s'+n).innerText = d.speed[k];
                        document.getElementById('p'+n).innerText = d.stats[k].ping;
                        document.getElementById('dot'+n).className = d.status[k] ? "dot online" : "dot";
                    });
                } catch(e){}
            }, 1000);
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
