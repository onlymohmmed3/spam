require('dotenv').config();
const express = require("express");
const axios = require('axios');
const schedule = require('node-schedule');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");

const app = express();
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

// --- System Status & Statistics ---
let systemStats = {
    startTime: Date.now(),
    totalMessages: 0,
    arActive: true,
    enActive: true,
    logs: [],
    dailyCount: 0
};

// Function to add logs to the Dashboard
function addLog(msg) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    systemStats.logs.unshift(`[${time}] ${msg}`);
    if (systemStats.logs.length > 5) systemStats.logs.pop();
}

// --- 1. Auto-Purge & Memory Management ---
setInterval(async () => {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    if (usedMemory > 400) { // 80% of 512MB
        addLog("⚠️ RAM High! Triggering Auto-Restart...");
        await triggerRenderRestart();
    }
}, 30000);

async function triggerRenderRestart() {
    try {
        await axios.post(`https://api.render.com/v1/services/${process.env.SERVICE_ID}/restart`, {}, {
            headers: { 'Authorization': `Bearer ${process.env.RENDER_API_KEY}` }
        });
    } catch (e) { console.error("Restart API Error"); }
}

// --- 4. Smart Delays (Stealth Mode) & Leveling ---
function startLevelingProcess(bot, accountName) {
    const runner = new userAccount(bot, Discord);
    
    const runSmartLeveling = (type, channelId, isActiveKey) => {
        setInterval(() => {
            if (systemStats[isActiveKey]) {
                runner.leveling({
                    channel: channelId,
                    randomLetters: true,
                    time: 12000 + Math.floor(Math.random() * 5000), // Random delay 12-17s
                    type: type
                });
                systemStats.totalMessages++;
                systemStats.dailyCount++;
                addLog(`✅ ${accountName} sent ${type} message`);
            }
        }, 18000); // Check cycle
    };

    runSmartLeveling("ar", "1261662361660555315", "arActive");
    runSmartLeveling("eng", "1246427655855804477", "enActive");
}

// --- Daily Webhook Report (12:00 AM) ---
schedule.scheduleJob('0 0 * * *', async () => {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await axios.post(webhookUrl, {
                embeds: [{
                    title: "📊 SPAM-1 Daily Performance Report",
                    color: 0x00ffcc,
                    fields: [
                        { name: "Daily Messages", value: `${systemStats.dailyCount}`, inline: true },
                        { name: "Total Messages", value: `${systemStats.totalMessages}`, inline: true },
                        { name: "Uptime", value: `${Math.round((Date.now() - systemStats.startTime)/3600000)} Hours`, inline: true }
                    ],
                    footer: { text: "System Auto-Reset Daily Counters" },
                    timestamp: new Date()
                }]
            });
            systemStats.dailyCount = 0; 
        } catch (e) { console.error("Webhook Error"); }
    }
});

// --- Advanced Dashboard (UI) ---
app.get("/", (req, res) => {
    const ramUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const ramPercent = Math.min((ramUsed / 512) * 100, 100);

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SPAM-1 Control Panel</title>
        <style>
            body { background: #0b0e14; color: #e1e1e1; font-family: 'Segoe UI', Arial; display: flex; flex-direction: column; align-items: center; padding: 20px; }
            .container { background: #151921; padding: 30px; border-radius: 15px; border: 1px solid #232931; width: 95%; max-width: 550px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
            .header { color: #5865f2; text-align: center; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px; }
            .progress-container { background: #232931; border-radius: 8px; height: 22px; width: 100%; margin: 15px 0; position: relative; overflow: hidden; }
            .progress-bar { background: linear-gradient(90deg, #5865f2, #a370f7); height: 100%; width: ${ramPercent}%; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); }
            .log-window { background: #000; color: #43b581; border: 1px solid #333; padding: 12px; height: 130px; border-radius: 8px; font-family: 'Courier New'; font-size: 12px; margin: 20px 0; overflow: hidden; }
            .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .btn { padding: 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; color: white; transition: 0.2s; text-transform: uppercase; font-size: 11px; }
            .btn-ar { background: ${systemStats.arActive ? '#43b581' : '#f04747'}; }
            .btn-en { background: ${systemStats.enActive ? '#43b581' : '#f04747'}; }
            .btn-restart { background: #faa61a; grid-column: span 2; margin-top: 10px; color: #000; }
            .stat-box { display: flex; justify-content: space-around; background: #1e232b; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
            .tag { font-size: 10px; background: #5865f2; padding: 2px 6px; border-radius: 4px; vertical-align: middle; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="header">SPAM-1 <span class="tag">PRO</span></h1>
            
            <div class="stat-box">
                <div>Messages: <b style="color:#5865f2">${systemStats.totalMessages}</b></div>
                <div>Memory: <b style="color:#faa61a">${ramUsed}MB</b></div>
            </div>

            <div class="progress-container">
                <div class="progress-bar"></div>
                <small style="position: absolute; width:100%; text-align:center; top: 3px; font-weight:bold; color:white; text-shadow: 1px 1px 2px #000;">RAM Usage: ${Math.round(ramPercent)}%</small>
            </div>

            <div class="log-window">
                <div style="color: #888; border-bottom: 1px solid #222; margin-bottom: 5px;">LIVE ACTIVITY STREAM:</div>
                ${systemStats.logs.map(l => `<div>${l}</div>`).join('')}
            </div>

            <div class="controls">
                <button class="btn btn-ar" onclick="location.href='/toggle/ar'">Arabic: ${systemStats.arActive ? 'ON' : 'OFF'}</button>
                <button class="btn btn-en" onclick="location.href='/toggle/en'">English: ${systemStats.enActive ? 'ON' : 'OFF'}</button>
                <button class="btn btn-restart" onclick="location.href='/restart'">🔄 Hard Server Restart</button>
            </div>
            
            <p style="text-align:center; font-size:10px; color:#555; margin-top:15px;">Dashboard updates every 10s</p>
        </div>
        <script>setTimeout(() => location.reload(), 10000);</script>
    </body>
    </html>
    `);
});

// --- API Control Routes ---
app.get("/toggle/:lang", (req, res) => {
    if (req.params.lang === "ar") systemStats.arActive = !systemStats.arActive;
    if (req.params.lang === "en") systemStats.enActive = !systemStats.enActive;
    res.redirect("/");
});

app.get("/restart", async (req, res) => {
    await triggerRenderRestart();
    res.send("<body style='background:#000;color:#fff;text-align:center;'><h1>Rebooting System...</h1><p>Please wait 60 seconds.</p></body>");
});

// --- Login & Initialize ---
client1.on("ready", () => { addLog("Bot Client 1 Connected"); startLevelingProcess(client1, "Acc 1"); });
client2.on("ready", () => { addLog("Bot Client 2 Connected"); startLevelingProcess(client2, "Acc 2"); });

client1.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 10000);
