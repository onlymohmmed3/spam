require('dotenv').config();
const express = require("express");
const axios = require('axios');
const schedule = require('node-schedule');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");

const app = express();
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

// --- Advanced System Monitoring State ---
let systemStats = {
    startTime: Date.now(),
    totalMessages: 0,
    dailyCount: 0,
    logs: [],
    // Management for Account 1
    acc1: { name: "Account 1", ar: true, en: true, connected: false, messages: 0 },
    // Management for Account 2
    acc2: { name: "Account 2", ar: true, en: true, connected: false, messages: 0 }
};

function addLog(msg) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    systemStats.logs.unshift(`[${time}] ${msg}`);
    if (systemStats.logs.length > 6) systemStats.logs.pop();
}

// --- 1. Anti-Crash Memory Management ---
setInterval(async () => {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    if (usedMemory > 400) { // Safety threshold at 80% of 512MB
        addLog("🚨 Critical: RAM Limit Reached! Restarting System...");
        await triggerRenderRestart();
    }
}, 30000);

async function triggerRenderRestart() {
    try {
        await axios.post(`https://api.render.com/v1/services/${process.env.SERVICE_ID}/restart`, {}, {
            headers: { 'Authorization': `Bearer ${process.env.RENDER_API_KEY}` }
        });
    } catch (e) { console.error("API Restart Failed"); }
}

// --- 4. Smart Leveling Engine (Stealth Mode) ---
function createSmartRunner(bot, accConfig) {
    const runner = new userAccount(bot, Discord);
    
    const sendLoop = (type, channelId, isActiveKey) => {
        setInterval(() => {
            if (accConfig.connected && accConfig[isActiveKey]) {
                runner.leveling({
                    channel: channelId,
                    randomLetters: true,
                    time: 12000 + Math.floor(Math.random() * 6000), // Human-like delay
                    type: type
                });
                systemStats.totalMessages++;
                systemStats.dailyCount++;
                accConfig.messages++;
                addLog(`${accConfig.name}: Sent ${type.toUpperCase()}`);
            }
        }, 19500); // Process cycle
    };

    sendLoop("ar", "1261662361660555315", "ar");
    sendLoop("eng", "1246427655855804477", "en");
}

// --- Daily Webhook Report (12:00 AM) ---
schedule.scheduleJob('0 0 * * *', async () => {
    if (process.env.WEBHOOK_URL) {
        try {
            await axios.post(process.env.WEBHOOK_URL, {
                embeds: [{
                    title: "📊 SPAM-1 Ultimate Daily Report",
                    color: 0x5865f2,
                    fields: [
                        { name: "Today's Messages", value: `${systemStats.dailyCount}`, inline: true },
                        { name: "All-Time Total", value: `${systemStats.totalMessages}`, inline: true },
                        { name: "System Uptime", value: `${Math.round((Date.now() - systemStats.startTime)/3600000)}h`, inline: true }
                    ],
                    timestamp: new Date()
                }]
            });
            systemStats.dailyCount = 0; 
        } catch (e) { console.error("Webhook Failed"); }
    }
});

// --- PRO Dashboard UI ---
app.get("/", (req, res) => {
    const ramUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const ramPercent = Math.min((ramUsed / 512) * 100, 100);

    const accountSection = (key) => {
        const acc = systemStats[key];
        return `
        <div style="background: #1e232b; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-right: 5px solid ${acc.connected ? '#43b581' : '#f04747'};">
            <h3 style="margin:0 0 10px 0; color:#fff;">👤 ${acc.name} <small style="color:${acc.connected ? '#43b581' : '#f04747'}">${acc.connected ? 'ONLINE' : 'OFFLINE'}</small></h3>
            <div style="display: flex; gap: 8px;">
                <button class="btn ${acc.ar ? 'on' : 'off'}" onclick="location.href='/toggle/${key}/ar'">AR: ${acc.ar ? 'ACTIVE' : 'OFF'}</button>
                <button class="btn ${acc.en ? 'on' : 'off'}" onclick="location.href='/toggle/${key}/en'">EN: ${acc.en ? 'ACTIVE' : 'OFF'}</button>
            </div>
            <div style="font-size: 11px; margin-top:8px; color:#888;">Messages Sent: ${acc.messages}</div>
        </div>`;
    };

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SPAM-1 ULTIMATE</title>
        <style>
            body { background: #0b0e14; color: #ccc; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
            .panel { background: #151921; padding: 25px; border-radius: 15px; width: 100%; max-width: 500px; box-shadow: 0 10px 40px #000; }
            .btn { flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; color: white; font-weight: bold; font-size: 11px; }
            .on { background: #43b581; } .off { background: #f04747; }
            .ram-container { background: #232931; border-radius: 5px; height: 18px; margin: 15px 0; overflow: hidden; position: relative; }
            .ram-bar { background: #5865f2; height: 100%; width: ${ramPercent}%; transition: 0.8s; }
            .logs { background: #000; color: #00ff00; padding: 10px; height: 110px; border-radius: 6px; font-size: 11px; font-family: monospace; overflow: hidden; margin-top: 15px; }
            .btn-restart { background: #faa61a; width: 100%; padding: 12px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="panel">
            <h2 style="text-align:center; color:#5865f2; margin-top:0;">SPAM-1 ULTIMATE PRO</h2>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>Total: <b>${systemStats.totalMessages}</b></span>
                <span>RAM: <b>${ramUsed}MB</b></span>
            </div>
            <div class="ram-container">
                <div class="ram-bar"></div>
            </div>

            ${accountSection('acc1')}
            ${accountSection('acc2')}

            <div class="logs">${systemStats.logs.map(l => `<div>${l}</div>`).join('')}</div>
            <button class="btn-restart" onclick="location.href='/restart'">🔄 FULL REBOOT SYSTEM</button>
        </div>
        <script>setTimeout(() => location.reload(), 9000);</script>
    </body>
    </html>
    `);
});

// --- Control API Routes ---
app.get("/toggle/:acc/:type", (req, res) => {
    const { acc, type } = req.params;
    if (systemStats[acc]) systemStats[acc][type] = !systemStats[acc][type];
    res.redirect("/");
});

app.get("/restart", async (req, res) => {
    await triggerRenderRestart();
    res.send("<body style='background:#000;color:#fff;text-align:center;'><h1>Rebooting... Please Wait</h1></body>");
});

// --- Bot Initialization ---
client1.on("ready", () => { systemStats.acc1.connected = true; addLog("Acc 1 Connected"); createSmartRunner(client1, systemStats.acc1); });
client2.on("ready", () => { systemStats.acc2.connected = true; addLog("Acc 2 Connected"); createSmartRunner(client2, systemStats.acc2); });

client1.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 10000);
