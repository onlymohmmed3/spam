require("dotenv").config();

const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const schedule = require("node-schedule");
const axios = require("axios");
const express = require("express");

// =====================
// 0) Tracking / Stats
// =====================
const startTime = Date.now();

// عدادات منفصلة لكل قناة لكل حساب لمراقبتها
const stats = {
  c1: { name: "ACCOUNT 1", total: 0, ar: 0, en: 0, ping: 0, lastArCount: 0, lastEnCount: 0 },
  c2: { name: "ACCOUNT 2", total: 0, ar: 0, en: 0, ping: 0, lastArCount: 0, lastEnCount: 0 },
};

// وقت آخر تغيير لكل عداد (بالملي ثانية)
let lastChangeTimes = {
  c1_ar: Date.now(),
  c1_en: Date.now(),
  c2_ar: Date.now(),
  c2_en: Date.now()
};

const client = new Discord.Client();
const client2 = new Discord.Client();

const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

// وظيفة لتوليد وقت عشوائي بين 12 و 17 ثانية
const getRandomTime = () => Math.floor(Math.random() * (17000 - 12000 + 1) + 12000);

// =====================
// 1) Ready Events
// =====================
client.on("ready", async () => {
  console.log(`[SYSTEM] Account 1: ${client.user.username} is ONLINE`);
  stats.c1.name = client.user.username;
});

client2.on("ready", async () => {
  console.log(`[SYSTEM] Account 2: ${client2.user.username} is ONLINE`);
  stats.c2.name = client2.user.username;
});

// =====================
// 2) Leveling (Sphinx-run)
// =====================
// تم استخدام وقت عشوائي بين 12-17 ثانية لكل عملية
new userAccount(client, Discord).leveling({ channel: CH_AR, randomLetters: false, time: getRandomTime(), type: "ar" });
new userAccount(client, Discord).leveling({ channel: CH_EN, randomLetters: false, time: getRandomTime(), type: "eng" });
new userAccount(client2, Discord).leveling({ channel: CH_AR, randomLetters: false, time: getRandomTime(), type: "ar" });
new userAccount(client2, Discord).leveling({ channel: CH_EN, randomLetters: false, time: getRandomTime(), type: "eng" });

// =====================
// 3) Message Counter & Watcher update
// =====================
function bumpCounters(acc, channelId) {
  stats[acc].total += 1;
  if (channelId === CH_AR) {
    stats[acc].ar += 1;
    lastChangeTimes[`${acc}_ar`] = Date.now(); // تحديث وقت آخر رسالة عربي
  }
  if (channelId === CH_EN) {
    stats[acc].en += 1;
    lastChangeTimes[`${acc}_en`] = Date.now(); // تحديث وقت آخر رسالة إنجليزي
  }
}

client.on("messageCreate", (msg) => {
  if (msg?.author?.id === client.user?.id) bumpCounters("c1", msg.channel?.id);
});

client2.on("messageCreate", (msg) => {
  if (msg?.author?.id === client2.user?.id) bumpCounters("c2", msg.channel?.id);
});

// =====================
// 4) Smart Watchdog (الفحص الدقيق لـ 4 أرقام)
// =====================
setInterval(async () => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // التحقق من الـ 4 حالات
  const issues = [
    { label: "Account 1 Arabic", time: lastChangeTimes.c1_ar },
    { label: "Account 1 English", time: lastChangeTimes.c1_en },
    { label: "Account 2 Arabic", time: lastChangeTimes.c2_ar },
    { label: "Account 2 English", time: lastChangeTimes.c2_en }
  ];

  for (const issue of issues) {
    if (now - issue.time > fiveMinutes) {
      console.log(`[WATCHDOG] ${issue.label} stopped for 5 mins! Restarting...`);
      return await triggerRestart(); // استدعاء الريستارت والتوقف عن فحص البقية
    }
  }
}, 60000); // يفحص كل دقيقة

async function triggerRestart() {
  const key = process.env.RENDER_API_KEY;
  const id = process.env.SERVICE_ID;
  if (key && id) {
    try {
      await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, {
        headers: { Authorization: `Bearer ${key}` }
      });
      console.log("Restart request sent to Render.");
      // تصفير الأوقات لتجنب إرسال طلبات متكررة قبل إعادة التشغيل
      const future = Date.now() + 600000; 
      lastChangeTimes = { c1_ar: future, c1_en: future, c2_ar: future, c2_en: future };
    } catch (e) { console.error("Restart API Error:", e.message); }
  }
}

// تسجيل الدخول
client.login(process.env.token);
client2.login(process.env.token2);

// =====================
// 5) Web Server
// =====================
const app = express();
app.get("/", (req, res) => res.send("System is Running and Monitoring 4 Streams..."));
app.get("/api/data", (req, res) => {
  res.json({ stats, lastActivity: lastChangeTimes });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Dashboard ready on port ${PORT}`));
