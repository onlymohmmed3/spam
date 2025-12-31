require('dotenv').config();
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const schedule = require('node-schedule');
const axios = require('axios');
const Discord = require("discord.js-selfbot-v13");
const express = require("express");
const { userAccount } = require("sphinx-run");

// ===== تهيئة Express =====
const app = express();
app.use(express.json());
app.use(express.static('public'));

// ===== إعدادات النظام =====
const systemConfig = {
  accounts: {
    account1: {
      enabled: true,
      channels: {
        ar: { enabled: true, channelId: "1261662361660555315", time: 12000 },
        eng: { enabled: true, channelId: "1246427655855804477", time: 12000 }
      },
      stats: {
        messagesSent: 0,
        lastActive: null,
        errors: 0
      }
    },
    account2: {
      enabled: true,
      channels: {
        ar: { enabled: true, channelId: "1261662361660555315", time: 12000 },
        eng: { enabled: true, channelId: "1246427655855804477", time: 12000 }
      },
      stats: {
        messagesSent: 0,
        lastActive: null,
        errors: 0
      }
    }
  },
  autoRestart: {
    enabled: true,
    schedule: '0 * * * *'
  },
  webhook: {
    url: process.env.WEBHOOK_URL || '',
    dailyReport: true,
    reportTime: '0 0 * * *' // كل يوم 12 بالليل
  }
};

// ===== الحساب الأول =====
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});

let levelingInstance1Ar = null;
let levelingInstance1Eng = null;

client.on("ready", async () => {
  console.log(`✅ ${client.user.username} is ready! (Account 1)`);
  systemConfig.accounts.account1.stats.lastActive = new Date();
  
  // تفعيل الليفلينج
  startLeveling('account1');
});

// ===== الحساب الثاني =====
const client2 = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});

let levelingInstance2Ar = null;
let levelingInstance2Eng = null;

client2.on("ready", async () => {
  console.log(`✅ ${client2.user.username} is ready! (Account 2)`);
  systemConfig.accounts.account2.stats.lastActive = new Date();
  
  // تفعيل الليفلينج
  startLeveling('account2');
});

// ===== وظيفة لبدء/إيقاف الليفلينج =====
function startLeveling(accountName) {
  const account = systemConfig.accounts[accountName];
  const clientInstance = accountName === 'account1' ? client : client2;
  
  if (!account.enabled) return;

  // العربي
  if (account.channels.ar.enabled) {
    if (accountName === 'account1') {
      levelingInstance1Ar = new userAccount(clientInstance, Discord).leveling({
        channel: account.channels.ar.channelId,
        randomLetters: false,
        time: account.channels.ar.time,
        type: "ar",
      });
    } else {
      levelingInstance2Ar = new userAccount(clientInstance, Discord).leveling({
        channel: account.channels.ar.channelId,
        randomLetters: false,
        time: account.channels.ar.time,
        type: "ar",
      });
    }
  }

  // الإنجليزي
  if (account.channels.eng.enabled) {
    if (accountName === 'account1') {
      levelingInstance1Eng = new userAccount(clientInstance, Discord).leveling({
        channel: account.channels.eng.channelId,
        randomLetters: false,
        time: account.channels.eng.time,
        type: "eng",
      });
    } else {
      levelingInstance2Eng = new userAccount(clientInstance, Discord).leveling({
        channel: account.channels.eng.channelId,
        randomLetters: false,
        time: account.channels.eng.time,
        type: "eng",
      });
    }
  }
}

// ===== تتبع الرسائل =====
client.on('messageCreate', (message) => {
  if (message.author.id === client.user.id) {
    systemConfig.accounts.account1.stats.messagesSent++;
    systemConfig.accounts.account1.stats.lastActive = new Date();
  }
});

client2.on('messageCreate', (message) => {
  if (message.author.id === client2.user.id) {
    systemConfig.accounts.account2.stats.messagesSent++;
    systemConfig.accounts.account2.stats.lastActive = new Date();
  }
});

