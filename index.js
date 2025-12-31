require('dotenv').config();
const express = require("express");
const axios = require('axios');
const schedule = require('node-schedule');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");

const app = express();
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

// --- حالة النظام والإحصائيات ---
let systemStats = {
    startTime: Date.now(),
    totalMessages: 0,
    arActive: true,
    enActive: true,
    logs: [],
    dailyCount: 0
};

// وظيفة إضافة السجلات للوحة التحكم
function addLog(msg) {
    const time = new Date().toLocaleTimeString('ar-EG');
    systemStats.logs.unshift(`[${time}] ${msg}`);
    if (systemStats.logs.length > 5) systemStats.logs.pop();
}

// --- 1. نظام التنظيف الذاتي ومراقبة الذاكرة ---
setInterval(async () => {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    if (usedMemory > 400) { // 80% من الـ 512MB
        addLog("⚠️ الذاكرة ممتلئة! جاري إعادة التشغيل التلقائي...");
        await triggerRenderRestart();
    }
}, 30000);

async function triggerRenderRestart() {
    try {
        await axios.post(`https://api.render.com/v1/services/${process.env.SERVICE_ID}/restart`, {}, {
            headers: { 'Authorization': `Bearer ${process.env.RENDER_API_KEY}` }
        });
    } catch (e) { console.error("Restart Error"); }
}

// --- 4. وضع التخفي (Smart Delays) والـ Leveling ---
function startLevelingProcess(bot, accountName) {
    const runner = new userAccount(bot, Discord);
    
    // وظيفة إرسال ذكية مع تأخير عشوائي
    const runSmartLeveling = (type, channelId, isActiveKey) => {
        setInterval(() => {
            if (systemStats[isActiveKey]) {
                runner.leveling({
                    channel: channelId,
                    randomLetters: true,
                    time: 12000 + Math.floor(Math.random() * 5000), // تأخير عشوائي بين 12-17 ثانية
                    type: type
                });
                systemStats.totalMessages++;
                systemStats.dailyCount++;
                addLog(`✅ ${accountName} أرسل رسالة (${type})`);
            }
        }, 18000); // دورة التحقق
    };

    runSmartLeveling("ar", "1261662361660555315", "arActive");
    runSmartLeveling("eng", "1246427655855804477", "enActive");
}

// --- تقرير الويب هوك اليومي (الساعة 12 ليلاً) ---
schedule.scheduleJob('0 0 * * *', async () => {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await axios.post(webhookUrl, {
                embeds: [{
                    title: "📊 التقرير اليومي للبوت SPAM-1",
                    color: 0x00ffcc,
                    fields: [
                        { name: "الرسائل اليومية", value: `${systemStats.dailyCount}`, inline: true },
                        { name: "الإجمالي العام", value: `${systemStats.totalMessages}`, inline: true },
                        { name: "وقت العمل", value: `${Math.round((Date.now() - systemStats.startTime)/3600000)} ساعة`, inline: true }
                    ],
                    timestamp: new Date()
                }]
            });
            systemStats.dailyCount = 0; // تصفير العداد اليومي بعد التقرير
        } catch (e) { console.error("Webhook Error"); }
    }
});

