require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const startTime = Date.now();

// نظام الإحصائيات المتقدم (عربي/إنجليزي)
let stats = {
    c1: { ar: 0, en: 0, total: 0 },
    c2: { ar: 0, en: 0, total: 0 }
};

const getUptimeData = () => {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { d, h, m, s, total: totalSeconds };
};

// وظيفة تتبع اللغة والقنوات
const track = (acc, channelId) => {
    const key = acc === 1 ? 'c1' : 'c2';
    stats[key].total++;
    if (channelId === "1261662361660555315") stats[key].ar++;
    else if (channelId === "1246427655855804477") stats[key].en++;
};

// إرسال الويب هوك
async function sendStats(type = "DAILY") {
    if (!WEBHOOK_URL) return;
    const uptime = getUptimeData();
    const embed = {
        title: `📊 ${type} ANALYTICS`,
        color: 0x00E5FF,
        fields: [
            { name: "👤 Account 1", value: `AR: \`${stats.c1.ar}\` | EN: \`${stats.c1.en}\``, inline: true },
            { name: "👤 Account 2", value: `AR: \`${stats.c2.ar}\` | EN: \`${stats.c2.en}\``, inline: true },
            { name: "⏱️ Uptime", value: `\`${uptime.d}d ${uptime.h}h ${uptime.m}m\``, inline: false }
        ],
        timestamp: new Date()
    };
    try { await axios.post(WEBHOOK_URL, { embeds: [embed] }); } catch (e) {}
}

const client = new Discord.Client({ intents: [32767] });
const client2 = new Discord.Client({ intents: [32767] });

client.on("messageCreate", (m) => { if (m.author.id === client.user.id) track(1, m.channelId); });
client2.on("messageCreate", (m) => { if (m.author.id === client2.user.id) track(2, m.channelId); });

const targetChannels = [
    { id: "1261662361660555315", type: "ar" },
    { id: "1246427655855804477", type: "eng" }
];

client.on("ready", () => {
    console.log("System Online");
    targetChannels.forEach(ch => {
        new userAccount(client, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
        new userAccount(client2, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
    });
});

schedule.scheduleJob('0 0 * * *', () => sendStats("DAILY_REPORT"));

// ===== واجهة الويب الخرافية (The 20-Year Experience UI) =====
const app = express();
app.get("/", (req, res) => {
    const up = getUptimeData();
    const getPercent = (val, total) => total === 0 ? 0 : Math.round((val / total) * 100);
    
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Control Center | v6.0</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap" rel="stylesheet">
        <style>
            :root { --p: #00e5ff; --bg: #050508; }
            body { margin: 0; background: var(--bg); color: white; font-family: 'Space Grotesk', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
            .glow { position: fixed; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%); top: -10vw; left: -10vw; z-index: -1; }
            .dashboard { width: 850px; background: rgba(15, 15, 25, 0.8); border: 1px solid rgba(255,255,255,0.05); padding: 40px; border-radius: 30px; backdrop-filter: blur(20px); box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
            header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
            #timer { font-size: 4rem; font-weight: 300; letter-spacing: -3px; color: #fff; margin: -10px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .acc-card { background: rgba(255,255,255,0.02); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
            .acc-title { font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; display: block; }
            .lang-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; }
            .bar-bg { height: 6px; background: #111; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
            .bar-fill { height: 100%; background: var(--p); box-shadow: 0 0 10px var(--p); transition: 0.5s; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
            .info-item { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; text-align: center; }
            .info-val { display: block; font-weight: 700; color: var(--p); font-size: 1.2rem; }
            .info-lbl { font-size: 0.6rem; color: #444; }
        </style>
    </head>
    <body>
        <div class="glow"></div>
        <div class="dashboard">
            <header>
                <div>
                    <span style="color:var(--p); font-size: 0.8rem; letter-spacing: 3px;">SYSTEM UPTIME</span>
                    <div id="timer">${up.d}d ${up.h}h ${up.m}m ${up.s}s</div>
                </div>
                <div style="text-align: right">
                    <div style="font-size: 0.8rem; color: #444;">ENGINE STATUS</div>
                    <div style="color: #00ff88; font-size: 0.9rem;">OPTIMIZED</div>
                </div>
            </header>
            
            <div class="grid">
                <div class="acc-card">
                    <span class="acc-title">Primary Node Activity</span>
                    <div class="lang-row"><span>Arabic vs English</span> <span>${getPercent(stats.c1.ar, stats.c1.total)}% / ${getPercent(stats.c1.en, stats.c1.total)}%</span></div>
                    <div class="bar-bg"><div class="bar-fill" style="width: ${getPercent(stats.c1.ar, stats.c1.total)}%"></div></div>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-val">${stats.c1.ar}</span><span class="info-lbl">AR MESSAGES</span></div>
                        <div class="info-item"><span class="info-val">${stats.c1.en}</span><span class="info-lbl">EN MESSAGES</span></div>
                    </div>
                </div>

                <div class="acc-card">
                    <span class="acc-title">Secondary Node Activity</span>
                    <div class="lang-row"><span>Arabic vs English</span> <span>${getPercent(stats.c2.ar, stats.c2.total)}% / ${getPercent(stats.c2.en, stats.c2.total)}%</span></div>
                    <div class="bar-bg"><div class="bar-fill" style="width: ${getPercent(stats.c2.ar, stats.c2.total)}%"></div></div>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-val">${stats.c2.ar}</span><span class="info-lbl">AR MESSAGES</span></div>
                        <div class="info-item"><span class="info-val">${stats.c2.en}</span><span class="info-lbl">EN MESSAGES</span></div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let t = ${up.total};
            setInterval(() => {
                t++;
                let d=Math.floor(t/86400), h=Math.floor((t%86400)/3600), m=Math.floor((t%3600)/60), s=t%60;
                document.getElementById('timer').innerText = d+"d "+h+"h "+m+"m "+s+"s";
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
