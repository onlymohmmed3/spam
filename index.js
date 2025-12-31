// حماية البوت من التوقف عند حدوث أخطاء برمجية مفاجئة
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

const schedule = require('node-schedule');
const axios = require('axios'); 
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

// ================= إعدادات RENDER النهائية =================
const RENDER_API_KEY = "rnd_7EdRVrZpeAYJlikDKmJvu5m5E2QW"; 
const SERVICE_ID = "srv-d4smmtngi27c73bpo15g"; // المعرف الذي تم تأكيده
const RESTART_URL = `https://api.render.com/v1/services/${SERVICE_ID}/restart`;

// وظيفة إعادة التشغيل التلقائي كل 30 دقيقة
schedule.scheduleJob('*/30 * * * *', async function() {
    console.log('--- [API] جاري بدء عملية إعادة التشغيل المجدولة ---');
    try {
        await axios.post(RESTART_URL, {}, {
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ [API] تم إرسال طلب إعادة التشغيل لـ Render بنجاح.');
    } catch (error) {
        console.error('❌ [API] فشل طلب إعادة التشغيل:', error.response ? error.response.data : error.message);
    }
});
// =========================================================

// إعداد حسابات الديسكورد
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

// دالة تشغيل الـ Leveling
function startLeveling(botClient) {
    const channels = ["1261662361660555315", "1246427655855804477"];
    channels.forEach(chID => {
        new userAccount(botClient, Discord).leveling({
            channel: chID,
            randomLetters: false,
            time: 12000,
            type: chID === "1261662361660555315" ? "ar" : "eng"
        });
    });
}

client1.on("ready", () => {
    console.log(`✅ ${client1.user.username} (Account 1) Ready!`);
    startLeveling(client1);
});

client2.on("ready", () => {
    console.log(`✅ ${client2.user.username} (Account 2) Ready!`);
    startLeveling(client2);
});

// تسجيل الدخول باستخدام التوكنات من البيئة (Environment Variables)
client1.login(process.env.token);
client2.login(process.env.token2);

// ================= إعداد سيرفر ويب للبقاء حياً =================
const app = express();
app.get("/", (req, res) => {
    res.send(`
        <body style="background-color: #1a1a1a; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>🤖 Bot is Running 24/7</h1>
            <p>Auto-Restart Status: <span style="color: #00ff00;">Active (Every 30 Mins)</span></p>
            <p>Service ID: ${SERVICE_ID}</p>
        </body>
    `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Web Server is running on port ${PORT}`);
});