// ===== وظيفة إرسال الويب هوك =====
async function sendWebhook(title, description, color = 3447003, fields = []) {
  if (!systemConfig.webhook.url) return;
  
  try {
    await axios.post(systemConfig.webhook.url, {
      embeds: [{
        title: title,
        description: description,
        color: color,
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Discord Leveling Bot System"
        }
      }]
    });
    console.log('✅ Webhook sent successfully');
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
  }
}

// ===== التقرير اليومي =====
schedule.scheduleJob(systemConfig.webhook.reportTime, async function() {
  if (!systemConfig.webhook.dailyReport) return;
  
  const fields = [];
  
  for (const [accountName, account] of Object.entries(systemConfig.accounts)) {
    fields.push({
      name: `📊 ${accountName}`,
      value: `الرسائل المرسلة: ${account.stats.messagesSent}
الأخطاء: ${account.stats.errors}
آخر نشاط: ${account.stats.lastActive ? account.stats.lastActive.toLocaleString('ar-SA') : 'غير متاح'}
الحالة: ${account.enabled ? '🟢 مفعّل' : '🔴 معطّل'}`,
      inline: true
    });
  }
  
  await sendWebhook(
    '📈 التقرير اليومي',
    'إحصائيات آخر 24 ساعة',
    3066993,
    fields
  );
  
  // إعادة تعيين الإحصائيات
  systemConfig.accounts.account1.stats.messagesSent = 0;
  systemConfig.accounts.account2.stats.messagesSent = 0;
});

// ===== جدولة إعادة التشغيل التلقائية =====
let restartJob = null;
function scheduleRestart() {
  if (restartJob) restartJob.cancel();
  
  if (systemConfig.autoRestart.enabled) {
    restartJob = schedule.scheduleJob(systemConfig.autoRestart.schedule, async function() {
      console.log('🔄 Restarting the project...');
      
      try {
        const key = process.env.RENDER_API_KEY;
        const id = process.env.SERVICE_ID;
        
        await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        
        console.log('✅ Done: Render Service Restarted');
        await sendWebhook('🔄 إعادة التشغيل', 'تم إعادة تشغيل الخدمة بنجاح', 3066993);
      } catch (e) {
        console.log('❌ Error: ' + e.message);
        await sendWebhook('⚠️ خطأ في إعادة التشغيل', e.message, 15158332);
      }
    });
  }
}

scheduleRestart();

// ===== API Endpoints =====

// الصفحة الرئيسية - لوحة التحكم
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة تحكم البوت</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-weight: bold;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .card h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .account-card {
            border-right: 5px solid #667eea;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: #f8f9fa;
            margin-bottom: 10px;
            border-radius: 8px;
            align-items: center;
        }
        
        .stat-label {
            font-weight: bold;
            color: #495057;
        }
        
        .stat-value {
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }
        
        .toggle-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            width: 100%;
            margin-top: 10px;
            transition: transform 0.2s;
        }
        
        .toggle-btn:hover {
            transform: scale(1.05);
        }
        
        .toggle-btn.disabled {
            background: #dc3545;
        }
        
        .action-btn {
            background: #10b981;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            width: 100%;
            margin-top: 10px;
            transition: all 0.3s;
        }
        
        .action-btn:hover {
            background: #059669;
            transform: translateY(-2px);
        }
        
        .action-btn.danger {
            background: #ef4444;
        }
        
        .action-btn.danger:hover {
            background: #dc2626;
        }
        
        .input-group {
            margin-bottom: 15px;
        }
        
        .input-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #495057;
        }
        
        .input-group input,
        .input-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: none;
            z-index: 1000;
            min-width: 300px;
            text-align: center;
        }
        
        .notification.show {
            display: block;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-100px);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
        
        .channel-control {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .channel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .language-badge {
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }
        
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: #10b981;
        }
        
        input:checked + .slider:before {
            transform: translateX(26px);
        }
    </style>
