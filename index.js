process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const schedule = require('node-schedule');
const axios = require('axios'); // تأكد من وجود axios في package.json
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

// ===== إعدادات Render مباشرة في الكود لضمان التشغيل =====
const RENDER_API_KEY = "rnd_7EdRVrZpeAYJlikDKmJvu5m5E2QW";
const SERVICE_ID = "srv-d4smmtngi27c73bpo15g";
const RESTART_URL = `https://api.render.com/v1/services/${SERVICE_ID}/restart`;

// وظيفة إعادة التشغيل الحقيقية كل 30 دقيقة
const restartJob = schedule.scheduleJob('*/30 * * * *', async function() {
    console.log('--- محاولة إعادة التشغيل عبر API ---');
    try {
        await axios.post(RESTART_URL, {}, {
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ تم إرسال طلب إعادة التشغيل بنجاح إلى Render');
    } catch (error) {
        console.error('❌ فشل طلب إعادة التشغيل:', error.response ? error.response.data : error.message);
    }
});

// ===== الحسابات والـ Leveling =====
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.on("ready", async () => { console.log(`${client.user.username} is ready! (Account 1)`); });
client2.on("ready", async () => { console.log(`${client2.user.username} is ready! (Account 2)`); });

// تشغيل الـ Leveling للحسابين
[client, client2].forEach(c => {
    new userAccount(c, Discord).leveling({ channel: "1261662361660555315", randomLetters: false, time: 12000, type: "ar" });
    new userAccount(c, Discord).leveling({ channel: "1246427655855804477", randomLetters: false, time: 12000, type: "eng" });
});

// تسجيل الدخول (يتطلب وجود token و token2 في إعدادات Render)
client.login(process.env.token);
client2.login(process.env.token2);

// ===== إعداد السيرفر للبقاء حياً =====
const app = express();
app.get("/", (req, res) => {
  res.send(`<body><center><h1>Bot 24H ON!</h1><p>Auto-Restart Active</p></center></body>`);
});

const listener = app.listen(process.env.PORT || 2000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
