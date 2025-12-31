require('dotenv').config();
const express = require("express");
const axios = require('axios');
const schedule = require('node-schedule');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");

const app = express();
// تحسين: منع تكرار المستمعين لحل مشكلة الذاكرة
process.setMaxListeners(0); 

const client1 = new Discord.Client({ checkUpdate: false });
const client2 = new Discord.Client({ checkUpdate: false });

let stats = {
    total: 0,
    acc1: { online: false, ar: true, en: true },
    acc2: { online: false, ar: true, en: true },
    logs: []
};

function addLog(m) {
    const t = new Date().toLocaleTimeString('en-US', { hour12: true });
    stats.logs.unshift(`[${t}] ${m}`);
    if (stats.logs.length > 5) stats.logs.pop();
}

// نظام الرستات التلقائي لحماية الذاكرة (كل ساعة)
schedule.scheduleJob('0 * * * *', async () => {
    try {
        await axios.post(`https://api.render.com/v1/services/${process.env.SERVICE_ID}/restart`, {}, {
            headers: { 'Authorization': `Bearer ${process.env.RENDER_API_KEY}` }
        });
    } catch (e) { console.log("Restart error"); }
});

// محرك الإرسال الذكي (منع الانهيار)
function startSafeLeveling(bot, config, name) {
    const runner = new userAccount(bot, Discord);
    
    // تشغيل العربي
    setInterval(() => {
        if (config.online && config.ar) {
            runner.leveling({ channel: "1261662361660555315", randomLetters: true, time: 15000, type: "ar" });
            stats.total++;
            addLog(`${name}: Sent AR`);
        }
    }, 20000);

    // تشغيل الإنجليزي
    setInterval(() => {
        if (config.online && config.en) {
            runner.leveling({ channel: "1246427655855804477", randomLetters: true, time: 15000, type: "eng" });
            stats.total++;
            addLog(`${name}: Sent EN`);
        }
    }, 22000);
}

// واجهة التحكم (Dashboard)
app.get("/", (req, res) => {
    const ram = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    res.send(`
    <body style="background:#0b0e14; color:#fff; font-family:sans-serif; text-align:center; padding:20px;">
        <h2 style="color:#5865f2;">SPAM-1 ULTIMATE PANEL</h2>
        <div style="margin:20px; padding:15px; background:#151921; border-radius:10px;">
            <p>RAM Usage: <b>${ram}MB / 512MB</b></p>
            <p>Total Messages: <b>${stats.total}</b></p>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:500px; margin:auto;">
            <div style="background:#1e232b; padding:10px; border-radius:8px;">
                <h4>Account 1 (${stats.acc1.online ? 'ON' : 'OFF'})</h4>
                <button onclick="location.href='/t/acc1/ar'">AR: ${stats.acc1.ar ? 'ON' : 'OFF'}</button>
                <button onclick="location.href='/t/acc1/en'">EN: ${stats.acc1.en ? 'ON' : 'OFF'}</button>
            </div>
            <div style="background:#1e232b; padding:10px; border-radius:8px;">
                <h4>Account 2 (${stats.acc2.online ? 'ON' : 'OFF'})</h4>
                <button onclick="location.href='/t/acc2/ar'">AR: ${stats.acc2.ar ? 'ON' : 'OFF'}</button>
                <button onclick="location.href='/t/acc2/en'">EN: ${stats.acc2.en ? 'ON' : 'OFF'}</button>
            </div>
        </div>
        <div style="background:#000; color:#00ff00; padding:10px; margin-top:20px; font-family:monospace; font-size:12px; height:100px; overflow:hidden;">
            ${stats.logs.map(l => `<div>${l}</div>`).join('')}
        </div>
        <script>setTimeout(()=>location.reload(), 10000);</script>
    </body>
    `);
});

app.get("/t/:acc/:type", (req, res) => {
    const { acc, type } = req.params;
    stats[acc][type] = !stats[acc][type];
    res.redirect("/");
});

// تسجيل الدخول
client1.on("ready", () => { stats.acc1.online = true; addLog("Acc 1 Ready"); startSafeLeveling(client1, stats.acc1, "Acc 1"); });
client2.on("ready", () => { stats.acc2.online = true; addLog("Acc 2 Ready"); startSafeLeveling(client2, stats.acc2, "Acc 2"); });

client1.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 10000);
