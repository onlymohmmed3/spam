process.on('unhandledRejection', console.error);
process.on('uncaughException', console.error);

// استيراد وحدة التوقيت
const schedule = require('node-schedule');

// جدولة إعادة التشغيل كل ساعتين
const restartJob = schedule.scheduleJob('0 */2 * * *', function() {
    console.log('Restart');
    // قم بإضافة الكود الخاص بإعادة تشغيل التطبيق هنا
});

const Discord = require("discord.js-selfbot-v13");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});
client.on("ready", async () => {
  console.log(`${client.user.username} is ready!`);
});
const { userAccount } = require("sphinx-run");
new userAccount(client, Discord).leveling({
  channel: "1261662361660555315",
  randomLetters: false,
  time: 10000, //الوقت
  type: "ar", //الغةا
});

new userAccount(client, Discord).leveling({
  channel: "1261662361660555315",
  randomLetters: false,
  time: 10000, //الوقت
  type: "eng", //الغةا
});

//client.login("");
client.login(process.env.token);

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