// --- لوحة التحكم (Dashboard) ---
app.get("/", (req, res) => {
    const ramUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const ramPercent = Math.min((ramUsed / 512) * 100, 100);

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <style>
            body { background: #1a1a2e; color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
            .container { background: #16213e; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 90%; max-width: 600px; }
            .header { color: #4834d4; text-shadow: 0 0 10px #4834d4; margin-bottom: 20px; }
            .progress-container { background: #0f3460; border-radius: 10px; height: 25px; width: 100%; margin: 15px 0; position: relative; }
            .progress-bar { background: linear-gradient(90deg, #4834d4, #be2edd); height: 100%; border-radius: 10px; width: ${ramPercent}%; transition: 0.5s; }
            .log-window { background: #0f0c29; border: 1px solid #4834d4; padding: 10px; height: 120px; border-radius: 10px; font-size: 13px; text-align: right; overflow: hidden; margin: 20px 0; }
            .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .btn { padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; color: white; transition: 0.3s; }
            .btn-ar { background: ${systemStats.arActive ? '#2ecc71' : '#e74c3c'}; }
            .btn-en { background: ${systemStats.enActive ? '#2ecc71' : '#e74c3c'}; }
            .btn-restart { background: #f0932b; grid-column: span 2; margin-top: 10px; }
            .stat-box { display: flex; justify-content: space-around; margin-top: 15px; background: #0f3460; padding: 10px; border-radius: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="header">SPAM-1 ULTIMATE v2</h1>
            
            <div class="stat-box">
                <div>الرسائل: <b>${systemStats.totalMessages}</b></div>
                <div>الذاكرة: <b>${ramUsed}MB</b></div>
            </div>

            <div class="progress-container">
                <div class="progress-bar"></div>
                <small style="position: absolute; left: 45%; top: 4px;">RAM: ${Math.round(ramPercent)}%</small>
            </div>

            <div class="log-window">
                ${systemStats.logs.map(l => `<div>${l}</div>`).join('')}
            </div>

            <div class="controls">
                <button class="btn btn-ar" onclick="location.href='/toggle/ar'">العربي: ${systemStats.arActive ? 'شغال' : 'متوقف'}</button>
                <button class="btn btn-en" onclick="location.href='/toggle/en'">الإنجليزي: ${systemStats.enActive ? 'شغال' : 'متوقف'}</button>
                <button class="btn btn-restart" onclick="location.href='/restart'">🔄 ريستارت السيرفر كاملاً</button>
            </div>
        </div>
        <script>setTimeout(() => location.reload(), 10000);</script>
    </body>
    </html>
    `);
});

// --- روابط التحكم من اللوحة ---
app.get("/toggle/:lang", (req, res) => {
    if (req.params.lang === "ar") systemStats.arActive = !systemStats.arActive;
    if (req.params.lang === "en") systemStats.enActive = !systemStats.enActive;
    res.redirect("/");
});

app.get("/restart", async (req, res) => {
    await triggerRenderRestart();
    res.send("<h1>جاري إعادة تشغيل النظام... انتظر 60 ثانية</h1>");
});

// --- تشغيل الحسابات ---
client1.on("ready", () => { addLog("Acc 1 Connected"); startLevelingProcess(client1, "Account 1"); });
client2.on("ready", () => { addLog("Acc 2 Connected"); startLevelingProcess(client2, "Account 2"); });

client1.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 10000);require('dotenv').config();
const express = require("express");
const axios = require('axios');
const schedule = require('node-schedule');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");

const app = express();
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

// --- حالة النظام والإحصائيات ---
let systemStats = {
    startTime: Date.now(),
    totalMessages: 0,
    arActive: true,
    enActive: true,
    logs: [],
    dailyCount: 0
};

// وظيفة إضافة السجلات للوحة التحكم
function addLog(msg) {
    const time = new Date().toLocaleTimeString('ar-EG');
    systemStats.logs.unshift(`[${time}] ${msg}`);
    if (systemStats.logs.length > 5) systemStats.logs.pop();
}

// --- 1. نظام التنظيف الذاتي ومراقبة الذاكرة ---
setInterval(async () => {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    if (usedMemory > 400) { // 80% من الـ 512MB
        addLog("⚠️ الذاكرة ممتلئة! جاري إعادة التشغيل التلقائي...");
        await triggerRenderRestart();
    }
}, 30000);

async function triggerRenderRestart() {
    try {
        await axios.post(`https://api.render.com/v1/services/${process.env.SERVICE_ID}/restart`, {}, {
            headers: { 'Authorization': `Bearer ${process.env.RENDER_API_KEY}` }
        });
    } catch (e) { console.error("Restart Error"); }
}

// --- 4. وضع التخفي (Smart Delays) والـ Leveling ---
function startLevelingProcess(bot, accountName) {
    const runner = new userAccount(bot, Discord);
    
    // وظيفة إرسال ذكية مع تأخير عشوائي
    const runSmartLeveling = (type, channelId, isActiveKey) => {
        setInterval(() => {
            if (systemStats[isActiveKey]) {
                runner.leveling({
                    channel: channelId,
                    randomLetters: true,
                    time: 12000 + Math.floor(Math.random() * 5000), // تأخير عشوائي بين 12-17 ثانية
                    type: type
                });
                systemStats.totalMessages++;
                systemStats.dailyCount++;
                addLog(`✅ ${accountName} أرسل رسالة (${type})`);
            }
        }, 18000); // دورة التحقق
    };

    runSmartLeveling("ar", "1261662361660555315", "arActive");
    runSmartLeveling("eng", "1246427655855804477", "enActive");
}

// --- تقرير الويب هوك اليومي (الساعة 12 ليلاً) ---
schedule.scheduleJob('0 0 * * *', async () => {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await axios.post(webhookUrl, {
                embeds: [{
                    title: "📊 التقرير اليومي للبوت SPAM-1",
                    color: 0x00ffcc,
                    fields: [
                        { name: "الرسائل اليومية", value: `${systemStats.dailyCount}`, inline: true },
                        { name: "الإجمالي العام", value: `${systemStats.totalMessages}`, inline: true },
                        { name: "وقت العمل", value: `${Math.round((Date.now() - systemStats.startTime)/3600000)} ساعة`, inline: true }
                    ],
                    timestamp: new Date()
                }]
            });
            systemStats.dailyCount = 0; // تصفير العداد اليومي بعد التقرير
        } catch (e) { console.error("Webhook Error"); }
    }
});

// --- لوحة التحكم (Dashboard) ---
app.get("/", (req, res) => {
    const ramUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const ramPercent = Math.min((ramUsed / 512) * 100, 100);

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <style>
            body { background: #1a1a2e; color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
            .container { background: #16213e; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 90%; max-width: 600px; }
            .header { color: #4834d4; text-shadow: 0 0 10px #4834d4; margin-bottom: 20px; }
            .progress-container { background: #0f3460; border-radius: 10px; height: 25px; width: 100%; margin: 15px 0; position: relative; }
            .progress-bar { background: linear-gradient(90deg, #4834d4, #be2edd); height: 100%; border-radius: 10px; width: ${ramPercent}%; transition: 0.5s; }
            .log-window { background: #0f0c29; border: 1px solid #4834d4; padding: 10px; height: 120px; border-radius: 10px; font-size: 13px; text-align: right; overflow: hidden; margin: 20px 0; }
            .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .btn { padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; color: white; transition: 0.3s; }
            .btn-ar { background: ${systemStats.arActive ? '#2ecc71' : '#e74c3c'}; }
            .btn-en { background: ${systemStats.enActive ? '#2ecc71' : '#e74c3c'}; }
            .btn-restart { background: #f0932b; grid-column: span 2; margin-top: 10px; }
            .stat-box { display: flex; justify-content: space-around; margin-top: 15px; background: #0f3460; padding: 10px; border-radius: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="header">SPAM-1 ULTIMATE v2</h1>
            
            <div class="stat-box">
                <div>الرسائل: <b>${systemStats.totalMessages}</b></div>
                <div>الذاكرة: <b>${ramUsed}MB</b></div>
            </div>

            <div class="progress-container">
                <div class="progress-bar"></div>
                <small style="position: absolute; left: 45%; top: 4px;">RAM: ${Math.round(ramPercent)}%</small>
            </div>

            <div class="log-window">
                ${systemStats.logs.map(l => `<div>${l}</div>`).join('')}
            </div>

            <div class="controls">
                <button class="btn btn-ar" onclick="location.href='/toggle/ar'">العربي: ${systemStats.arActive ? 'شغال' : 'متوقف'}</button>
                <button class="btn btn-en" onclick="location.href='/toggle/en'">الإنجليزي: ${systemStats.enActive ? 'شغال' : 'متوقف'}</button>
                <button class="btn btn-restart" onclick="location.href='/restart'">🔄 ريستارت السيرفر كاملاً</button>
            </div>
        </div>
        <script>setTimeout(() => location.reload(), 10000);</script>
    </body>
    </html>
    `);
});

// --- روابط التحكم من اللوحة ---
app.get("/toggle/:lang", (req, res) => {
    if (req.params.lang === "ar") systemStats.arActive = !systemStats.arActive;
    if (req.params.lang === "en") systemStats.enActive = !systemStats.enActive;
    res.redirect("/");
});

app.get("/restart", async (req, res) => {
    await triggerRenderRestart();
    res.send("<h1>جاري إعادة تشغيل النظام... انتظر 60 ثانية</h1>");
});

// --- تشغيل الحسابات ---
client1.on("ready", () => { addLog("Acc 1 Connected"); startLevelingProcess(client1, "Account 1"); });
client2.on("ready", () => { addLog("Acc 2 Connected"); startLevelingProcess(client2, "Account 2"); });

client1.login(process.env.token);
client2.login(process.env.token2);
app.listen(process.env.PORT || 10000);
