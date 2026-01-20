require('dotenv').config(); // ضروري لقراءة ملف .env
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const schedule = require('node-schedule');
const axios = require('axios'); // لإرسال طلب الرستات

// التعديل: أصبح الآن يعمل كل رأس ساعة (0 * * * *)
const restartJob = schedule.scheduleJob('0 * * * *', async function() {
    console.log('Restarting the project...');
    
    try {
        // سحب البيانات من الـ .env
        const key = process.env.RENDER_API_KEY;
        const id = process.env.SERVICE_ID;
        
        await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        console.log('✅ Done: Render Service Restarted');
    } catch (e) {
        console.log('❌ Error: ' + e.message);
    }
});

const Discord = require("discord.js-selfbot-v13");

// ===== تسجيل الدخول =====
client.login(process.env.token1);
client2.login(process.env.token2);


// ===== الحساب الأول =====
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});

client.on("ready", async () => {
  console.log(`${client.user.username} is ready! (Account 1)`);
});

// ===== الحساب الثاني =====
const client2 = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});

client2.on("ready", async () => {
  console.log(`${client2.user.username} is ready! (Account 2)`);
});

const { userAccount } = require("sphinx-run");

// ===== leveling للحساب الأول =====
new userAccount(client, Discord).leveling({
  channel: "1261662361660555315",
  randomLetters: false,
  time: 13000,
  type: "ar",
});

new userAccount(client, Discord).leveling({
  channel: "1246427655855804477",
  randomLetters: false,
  time: 13000,
  type: "eng",
});

// ===== leveling للحساب الثاني =====
new userAccount(client2, Discord).leveling({
  channel: "1261662361660555315",
  randomLetters: false,
  time: 13000,
  type: "ar",
});

new userAccount(client2, Discord).leveling({
  channel: "1246427655855804477",
  randomLetters: false,
  time: 13000,
  type: "eng",
});

const express = require("express");
const app = express();
var listener = app.listen(process.env.PORT || 2000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});

app.get("/", (req, res) => {
  res.send(`<body><center><h1>Bot 24H ON!</h1></center></body>`);
});
