require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const startTime = Date.now();

// --- Data Engine ---
let stats = {
    c1: { ar: 0, en: 0, total: 0 },
    c2: { ar: 0, en: 0, total: 0 }
};

const getUptime = () => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    return {
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60
    };
};

const track = (acc, channelId) => {
    const key = acc === 1 ? 'c1' : 'c2';
    stats[key].total++;
    if (channelId === "1261662361660555315") stats[key].ar++;
    else if (channelId === "1246427655855804477") stats[key].en++;
};

// --- Discord Clients ---
const client = new Discord.Client({ intents: [32767] });
const client2 = new Discord.Client({ intents: [32767] });

client.on("messageCreate", (m) => { if (m.author.id === client.user.id) track(1, m.channelId); });
client2.on("messageCreate", (m) => { if (m.author.id === client2.user.id) track(2, m.channelId); });

async function sendWebhook(type = "DAILY REPORT") {
    if (!WEBHOOK_URL) return;
    const uptime = getUptime();
    const embed = {
        title: `📊 SYSTEM STATUS: ${type}`,
        color: 0x00d4ff,
        fields: [
            { name: "Account 1", value: `Total: \`${stats.c1.total}\` (AR: ${stats.c1.ar} | EN: ${stats.c1.en})`, inline: false },
            { name: "Account 2", value: `Total: \`${stats.c2.total}\` (AR: ${stats.c2.ar} | EN: ${stats.c2.en})`, inline: false },
            { name: "Uptime", value: `\`${uptime.d}d ${uptime.h}h ${uptime.m}m\``, inline: true }
        ],
        timestamp: new Date()
    };
    try { await axios.post(WEBHOOK_URL, { embeds: [embed] }); } catch (e) { console.error("Webhook Error"); }
}

client.on("ready", () => {
    console.log(`[SYS] Logged in as ${client.user.tag}`);
    const channels = [{ id: "1261662361660555315", type: "ar" }, { id: "1246427655855804477", type: "eng" }];
    channels.forEach(ch => {
        new userAccount(client, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
        new userAccount(client2, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
    });
    setTimeout(() => sendWebhook("BOOT UP"), 5000);
});

// Scheduling
schedule.scheduleJob('0 0 * * *', () => { sendWebhook("DAILY REPORT"); stats.c1 = {ar:0,en:0,total:0}; stats.c2 = {ar:0,en:0,total:0}; });

// --- Web Dashboard & API ---
const app = express();
app.get("/api/data", (req, res) => res.json({ stats, uptime: getUptime() }));

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Bot Control Center</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { 
                margin: 0; background: #020205; color: white; font-family: 'Inter', sans-serif;
                height: 100vh; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle at 50% 50%, #0a0a25 0%, #020205 100%);
            }
            .container {
                width: 90%; max-width: 700px; background: rgba(255, 255, 255, 0.02);
                padding: 40px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px); text-align: center; box-shadow: 0 40px 80px rgba(0,0,0,0.7);
            }
            .status-badge { background: rgba(0, 255, 136, 0.1); color: #00ff88; padding: 6px 16px; border-radius: 50px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(0, 255, 136, 0.2); letter-spacing: 1px; }
            h1 { font-size: 0.8rem; color: #555; text-transform: uppercase; letter-spacing: 3px; margin: 25px 0 5px 0; }
            #uptime { font-size: 3rem; font-weight: bold; margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.05); }
            .card h3 { font-size: 0.7rem; color: #444; margin: 0 0 10px 0; text-transform: uppercase; }
            .val { font-size: 2.2rem; font-weight: bold; color: #00d4ff; display: block; }
            .footer-stats { display: flex; justify-content: space-around; font-size: 0.8rem; color: #666; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
            .footer-stats b { color: #fff; }
        </style>
    </head>
    <body>
        <div class="container">
            <span class="status-badge">SYSTEM OPERATIONAL</span>
            <h1>Total Running Time</h1>
            <div id="uptime">00d 00h 00m 00s</div>
            <div class="grid">
                <div class="card">
                    <h3>Account 1 Activity</h3>
                    <span class="val" id="c1-total">0</span>
                    <div class="footer-stats">
                        <span>Arabic: <b id="c1-ar">0</b></span>
                        <span>English: <b id="c1-en">0</b></span>
                    </div>
                </div>
                <div class="card">
                    <h3>Account 2 Activity</h3>
                    <span class="val" id="c2-total">0</span>
                    <div class="footer-stats">
                        <span>Arabic: <b id="c2-ar">0</b></span>
                        <span>English: <b id="c2-en">0</b></span>
                    </div>
                </div>
            </div>
        </div>
        <script>
            async function sync() {
                try {
                    const res = await fetch('/api/data');
                    const d = await res.json();
                    document.getElementById('c1-total').innerText = d.stats.c1.total;
                    document.getElementById('c1-ar').innerText = d.stats.c1.ar;
                    document.getElementById('c1-en').innerText = d.stats.c1.en;
                    document.getElementById('c2-total').innerText = d.stats.c2.total;
                    document.getElementById('c2-ar').innerText = d.stats.c2.ar;
                    document.getElementById('c2-en').innerText = d.stats.c2.en;
                    const u = d.uptime;
                    document.getElementById('uptime').innerText = u.d + "d " + u.h + "h " + u.m + "m " + u.s + "s";
                } catch (e) {}
            }
            setInterval(sync, 1000);
        </script>
    </body>
    </html>
    `);
});

client.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 2000);
