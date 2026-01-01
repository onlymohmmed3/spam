require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const startTime = Date.now();
let logs = []; // لتخزين آخر الأحداث وعرضها في الويب

const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    logs.unshift(`[${time}] ${msg}`);
    if (logs.length > 5) logs.pop();
};

let stats = {
    daily: { msg: { c1: 0, c2: 0 } },
    monthly: { msg: { c1: 0, c2: 0 } }
};

const getUptimeData = () => {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, totalSeconds };
};

async function sendStats(type = "DAILY") {
    if (!WEBHOOK_URL) return;
    const isMonthly = type === "MONTHLY";
    const data = isMonthly ? stats.monthly : stats.daily;
    const uptime = getUptimeData();

    const embed = {
        title: `📊 ${type} ANALYTICS`,
        color: isMonthly ? 0xD4AF37 : 0x00D4FF,
        fields: [
            { name: "👤 Account 1", value: `\`${data.msg.c1}\` messages`, inline: true },
            { name: "👤 Account 2", value: `\`${data.msg.c2}\` messages`, inline: true },
            { name: "⏱️ Uptime", value: `\`${uptime.days}d ${uptime.hours}h ${uptime.minutes}m\``, inline: false }
        ],
        footer: { text: "Sphinx System • Automated Report" },
        timestamp: new Date()
    };

    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        addLog(`Report sent to Discord: ${type}`);
        if (isMonthly) stats.monthly = { msg: { c1: 0, c2: 0 } };
        else stats.daily = { msg: { c1: 0, c2: 0 } };
    } catch (e) { addLog("Error sending Webhook"); }
}

const client = new Discord.Client({ intents: [32767] });
const client2 = new Discord.Client({ intents: [32767] });

const track = (n) => {
    const k = `c${n}`;
    stats.daily.msg[k]++;
    stats.monthly.msg[k]++;
    if (stats.daily.msg[k] % 10 === 0) addLog(`Account ${n} reached ${stats.daily.msg[k]} msgs`);
};

client.on("messageCreate", (m) => { if (m.author.id === client.user.id) track(1); });
client2.on("messageCreate", (m) => { if (m.author.id === client2.user.id) track(2); });

client.on("ready", () => {
    addLog("System Core Booted Successfully");
    setTimeout(() => sendStats("BOOT TEST"), 5000);
});

const channels = [{ id: "1261662361660555315", type: "ar" }, { id: "1246427655855804477", type: "eng" }];
channels.forEach(ch => {
    new userAccount(client, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
    new userAccount(client2, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
});

schedule.scheduleJob('0 0 * * *', () => sendStats("DAILY"));
schedule.scheduleJob('5 0 1 * *', () => sendStats("MONTHLY"));
schedule.scheduleJob('0 * * * *', async () => {
    const k = process.env.RENDER_API_KEY; const i = process.env.SERVICE_ID;
    if (k && i) axios.post(`https://api.render.com/v1/services/${i}/restart`, {}, { headers: { 'Authorization': `Bearer ${k}` } });
});

const app = express();
app.get("/", (req, res) => {
    const uptime = getUptimeData();
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sphinx Command Center</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { background: #050505; color: white; font-family: 'Orbitron', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: rgba(10, 10, 20, 0.9); border: 2px solid #00d4ff; padding: 40px; border-radius: 25px; text-align: center; box-shadow: 0 0 30px #00d4ff33; position: relative; z-index: 10; width: 500px; }
            h1 { color: #00d4ff; font-size: 1.8rem; margin-bottom: 20px; }
            #timer { font-size: 1.3rem; color: #00ff88; margin-bottom: 25px; background: #000; padding: 10px; border-radius: 8px; border: 1px solid #333; }
            .stats-row { display: flex; justify-content: space-around; margin-bottom: 25px; }
            .s-box { background: #111; padding: 15px; border-radius: 12px; border: 1px solid #222; width: 40%; }
            .s-val { display: block; font-size: 1.5rem; color: #fff; }
            .s-lbl { font-size: 0.6rem; color: #555; }
            .log-box { background: #000; border: 1px solid #1a1a1a; padding: 10px; border-radius: 10px; text-align: left; height: 100px; overflow: hidden; font-family: monospace; font-size: 0.75rem; color: #00ff88; opacity: 0.8; }
            .wave { position: absolute; bottom: 0; left: 0; width: 100%; height: 100px; background: url(https://i.imgur.com/vSFEyP0.png); background-size: 1000px 100px; opacity: 0.1; animation: move 10s linear infinite; }
            @keyframes move { 0% { background-position-x: 0; } 100% { background-position-x: 1000px; } }
        </style>
    </head>
    <body>
        <div class="wave"></div>
        <div class="card">
            <h1>SPHINX CONTROL</h1>
            <div id="timer">${uptime.days}d ${uptime.hours}h ${uptime.minutes}m ${uptime.seconds}s</div>
            <div class="stats-row">
                <div class="s-box"><span class="s-val">${stats.daily.msg.c1}</span><span class="s-lbl">ACCOUNT 1</span></div>
                <div class="s-box"><span class="s-val">${stats.daily.msg.c2}</span><span class="s-lbl">ACCOUNT 2</span></div>
            </div>
            <div class="log-box">
                ${logs.map(l => `<div>${l}</div>`).join('')}
            </div>
        </div>
        <script>
            let s = ${uptime.totalSeconds};
            setInterval(() => {
                s++;
                let d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
                document.getElementById('timer').innerText = d + "d " + h + "h " + m + "m " + sec + "s";
            }, 1000);
            setTimeout(() => location.reload(), 20000);
        </script>
    </body>
    </html>
    `);
});

client.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 2000);
