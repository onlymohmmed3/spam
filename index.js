process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const schedule = require('node-schedule');
const axios = require('axios'); // تأكد من تشغيل: npm install axios
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const express = require("express");

// ================= إعدادات إعادة التشغيل (Render API) =================
const RENDER_KEY = "rnd_7EdRVrZpeAYJlikDKmJvu5m5E2QW";
const RESTART_URL = "https://api.render.com/v1/services/srv-d4smmtngj27c73bpo15g/restart";

// جدولة إعادة التشغيل كل 30 دقيقة
schedule.scheduleJob('*/30 * * * *', async function() {
    console.log('--- بدأت عملية إعادة تشغيل الخدمة عبر API ---');
    try {
        await axios.post(RESTART_URL, {}, {
            headers: {
                'Authorization': `Bearer ${RENDER_KEY}`,
                'Accept': 'application/json'
            }
        });
        console.log('✅ تم إرسال الطلب بنجاح، سيقوم Render بإعادة التشغيل الآن.');
    } catch (error) {
        console.error('❌ خطأ في API:', error.response ? error.response.statusText : error.message);
    }
});

// ================= إعداد الحسابات (Selfbots) =================
const client1 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const client2 = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client1.on("ready", () => console.log(`${client1.user.username} (1) Ready!`));
client2.on("ready", () => console.log(`${client2.user.username} (2) Ready!`));

function runLeveling(client) {
    const channels = ["1261662361660555315", "1246427655855804477"];
    channels.forEach(ch => {
        new userAccount(client, Discord).leveling({
            channel: ch,
            randomLetters: false,
            time: 12000,
            type: ch === "1261662361660555315" ? "ar" : "eng"
        });
    });
}

runLeveling(client1);
runLeveling(client2);

client1.login(process.env.token);
client2.login(process.env.token2);

// ================= إعداد سيرفر الويب للبقاء حياً =================
const app = express();
app.get("/", (req, res) => res.send("Bot is Online & Auto-Restart is Active"));
app.listen(process.env.PORT || 2000, () => console.log("Web Server Ready"));
