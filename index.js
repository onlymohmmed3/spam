require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const startTime = Date.now();

// Data Storage
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

const client = new Discord.Client({ intents: [32767] });
const client2 = new Discord.Client({ intents: [32767] });

client.on("messageCreate", (m) => { if (m.author.id === client.user.id) track(1, m.channelId); });
client2.on("messageCreate", (m) => { if (m.author.id === client2.user.id) track(2, m.channelId); });

client.on("ready", () => {
    const channels = [{ id: "1261662361660555315", type: "ar" }, { id: "1246427655855804477", type: "eng" }];
    channels.forEach(ch => {
        new userAccount(client, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
        new userAccount(client2, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
    });
});

const app = express();
app.get("/api/data", (req, res) => res.json({ stats, uptime: getUptime() }));

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Bot Control Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { 
                margin: 0; background: #020205; color: white; font-family: 'Inter', sans-serif;
                height: 100vh; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle at 50% 50%, #0a0a20 0%, #020205 100%);
                overflow: hidden;
            }
            .container {
                width: 90%; max-width: 750px; background: rgba(255, 255, 255, 0.02);
                padding: 50px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.06);
                backdrop-filter: blur(20px); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.6);
            }
            .header { margin-bottom: 40px; }
            h1 { font-size: 1rem; color: #888; text-transform: uppercase; letter-spacing: 3px; margin: 0; }
            #uptime { font-size: 3rem; font-weight: bold; color: #fff; margin: 10px 0; letter-spacing: -1px; }
            .status-badge { background: rgba(0, 255, 136, 0.1); color: #00ff88; padding: 6px 16px; border-radius: 50px; font-size: 0.75rem; font-weight: bold; border: 1px solid rgba(0, 255, 136, 0.2); }
            
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 40px; }
            .card { background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.04); transition: 0.3s; }
            .card:hover { border-color: #00d4ff; transform: translateY(-5px); }
            .card h3 { margin: 0 0 10px 0; font-size: 0.8rem; color: #666; text-transform: uppercase; }
            .main-val { display: block; font-size: 2.5rem; font-weight: bold; color: #00d4ff; }
            .details { display: flex; justify-content: space-between; font-size: 0.85rem; color: #555; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
            .details b { color: #fff; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <span class="status-badge">SYSTEM ACTIVE</span>
                <h1 style="margin-top:20px;">Current Running Time</h1>
                <div id="uptime">00d 00h 00m 00s</div>
            </div>

            <div class="stats-grid">
                <div class="card">
                    <h3>Account 01 Stats</h3>
                    <span class="main-val" id="c1-total">0</span>
                    <div class="details">
                        <span>Arabic: <b id="c1-ar">0</b></span>
                        <span>English: <b id="c1-en">0</b></span>
                    </div>
                </div>

                <div class="card">
                    <h3>Account 02 Stats</h3>
                    <span class="main-val" id="c2-total">0</span>
                    <div class="details">
                        <span>Arabic: <b id="c2-ar">0</b></span>
                        <span>English: <b id="c2-en">0</b></span>
                    </div>
                </div>
            </div>
        </div>

        <script>
            async function fetchData() {
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
                    document.getElementById('uptime').innerText = 
                        u.d + "d " + u.h + "h " + u.m + "m " + u.s + "s";
                } catch (e) {}
            }
            setInterval(fetchData, 1000); // Live update every 1 second
        </script>
    </body>
    </html>
    `);
});

client.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 2000);
