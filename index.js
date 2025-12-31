require('dotenv').config();
const express = require("express");
const axios = require('axios');
const schedule = require('node-schedule');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");

const app = express();
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

// --- Advanced System State ---
let systemStats = {
    startTime: Date.now(),
    totalMessages: 0,
    logs: [],
    // Control for Account 1
    acc1: { name: "Acc 1", ar: true, en: true, connected: false },
    // Control for Account 2
    acc2: { name: "Acc 2", ar: true, en: true, connected: false }
};

function addLog(msg) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    systemStats.logs.unshift(`[${time}] ${msg}`);
    if (systemStats.logs.length > 5) systemStats.logs.pop();
}

// --- Stealth Leveling Engine ---
function createSmartRunner(bot, accConfig) {
    const runner = new userAccount(bot, Discord);
    
    // Arabic Cycle
    setInterval(() => {
        if (accConfig.connected && accConfig.ar) {
            runner.leveling({ channel: "1261662361660555315", randomLetters: true, time: 12000 + Math.floor(Math.random() * 6000), type: "ar" });
            systemStats.totalMessages++;
            addLog(`${accConfig.name}: Sent AR`);
        }
    }, 19000);

    // English Cycle
    setInterval(() => {
        if (accConfig.connected && accConfig.en) {
            runner.leveling({ channel: "1246427655855804477", randomLetters: true, time: 12000 + Math.floor(Math.random() * 6000), type: "eng" });
            systemStats.totalMessages++;
            addLog(`${accConfig.name}: Sent EN`);
        }
    }, 21000);
}

// --- Dashboard UI ---
app.get("/", (req, res) => {
    const ramUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const ramPercent = Math.min((ramUsed / 512) * 100, 100);

    const renderAcc = (accKey) => {
        const acc = systemStats[accKey];
        return `
        <div style="background: #1e232b; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid ${acc.connected ? '#43b581' : '#f04747'};">
            <h3 style="margin:0 0 10px 0;">👤 ${acc.name} <span style="font-size:10px; color:${acc.connected ? '#43b581' : '#f04747'}">${acc.connected ? '[ONLINE]' : '[OFFLINE]'}</span></h3>
            <div style="display: flex; gap: 10px;">
                <button class="btn ${acc.ar ? 'btn-on' : 'btn-off'}" onclick="location.href='/toggle/${accKey}/ar'">Arabic: ${acc.ar ? 'ON' : 'OFF'}</button>
                <button class="btn ${acc.en ? 'btn-on' : 'btn-off'}" onclick="location.href='/toggle/${accKey}/en'">English: ${acc.en ? 'ON' : 'OFF'}</button>
            </div>
        </div>`;
    };

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SPAM-1 ULTIMATE PANEL</title>
        <style>
            body { background: #0b0e14; color: #e1e1e1; font-family: 'Segoe UI', Arial; display: flex; flex-direction: column; align-items: center; padding: 10px; }
            .container { background: #151921; padding: 20px; border-radius: 15px; width: 100%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .progress-bar { background: #5865f2; height: 100%; width: ${ramPercent}%; transition: 1s; }
            .btn { flex: 1; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; color: white; font-size: 11px; }
            .btn-on { background: #43b581; }
            .btn-off { background: #f04747; }
            .btn-restart { background: #faa61a; width: 100%; margin-top: 10px; padding: 12px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;}
            .logs { background: #000; color: #43b581; padding: 10px; height: 100px; border-radius: 5px; font-size: 11px; margin-top: 10px; overflow: hidden; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 style="text-align:center; color:#5865f2; margin-top:0;">SPAM-1 CONTROL CENTER</h2>
            
            <div style="display:flex; justify-content:space-around; margin-bottom:15px; font-size:14px;">
                <span>Total Messages: <b>${systemStats.totalMessages}</b></span>
                <span>RAM: <b>${ramUsed}MB</b></span>
            </div>

            ${renderAcc('acc1')}
            ${renderAcc('acc2')}

            <div class="logs">
                ${systemStats.logs.map(l => `<div>${l}</div>`).join('')}
            </div>

            <button class="btn-restart" onclick="location.href='/restart'">🔄 FULL SERVER RESTART</button>
        </div>
        <script>setTimeout(() => location.reload(), 8000);</script>
    </body>
    </html>
    `);
});

// --- Control Routes ---
app.get("/toggle/:acc/:type", (req, res) => {
    const { acc, type } = req.params;
    if (systemStats[acc]) {
        systemStats[acc][type] = !systemStats[acc][type];
    }
    res.redirect("/");
});

app.get("/restart", async (req, res) => {
    try {
        await axios.post(`https://api.render.com/v1/services/${process.env.SERVICE_ID}/restart`, {}, {
            headers: { 'Authorization': `Bearer ${process.env.RENDER_API_KEY}` }
        });
        res.send("<h1>System Rebooting...</h1>");
    } catch (e) { res.send("Restart Failed"); }
});

// --- Bot Initialization ---
client1.on("ready", () => { 
    systemStats.acc1.connected = true; 
    addLog("Account 1 Connected"); 
    createSmartRunner(client1, systemStats.acc1); 
});

client2.on("ready", () => { 
    systemStats.acc2.connected = true; 
    addLog("Account 2 Connected"); 
    createSmartRunner(client2, systemStats.acc2); 
});

client1.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 10000);
