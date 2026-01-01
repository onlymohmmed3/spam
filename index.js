require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const startTime = Date.now();

// ===== نظام الإحصائيات المتقدم =====
let stats = {
    daily: {
        msg: { c1: 0, c2: 0 },
        xp: { c1: 0, c2: 0 },
        words: { c1: 0, c2: 0 },
        channels: { ar: 0, eng: 0 }
    },
    monthly: {
        msg: { c1: 0, c2: 0 },
        xp: { c1: 0, c2: 0 }
    }
};

const getUptime = () => {
    const totalSeconds = (Date.now() - startTime) / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
};

const drawBar = (current, total) => {
    const size = 10;
    const totalVal = total === 0 ? 1 : total;
    const progress = Math.min(Math.round((size * current) / totalVal), size);
    return `\`[${"■".repeat(progress)}${"□".repeat(size - progress)}]\` ${Math.round((current / totalVal) * 100)}%`;
};

async function sendStats(type = "DAILY") {
    if (!WEBHOOK_URL) return console.log("❌ Error: WEBHOOK_URL is not defined in .env");

    const isMonthly = type === "MONTHLY" || type === "TEST";
    const data = isMonthly && type !== "TEST" ? stats.monthly : stats.daily;
    const totalMsgs = data.msg.c1 + data.msg.c2;
    const totalXP = data.xp.c1 + data.xp.c2;

    const embed = {
        title: `📊 ${type} ANALYTICS DASHBOARD`,
        color: type === "TEST" ? 0x3498db : (isMonthly ? 0xD4AF37 : 0x2ecc71),
        description: `### System Performance Report\n**Status:** \`TESTING MODE\`\n**Time:** \`${new Date().toLocaleString()}\``,
        fields: [
            { 
                name: "📈 General Metrics", 
                value: `• **Total Messages:** \`${totalMsgs}\`\n• **Estimated XP:** \`${totalXP}\` ✨\n• **Total Words:** \`${data.words.c1 + data.words.c2}\` 📝`, 
                inline: false 
            },
            { 
                name: "👤 Account 1 Activity", 
                value: `${drawBar(data.msg.c1, totalMsgs)}\n\`${data.msg.c1}\` Messages sent`, 
                inline: true 
            },
            { 
                name: "👤 Account 2 Activity", 
                value: `${drawBar(data.msg.c2, totalMsgs)}\n\`${data.msg.c2}\` Messages sent`, 
                inline: true 
            },
            { 
                name: "🌐 Channels", 
                value: `• Arabic: \`${data.channels.ar}\`\n• English: \`${data.channels.eng}\``, 
                inline: true 
            },
            { 
                name: "🛠️ System Status", 
                value: `• Uptime: \`${getUptime()}\` \n• RAM: \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``, 
                inline: true 
            }
        ],
        footer: { text: "Sphinx-Run Monitoring System • Testing Active" },
        timestamp: new Date()
    };

    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        console.log(`✅ ${type} Webhook Sent Successfully!`);
    } catch (err) { 
        console.error("❌ Webhook Error: " + (err.response ? err.response.data.message : err.message)); 
    }
}

// ===== الحسابات والـ Leveling =====
const client = new Discord.Client({ intents: [32767] });
const client2 = new Discord.Client({ intents: [32767] });

const trackActivity = (clientNum, msg) => {
    const cKey = `c${clientNum}`;
    stats.daily.msg[cKey]++;
    stats.monthly.msg[cKey]++;
    stats.daily.xp[cKey] += 15;
    stats.daily.words[cKey] += msg.content.split(/\s+/).length;
    
    if (msg.channelId === "1261662361660555315") stats.daily.channels.ar++;
    else if (msg.channelId === "1246427655855804477") stats.daily.channels.eng++;
};

client.on("messageCreate", (msg) => { if (msg.author.id === client.user.id) trackActivity(1, msg); });
client2.on("messageCreate", (msg) => { if (msg.author.id === client2.user.id) trackActivity(2, msg); });

client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.username}`);
    // تجربة إرسال أول ما يشتغل البوت بـ 5 ثواني
    setTimeout(() => sendStats("TEST - INITIAL START"), 5000);
});

client2.on("ready", () => console.log(`✅ Logged in as ${client2.user.username}`));

// إعداد الـ Leveling
const channels = [
    { id: "1261662361660555315", type: "ar" },
    { id: "1246427655855804477", type: "eng" }
];

channels.forEach(ch => {
    new userAccount(client, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
    new userAccount(client2, Discord).leveling({ channel: ch.id, randomLetters: false, time: 12000, type: ch.type });
});

// ===== الجدولة (Scheduling) =====

// إرسال تجريبي كل دقيقتين (للتأكد من عمل الأرقام)
schedule.scheduleJob('*/2 * * * *', () => sendStats("TEST - EVERY 2 MIN"));

// الجدولة الحقيقية (نهاية اليوم والشهر)
schedule.scheduleJob('0 0 * * *', () => sendStats("DAILY REPORT"));
schedule.scheduleJob('1 0 1 * *', () => sendStats("MONTHLY SUMMARY"));

// ريستارت ريندر
schedule.scheduleJob('0 * * * *', async () => {
    try {
        const key = process.env.RENDER_API_KEY;
        const id = process.env.SERVICE_ID;
        if (key && id) await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } });
    } catch (e) { console.log('Render Restart error'); }
});

// ===== تسجيل الدخول =====
client.login(process.env.token);
client2.login(process.env.token2);

const app = express();
app.get("/", (req, res) => res.send("Monitoring System is Online"));
app.listen(process.env.PORT || 2000);
