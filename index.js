require('dotenv').config(); // تحميل الإعدادات من ملف .env
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const schedule = require('node-schedule');
const axios = require('axios'); 
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

// استدعاء المتغيرات من ملف .env
const RENDER_API_KEY = process.env.RENDER_API_KEY; 
const SERVICE_ID = process.env.SERVICE_ID; 
const RESTART_URL = `https://api.render.com/v1/services/${SERVICE_ID}/restart`;

// وظيفة إعادة التشغيل التلقائي كل 30 دقيقة
schedule.scheduleJob('*/30 * * * *', async function() {
    console.log('--- [API] محاولة إعادة التشغيل المجدولة ---');
    try {
        await axios.post(RESTART_URL, {}, {
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ [API] تم إرسال الطلب بنجاح.');
    } catch (error) {
        console.error('❌ [API] فشل الطلب:', error.response ? error.response.data : error.message);
    }
});

// إعداد الحسابات
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

function startLeveling(botClient) {
    const channels = ["1261662361660555315", "1246427655855804477"];
    channels.forEach(id => {
        new userAccount(botClient, Discord).leveling({
            channel: id,
            randomLetters: false,
            time: 12000,
            type: id === "1261662361660555315" ? "ar" : "eng"
        });
    });
}

client1.on("ready", () => { console.log(`${client1.user.username} (1) Ready!`); startLeveling(client1); });
client2.on("ready", () => { console.log(`${client2.user.username} (2) Ready!`); startLeveling(client2); });

// تسجيل الدخول بالتوكنات الموجودة في .env
client1.login(process.env.token);
client2.login(process.env.token2);

const app = express();
app.get("/", (req, res) => res.send("Bot is Running & Securely Configured"));
app.listen(process.env.PORT || 10000);
