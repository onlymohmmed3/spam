require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const startTime = Date.now();
let logs = [];

const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    logs.unshift(`[${time}] ${msg}`);
    if (logs.length > 6) logs.pop();
};

let stats = {
    daily: { msg: { c1: 0, c2: 0 } },
    monthly: { msg: { c1: 0, c2: 0 } }
};

const getUptimeData = () => {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { d, h, m, s, total: totalSeconds };
};

// الدالة الاحترافية للويب هوك
async function sendStats(type = "DAILY") {
    if (!WEBHOOK_URL) return;
    const isMonthly = type === "MONTHLY";
    const data = isMonthly ? stats.monthly : stats.daily;
    const uptime = getUptimeData();

    const embed = {
        title: `⚡ SYSTEM REPORT: ${type}`,
        color: isMonthly ? 0xFFA500 : 0x00E5FF,
        description: `**Core engine activity log.**`,
        fields: [
            { name: "📥 Account 1", value: `\`${data.msg.c1}\` Units`, inline: true },
            { name: "📥 Account 2", value: `\`${data.msg.c2}\` Units`, inline: true },
            { name: "⏱️ Session Uptime", value: `\`${uptime.d}d ${uptime.h}h ${uptime.m}m\``, inline: false }
        ],
        footer: { text: "Sphinx Advanced Analytics Core" },
        timestamp: new Date()
    };

    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        addLog(`System: ${type} report pushed to cloud.`);
        if (isMonthly) stats.monthly = { msg: { c1: 0, c2: 0 } };
        else stats.daily = { msg: { c1: 0, c2: 0 } };
    } catch (e) { addLog("Critical: Webhook Sync Failed."); }
}

const client = new Discord.Client({ intents: [32767] });
const client2 = new Discord.Client({ intents: [32767] });

const track = (n) => {
    const k = `c${n}`;
    stats.daily.msg[k]++;
    stats.monthly.msg[k]++;
    if (stats.daily.msg[k] % 50 === 0) addLog(`Milestone: Acc ${n} @ ${stats.daily.msg[k]} msgs`);
};

client.on("messageCreate", (m) => { if (m.author.id === client.user.id) track(1); });
client2.on("messageCreate", (m) => { if (m.author.id === client2.user.id) track(2); });

client.on("ready", () => {
    addLog("Sphinx Core Engine v5.2 Online.");
    setTimeout(() => sendStats("BOOT_SEQUENCE"), 5000);
});

const channels = [{ id: "1261662361660555315", type: "ar" }, { id: "1246427655855804477", type: "eng" }];
channels.forEach(ch => {
    new userAccount(client, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
    new userAccount(client2, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
});

schedule.scheduleJob('0 0 * * *', () => sendStats("DAILY_SUMMARY"));
schedule.scheduleJob('5 0 1 * *', () => sendStats("MONTHLY_CONSOLIDATED"));
schedule.scheduleJob('0 * * * *', async () => {
    const k = process.env.RENDER_API_KEY; const i = process.env.SERVICE_ID;
    if (k && i) axios.post(`https://api.render.com/v1/services/${i}/restart`, {}, { headers: { 'Authorization': `Bearer ${k}` } });
});

// ===== الواجهة الاحترافية (Design Pro) =====
const app = express();
app.get("/", (req, res) => {
    const uptime = getUptimeData();
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Sphinx Terminal | Command & Control</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap" rel="stylesheet">
        <style>
            :root { --primary: #00e5ff; --bg: #020205; --card: rgba(10, 10, 15, 0.7); }
            body { 
                margin: 0; background: var(--bg); color: white; font-family: 'Space Grotesk', sans-serif;
                height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden;
            }
            /* خلفية Mesh Gradient احترافية */
            .mesh {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
                background-color: var(--bg);
                background-image: 
                    radial-gradient(at 0% 0%, rgba(0, 229, 255, 0.15) 0, transparent 50%),
                    radial-gradient(at 100% 100%, rgba(123, 31, 162, 0.15) 0, transparent 50%);
            }
            .dashboard {
                width: 700px; background: var(--card); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 24px; padding: 50px; backdrop-filter: blur(20px);
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative;
            }
            .dashboard::before {
                content: ''; position: absolute; top: -1px; left: -1px; right: -1px; bottom: -1px;
                border-radius: 24px; background: linear-gradient(45deg, transparent, rgba(0, 229, 255, 0.3), transparent);
                z-index: -1;
            }
            header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
            .status { display: flex; align-items: center; font-size: 0.8rem; letter-spacing: 2px; color: var(--primary); }
            .dot { height: 8px; width: 8px; background: var(--primary); border-radius: 50%; margin-right: 10px; box-shadow: 0 0 10px var(--primary); animation: blink 1.5s infinite; }
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
            h1 { margin: 0; font-weight: 700; font-size: 1.5rem; letter-spacing: -1px; }
            .timer-container { margin-bottom: 40px; text-align: left; }
            .timer-label { font-size: 0.7rem; color: #666; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
            #timer { font-size: 3.5rem; font-weight: 300; letter-spacing: -2px; color: #fff; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; transition: 0.3s; }
            .stat-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-5px); }
            .stat-num { display: block; font-size: 2rem; font-weight: 700; color: var(--primary); }
            .stat-desc { font-size: 0.7rem; color: #555; }
            .logs { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 15px; font-family: 'monospace'; font-size: 0.7rem; color: #888; text-align: left; border: 1px solid rgba(255,255,255,0.02); }
            .log-line { margin-bottom: 4px; border-left: 2px solid var(--primary); padding-left: 8px; }
        </style>
    </head>
    <body>
        <div class="mesh"></div>
        <div class="dashboard">
            <header>
                <h1>SPHINX.CORE</h1>
                <div class="status"><span class="dot"></span> NODE_ACTIVE</div>
            </header>
            <div class="timer-container">
                <div class="timer-label">Operational Uptime</div>
                <div id="timer">${uptime.d}d ${uptime.h}h ${uptime.m}m ${uptime.s}s</div>
            </div>
            <div class="grid">
                <div class="stat-card">
                    <span class="stat-num">${stats.daily.msg.c1}</span>
                    <span class="stat-desc">Primary Node Traffic</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${stats.daily.msg.c2}</span>
                    <span class="stat-desc">Secondary Node Traffic</span>
                </div>
            </div>
            <div class="logs">
                ${logs.map(l => `<div class="log-line">${l}</div>`).join('')}
            </div>
        </div>
        <script>
            let total = ${uptime.total};
            setInterval(() => {
                total++;
                let d = Math.floor(total / 86400), h = Math.floor((total % 86400) / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
                document.getElementById('timer').innerText = d + "d " + h + "h " + m + "m " + s + "s";
            }, 1000);
            setTimeout(() => location.reload(), 30000);
        </script>
    </body>
    </html>
    `);
});

client.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 2000);
