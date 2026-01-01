require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const startTime = Date.now();

// ===== نظام الإحصائيات المتكامل =====
let stats = {
    daily: { msg: { c1: 0, c2: 0 }, words: { c1: 0, c2: 0 }, channels: { ar: 0, eng: 0 } },
    monthly: { msg: { c1: 0, c2: 0 } }
};

const getUptime = () => {
    const totalSeconds = (Date.now() - startTime) / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
};

const calcXP = (m) => Math.floor(m * 0.85 * 20); // نظام برو بوت الدقيق

async function sendStats(type = "DAILY") {
    if (!WEBHOOK_URL) return;
    const isMonthly = type === "MONTHLY";
    const data = isMonthly ? stats.monthly : stats.daily;
    const totalMsgs = data.msg.c1 + data.msg.c2;
    const totalXP = calcXP(data.msg.c1) + calcXP(data.msg.c2);

    const embed = {
        title: `📊 ${type} ANALYTICS REPORT`,
        color: isMonthly ? 0xD4AF37 : 0x00D4FF,
        description: `### System Status: \`ACTIVE\`\n**Time:** \`${new Date().toUTCString()}\``,
        fields: [
            { name: "📈 Overview", value: `• Total Messages: \`${totalMsgs}\` \n• Estimated XP: \`${totalXP}\` ✨`, inline: false },
            { name: "👤 Account 1", value: `\`${data.msg.c1}\` msgs`, inline: true },
            { name: "👤 Account 2", value: `\`${data.msg.c2}\` msgs`, inline: true },
            { name: "⚙️ Resources", value: `• Uptime: \`${getUptime()}\` \n• RAM: \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\``, inline: true }
        ],
        footer: { text: "Sphinx Analytics Pro v5.0" },
        timestamp: new Date()
    };

    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        if (isMonthly) stats.monthly = { msg: { c1: 0, c2: 0 } };
        else stats.daily = { msg: { c1: 0, c2: 0 }, words: { c1: 0, c2: 0 }, channels: { ar: 0, eng: 0 } };
    } catch (e) { console.log("Webhook Error"); }
}

// ===== تهيئة الحسابات =====
const client = new Discord.Client({ intents: [32767] });
const client2 = new Discord.Client({ intents: [32767] });

const track = (n, m) => {
    const k = `c${n}`;
    stats.daily.msg[k]++;
    stats.monthly.msg[k]++;
    stats.daily.words[k] += m.content.split(' ').length;
    if (m.channelId === "1261662361660555315") stats.daily.channels.ar++;
    else if (m.channelId === "1246427655855804477") stats.daily.channels.eng++;
};

client.on("messageCreate", (m) => { if (m.author.id === client.user.id) track(1, m); });
client2.on("messageCreate", (m) => { if (m.author.id === client2.user.id) track(2, m); });

client.on("ready", () => {
    console.log(`[+] Logged in as ${client.user.tag}`);
    setTimeout(() => sendStats("INITIAL BOOT"), 5000);
});

// تفعيل الليفل
const targetChannels = [
    { id: "1261662361660555315", type: "ar" },
    { id: "1246427655855804477", type: "eng" }
];

targetChannels.forEach(ch => {
    new userAccount(client, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
    new userAccount(client2, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
});

// ===== الجدولة =====
schedule.scheduleJob('0 0 * * *', () => sendStats("DAILY"));
schedule.scheduleJob('5 0 1 * *', () => sendStats("MONTHLY"));
schedule.scheduleJob('0 * * * *', async () => {
    try {
        const k = process.env.RENDER_API_KEY; const i = process.env.SERVICE_ID;
        if (k && i) await axios.post(`https://api.render.com/v1/services/${i}/restart`, {}, { headers: { 'Authorization': `Bearer ${k}` } });
    } catch (e) {}
});

// ===== واجهة الـ Web Dashboard =====
const app = express();
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sphinx Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@300;500&display=swap" rel="stylesheet">
        <style>
            body { background: #050505; color: white; font-family: 'Roboto', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; overflow: hidden; }
            .bg { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle at center, #1a1a3a 0%, #050505 100%); z-index: -1; }
            .card { background: rgba(20, 20, 20, 0.8); border: 1px solid #00d4ff; padding: 40px; border-radius: 20px; box-shadow: 0 0 50px rgba(0, 212, 255, 0.2); text-align: center; backdrop-filter: blur(10px); width: 450px; }
            h1 { font-family: 'Orbitron', sans-serif; color: #00d4ff; margin-bottom: 5px; text-shadow: 0 0 15px #00d4ff; }
            .uptime { font-size: 1.2rem; color: #00ff88; margin-bottom: 25px; font-family: 'Orbitron'; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .stat-item { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
            .stat-value { display: block; font-size: 1.4rem; font-weight: bold; color: #fff; }
            .stat-label { font-size: 0.7rem; color: #888; text-transform: uppercase; }
            .pulse { width: 10px; height: 10px; background: #00ff88; border-radius: 50%; display: inline-block; margin-right: 10px; box-shadow: 0 0 10px #00ff88; animation: p 1.5s infinite; }
            @keyframes p { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        </style>
        <script>setTimeout(() => location.reload(), 30000);</script>
    </head>
    <body>
        <div class="bg"></div>
        <div class="card">
            <div style="margin-bottom: 15px;"><span class="pulse"></span><span style="color:#00ff88; font-size: 0.8rem;">SYSTEM LIVE</span></div>
            <h1>SPHINX V5</h1>
            <div class="uptime">${getUptime()}</div>
            <div class="stats-grid">
                <div class="stat-item"><span class="stat-value">${stats.daily.msg.c1}</span><span class="stat-label">Acc 1 Messages</span></div>
                <div class="stat-item"><span class="stat-value">${stats.daily.msg.c2}</span><span class="stat-label">Acc 2 Messages</span></div>
                <div class="stat-item" style="grid-column: span 2;"><span class="stat-value" style="color:#00d4ff">${calcXP(stats.daily.msg.c1 + stats.daily.msg.c2)}</span><span class="stat-label">Current Session XP ✨</span></div>
            </div>
            <div style="margin-top: 25px; font-size: 0.7rem; color: #444;">Connected as: ${client.user ? client.user.tag : 'Connecting...'}</div>
        </div>
    </body>
    </html>
  `);
});

client.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 2000);
