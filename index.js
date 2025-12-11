process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const schedule = require('node-schedule');

const restartJob = schedule.scheduleJob('*/30 * * * *', function() {
    console.log('Restarting the project...');
    // إضافة الكود الخاص بإعادة تشغيل البرنامج هنا
});

const Discord = require("discord.js-selfbot-v13");

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
  time: 12000, //الوقت
  type: "ar", //الغةا
});

new userAccount(client, Discord).leveling({
  channel: "1246427655855804477",
  randomLetters: false,
  time: 12000, //الوقت
  type: "eng", //الغةا
});

// ===== leveling للحساب الثاني (نفس الإعدادات) =====
new userAccount(client2, Discord).leveling({
  channel: "1261662361660555315",
  randomLetters: false,
  time: 12000, //الوقت
  type: "ar", //الغةا
});

new userAccount(client2, Discord).leveling({
  channel: "1246427655855804477",
  randomLetters: false,
  time: 12000, //الوقت
  type: "eng", //الغةا
});

// ===== تسجيل الدخول للحسابين =====
// token للحساب الأول
client.login(process.env.token);

// token2 للحساب الثاني
client2.login(process.env.token2);

const express = require("express");
const app = express();
var listener = app.listen(process.env.PORT || 2000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
app.listen(() => console.log("I'm Ready To Work..! 24H"));
app.get("/", (req, res) => {
  res.send(`
  <body>
  <center><h1>Bot 24H ON!</h1></center
  </body>`);
});