</head>
<body>
    <div class="notification" id="notification"></div>
    
    <div class="container">
        <div class="header">
            <h1>🤖 لوحة تحكم بوت الليفلينج</h1>
            <div class="status-badge">🟢 البوت يعمل</div>
        </div>
        
        <div class="grid">
            <!-- بطاقة الحساب الأول -->
            <div class="card account-card">
                <h2>👤 الحساب الأول</h2>
                <div class="stat-item">
                    <span class="stat-label">📨 الرسائل المرسلة</span>
                    <span class="stat-value" id="acc1-messages">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">⚠️ الأخطاء</span>
                    <span class="stat-value" id="acc1-errors">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🕐 آخر نشاط</span>
                    <span class="stat-value" id="acc1-active">-</span>
                </div>
                
                <div class="channel-control">
                    <div class="channel-header">
                        <span class="language-badge">🇸🇦 العربية</span>
                        <label class="switch">
                            <input type="checkbox" id="acc1-ar-toggle" checked onchange="toggleLanguage('account1', 'ar', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="channel-control">
                    <div class="channel-header">
                        <span class="language-badge">🇬🇧 الإنجليزية</span>
                        <label class="switch">
                            <input type="checkbox" id="acc1-eng-toggle" checked onchange="toggleLanguage('account1', 'eng', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <button class="toggle-btn" id="acc1-toggle" onclick="toggleAccount('account1')">
                    🔴 إيقاف الحساب
                </button>
            </div>
            
            <!-- بطاقة الحساب الثاني -->
            <div class="card account-card">
                <h2>👤 الحساب الثاني</h2>
                <div class="stat-item">
                    <span class="stat-label">📨 الرسائل المرسلة</span>
                    <span class="stat-value" id="acc2-messages">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">⚠️ الأخطاء</span>
                    <span class="stat-value" id="acc2-errors">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🕐 آخر نشاط</span>
                    <span class="stat-value" id="acc2-active">-</span>
                </div>
                
                <div class="channel-control">
                    <div class="channel-header">
                        <span class="language-badge">🇸🇦 العربية</span>
                        <label class="switch">
                            <input type="checkbox" id="acc2-ar-toggle" checked onchange="toggleLanguage('account2', 'ar', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="channel-control">
                    <div class="channel-header">
                        <span class="language-badge">🇬🇧 الإنجليزية</span>
                        <label class="switch">
                            <input type="checkbox" id="acc2-eng-toggle" checked onchange="toggleLanguage('account2', 'eng', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <button class="toggle-btn" id="acc2-toggle" onclick="toggleAccount('account2')">
                    🔴 إيقاف الحساب
                </button>
            </div>
            
            <!-- بطاقة الإعدادات العامة -->
            <div class="card">
                <h2>⚙️ الإعدادات العامة</h2>
                
                <div class="input-group">
                    <label>🔄 إعادة التشغيل التلقائي</label>
                    <label class="switch">
                        <input type="checkbox" id="auto-restart-toggle" checked onchange="toggleAutoRestart(this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="input-group">
                    <label>📊 التقرير اليومي</label>
                    <label class="switch">
                        <input type="checkbox" id="daily-report-toggle" checked onchange="toggleDailyReport(this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="input-group">
                    <label>🔗 رابط الويب هوك</label>
                    <input type="url" id="webhook-url" placeholder="https://discord.com/api/webhooks/...">
                    <button class="action-btn" onclick="updateWebhook()">💾 حفظ الرابط</button>
                </div>
            </div>
            
            <!-- بطاقة العمليات -->
            <div class="card">
                <h2>🎛️ عمليات النظام</h2>
                
                <button class="action-btn" onclick="restartService()">
                    🔄 إعادة تشغيل الخدمة
                </button>
                
                <button class="action-btn" onclick="sendTestWebhook()">
                    📨 إرسال ويب هوك تجريبي
                </button>
                
                <button class="action-btn" onclick="refreshStats()">
                    🔃 تحديث الإحصائيات
                </button>
                
                <button class="action-btn danger" onclick="resetStats()">
                    🗑️ إعادة تعيين الإحصائيات
                </button>
            </div>
        </div>
    </div>
    
    <script>
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.style.background = type === 'success' ? '#10b981' : '#ef4444';
            notification.style.color = 'white';
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        async function toggleAccount(account) {
            try {
                const response = await fetch('/api/toggle-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account })
                });
                
                const data = await response.json();
                showNotification(data.message);
                refreshStats();
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function toggleLanguage(account, language, enabled) {
            try {
                const response = await fetch('/api/toggle-language', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account, language, enabled })
                });
                
                const data = await response.json();
                showNotification(data.message);
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function toggleAutoRestart(enabled) {
            try {
                const response = await fetch('/api/toggle-auto-restart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled })
                });
                
                const data = await response.json();
                showNotification(data.message);
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function toggleDailyReport(enabled) {
            try {
                const response = await fetch('/api/toggle-daily-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled })
                });
                
                const data = await response.json();
                showNotification(data.message);
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function updateWebhook() {
            const url = document.getElementById('webhook-url').value;
            try {
                const response = await fetch('/api/update-webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                
                const data = await response.json();
                showNotification(data.message);
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function restartService() {
            if (!confirm('هل أنت متأكد من إعادة تشغيل الخدمة؟')) return;
            
            try {
                const response = await fetch('/api/restart', { method: 'POST' });
                const data = await response.json();
                showNotification(data.message);
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function sendTestWebhook() {
            try {
                const response = await fetch('/api/test-webhook', { method: 'POST' });
                const data = await response.json();
                showNotification(data.message);
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function resetStats() {
            if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإحصائيات؟')) return;
            
            try {
                const response = await fetch('/api/reset-stats', { method: 'POST' });
                const data = await response.json();
                showNotification(data.message);
                refreshStats();
            } catch (error) {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
        }
        
        async function refreshStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                // تحديث الحساب الأول
                document.getElementById('acc1-messages').textContent = data.account1.stats.messagesSent;
                document.getElementById('acc1-errors').textContent = data.account1.stats.errors;
                document.getElementById('acc1-active').textContent = data.account1.stats.lastActive || '-';
                
                // تحديث الحساب الثاني
                document.getElementById('acc2-messages').textContent = data.account2.stats.messagesSent;
                document.getElementById('acc2-errors').textContent = data.account2.stats.errors;
                document.getElementById('acc2-active').textContent = data.account2.stats.lastActive || '-';
                
                // تحديث أزرار التبديل
                const acc1Btn = document.getElementById('acc1-toggle');
                acc1Btn.textContent = data.account1.enabled ? '🔴 إيقاف الحساب' : '🟢 تفعيل الحساب';
                acc1Btn.classList.toggle('disabled', !data.account1.enabled);
                
                const acc2Btn = document.getElementById('acc2-toggle');
                acc2Btn.textContent = data.account2.enabled ? '🔴 إيقاف الحساب' : '🟢 تفعيل الحساب';
                acc2Btn.classList.toggle('disabled', !data.account2.enabled);
            } catch (error) {
                console.error('Error refreshing stats:', error);
            }
        }
        
        // تحديث تلقائي كل 5 ثوانٍ
        setInterval(refreshStats, 5000);
        refreshStats();
    </script>
</body>
</html>
  `);
});

// API: الحصول على الإحصائيات
app.get('/api/stats', (req, res) => {
  const stats = {
    account1: {
      enabled: systemConfig.accounts.account1.enabled,
      stats: {
        messagesSent: systemConfig.accounts.account1.stats.messagesSent,
        errors: systemConfig.accounts.account1.stats.errors,
        lastActive: systemConfig.accounts.account1.stats.lastActive 
          ? systemConfig.accounts.account1.stats.lastActive.toLocaleString('ar-SA')
          : null
      }
    },
    account2: {
      enabled: systemConfig.accounts.account2.enabled,
      stats: {
        messagesSent: systemConfig.accounts.account2.stats.messagesSent,
        errors: systemConfig.accounts.account2.stats.errors,
        lastActive: systemConfig.accounts.account2.stats.lastActive 
          ? systemConfig.accounts.account2.stats.lastActive.toLocaleString('ar-SA')
          : null
      }
    }
  };
  
  res.json(stats);
});

// API: تبديل تفعيل الحساب
app.post('/api/toggle-account', (req, res) => {
  const { account } = req.body;
  
  if (!systemConfig.accounts[account]) {
    return res.status(400).json({ message: 'حساب غير صالح' });
  }
  
  systemConfig.accounts[account].enabled = !systemConfig.accounts[account].enabled;
  
  res.json({
    message: `تم ${systemConfig.accounts[account].enabled ? 'تفعيل' : 'إيقاف'} ${account} بنجاح`,
    enabled: systemConfig.accounts[account].enabled
  });
});

// API: تبديل اللغة
app.post('/api/toggle-language', (req, res) => {
  const { account, language, enabled } = req.body;
  
  if (!systemConfig.accounts[account] || !systemConfig.accounts[account].channels[language]) {
    return res.status(400).json({ message: 'حساب أو لغة غير صالحة' });
  }
  
  systemConfig.accounts[account].channels[language].enabled = enabled;
  
  res.json({
    message: `تم ${enabled ? 'تفعيل' : 'إيقاف'} اللغة ${language} للحساب ${account}`,
    enabled: enabled
  });
});

// API: تبديل إعادة التشغيل التلقائية
app.post('/api/toggle-auto-restart', (req, res) => {
  const { enabled } = req.body;
  systemConfig.autoRestart.enabled = enabled;
  scheduleRestart();
  
  res.json({
    message: `تم ${enabled ? 'تفعيل' : 'إيقاف'} إعادة التشغيل التلقائية`,
    enabled: enabled
  });
});

// API: تبديل التقرير اليومي
app.post('/api/toggle-daily-report', (req, res) => {
  const { enabled } = req.body;
  systemConfig.webhook.dailyReport = enabled;
  
  res.json({
    message: `تم ${enabled ? 'تفعيل' : 'إيقاف'} التقرير اليومي`,
    enabled: enabled
  });
});

// API: تحديث الويب هوك
app.post('/api/update-webhook', (req, res) => {
  const { url } = req.body;
  systemConfig.webhook.url = url;
  
  res.json({
    message: 'تم تحديث رابط الويب هوك بنجاح',
    url: url
  });
});

// API: إعادة تشغيل الخدمة
app.post('/api/restart', async (req, res) => {
  try {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    
    if (!key || !id) {
      return res.status(400).json({ message: 'معلومات Render غير متوفرة' });
    }
    
    await axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    
    await sendWebhook('🔄 إعادة تشغيل يدوية', 'تم إعادة تشغيل الخدمة من لوحة التحكم', 3447003);
    
    res.json({ message: 'تم إرسال طلب إعادة التشغيل بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل إعادة التشغيل: ' + error.message });
  }
});

// API: إرسال ويب هوك تجريبي
app.post('/api/test-webhook', async (req, res) => {
  try {
    await sendWebhook(
      '🧪 اختبار الويب هوك',
      'هذه رسالة اختبارية من لوحة التحكم',
      3447003,
      [
        { name: '✅ الحالة', value: 'الويب هوك يعمل بشكل صحيح', inline: false }
      ]
    );
    
    res.json({ message: 'تم إرسال ويب هوك تجريبي بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل إرسال الويب هوك: ' + error.message });
  }
});

// API: إعادة تعيين الإحصائيات
app.post('/api/reset-stats', (req, res) => {
  systemConfig.accounts.account1.stats.messagesSent = 0;
  systemConfig.accounts.account1.stats.errors = 0;
  systemConfig.accounts.account2.stats.messagesSent = 0;
  systemConfig.accounts.account2.stats.errors = 0;
  
  res.json({ message: 'تم إعادة تعيين الإحصائيات بنجاح' });
});

// ===== تسجيل الدخول =====
client.login(process.env.token);
client2.login(process.env.token2);

// ===== بدء الخادم =====
const listener = app.listen(process.env.PORT || 2000, function () {
  console.log(`🚀 Server is running on port ${listener.address().port}`);
  console.log(`🌐 Dashboard: http://localhost:${listener.address().port}`);
});
