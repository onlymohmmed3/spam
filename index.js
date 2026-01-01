require('dotenv').config();
const Discord = require("discord.js-selfbot-v13");
const { userAccount } = require("sphinx-run");
const axios = require('axios');
const express = require("express");

const startTime = Date.now();
const CH_AR = "1261662361660555315";
const CH_EN = "1246427655855804477";

// نظام الحالة والتحكم
let logs = [];
let botConfigs = {
    c1: { ar: true, en: true, active: true, instance: null },
    c2: { ar: true, en: true, active: true, instance: null }
};

let stats = {
    c1: { ar: 0, en: 0, total: 0, name: "Acc 1" },
    c2: { ar: 0, en: 0, total: 0, name: "Acc 2" }
};

const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    logs.unshift(`[${time}] ${msg}`);
    if (logs.length > 25) logs.pop();
};

const client1 = new Discord.Client({ checkUpdate: false });
const client2 = new Discord.Client({ checkUpdate: false });

// دالة تشغيل/تحديث الليفلينج
function updateLeveling(clientNum) {
    const conf = botConfigs[`c${clientNum}`];
    const client = clientNum === 1 ? client1 : client2;
    
    if (!conf.active || !client.isReady()) return;

    // إعادة إنشاء المثيل (Instance) لتحديث الإعدادات
    const runner = new userAccount(client, Discord);
    
    if (conf.ar) {
        runner.leveling({ channel: CH_AR, randomLetters: false, time: 13000, type: "ar" });
        addLog(`Acc ${clientNum}: Arabic Node Started`);
    }
    if (conf.en) {
        runner.leveling({ channel: CH_EN, randomLetters: false, time: 13500, type: "eng" });
        addLog(`Acc ${clientNum}: English Node Started`);
    }
}

client1.on("ready", () => { stats.c1.name = client1.user.username; addLog("Acc 1 Online"); updateLeveling(1); });
client2.on("ready", () => { stats.c2.name = client2.user.username; addLog("Acc 2 Online"); setTimeout(() => updateLeveling(2), 5000); });

// تتبع الإحصائيات
const track = (m, acc) => {
    if (m.author.id === (acc === 1 ? client1.user.id : client2.user.id)) {
        stats[`c${acc}`].total++;
        if (m.channelId === CH_AR) stats[`c${acc}`].ar++;
        if (m.channelId === CH_EN) stats[`c${acc}`].en++;
    }
};

client1.on("messageCreate", (m) => track(m, 1));
client2.on("messageCreate", (m) => track(m, 2));

client1.login(process.env.token);
client2.login(process.env.token2);

// --- الواجهة ولوحة التحكم ---
const app = express();
app.use(express.json());

app.get("/api/data", (req, res) => {
    res.json({ uptime: Math.floor((Date.now() - startTime) / 1000), stats, configs: botConfigs, status: { c1: client1.isReady(), c2: client2.isReady() }, logs });
});

// استقبال أوامر التحكم من الواجهة
app.post("/api/toggle", (req, res) => {
    const { bot, type } = req.body; // bot: c1/c2, type: ar/en/active
    botConfigs[bot][type] = !botConfigs[bot][type];
    addLog(`Control: ${bot} ${type} toggled to ${botConfigs[bot][type]}`);
    
    // ملاحظة: مكتبة sphinx-run لا تدعم الإيقاف اللحظي بدون ريستارت
    // لذلك نوجه المستخدم لعمل ريستارت للسيرفر لتطبيق التغييرات
    res.json({ success: true });
});

app.post("/api/restart-server", (req, res) => {
    const key = process.env.RENDER_API_KEY;
    const id = process.env.SERVICE_ID;
    if (key && id) axios.post(`https://api.render.com/v1/services/${id}/restart`, {}, { headers: { 'Authorization': `Bearer ${key}` } });
    res.json({ success: true });
});

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Zenon Command Center</title>
        <style>
            :root { --bg: #050508; --card: #0f0f1a; --primary: #00f2ff; --accent: #00ff8c; }
            body { margin: 0; background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; display: grid; grid-template-columns: 1fr 350px; height: 100vh; }
            
            .main { padding: 40px; overflow-y: auto; }
            .side { background: #080810; border-left: 1px solid #1a1a25; padding: 20px; display: flex; flex-direction: column; }
            
            .bot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
            .card { background: var(--card); border-radius: 25px; padding: 30px; border: 1px solid #1a1a25; }
            
            .control-group { margin-top: 25px; display: flex; flex-direction: column; gap: 10px; }
            .toggle-btn { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 12px 20px; border-radius: 15px; background: #151525; cursor: pointer;
                transition: 0.3s; border: 1px solid transparent;
            }
            .toggle-btn.active { border-color: var(--primary); background: rgba(0, 242, 255, 0.05); }
            .toggle-btn:hover { background: #1a1a30; }
            
            .restart-all { 
                width: 100%; margin-top: 20px; padding: 15px; border-radius: 15px; 
                background: var(--primary); color: #000; font-weight: bold; border: none; cursor: pointer;
            }

            .stat-val { font-size: 3rem; font-weight: 800; color: var(--primary); }
            .log-msg { font-size: 0.75rem; color: #667; margin-bottom: 8px; font-family: monospace; border-bottom: 1px solid #111; padding-bottom: 4px; }
            .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
        </style>
    </head>
    <body>
        <div class="main">
            <h1 style="margin-top:0">Command <span style="color:var(--primary)">Center</span></h1>
            
            <div class="bot-grid">
                <div class="card">
                    <div style="display:flex; justify-content:space-between">
                        <h2 id="n1">Acc 1</h2>
                        <span id="s1" style="font-size:0.7rem">● OFFLINE</span>
                    </div>
                    <div class="stat-val" id="t1">0</div>
                    
                    <div class="control-group">
                        <div class="toggle-btn" id="btn-c1-active" onclick="toggle('c1', 'active')"><span>System Power</span><small id="st-c1-active">ON</small></div>
                        <div class="toggle-btn" id="btn-c1-ar" onclick="toggle('c1', 'ar')"><span>Arabic Node</span><small id="st-c1-ar">ON</small></div>
                        <div class="toggle-btn" id="btn-c1-en" onclick="toggle('c1', 'en')"><span>English Node</span><small id="st-c1-en">ON</small></div>
                    </div>
                </div>

                <div class="card">
                    <div style="display:flex; justify-content:space-between">
                        <h2 id="n2">Acc 2</h2>
                        <span id="s2" style="font-size:0.7rem">● OFFLINE</span>
                    </div>
                    <div class="stat-val" id="t2" style="color:var(--accent)">0</div>
                    
                    <div class="control-group">
                        <div class="toggle-btn" id="btn-c2-active" onclick="toggle('c2', 'active')"><span>System Power</span><small id="st-c2-active">ON</small></div>
                        <div class="toggle-btn" id="btn-c2-ar" onclick="toggle('c2', 'ar')"><span>Arabic Node</span><small id="st-c2-ar">ON</small></div>
                        <div class="toggle-btn" id="btn-c2-en" onclick="toggle('c2', 'en')"><span>English Node</span><small id="st-c2-en">ON</small></div>
                    </div>
                </div>
            </div>
            
            <button class="restart-all" onclick="applyChanges()">APPLY CHANGES & RESTART SERVER</button>
            <p style="color:#445; font-size:0.8rem; text-align:center;">* Applying changes will restart the service to update bot tasks.</p>
        </div>

        <div class="side">
            <h3 style="letter-spacing:2px; color:#334; font-size:0.8rem">LIVE SYSTEM LOGS</h3>
            <div id="logs" style="overflow-y:auto; flex:1"></div>
        </div>

        <script>
            async function toggle(bot, type) {
                await fetch('/api/toggle', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({bot, type})
                });
                updateUI();
            }

            async function applyChanges() {
                if(confirm('Restart server to apply new configuration?')) {
                    await fetch('/api/restart-server', {method: 'POST'});
                    alert('Server is restarting... please wait 1 minute.');
                }
            }

            async function updateUI() {
                const r = await fetch('/api/data');
                const d = await r.json();
                
                // Update Stats
                ['c1', 'c2'].forEach(b => {
                    document.getElementById('n'+(b=='c1'?1:2)).innerText = d.stats[b].name;
                    document.getElementById('t'+(b=='c1'?1:2)).innerText = d.stats[b].total;
                    document.getElementById('s'+(b=='c1'?1:2)).innerText = d.status[b] ? "● ONLINE" : "● OFFLINE";
                    document.getElementById('s'+(b=='c1'?1:2)).style.color = d.status[b] ? "#00ff8c" : "#ff4444";
                    
                    // Update Toggle Buttons
                    ['active', 'ar', 'en'].forEach(type => {
                        const btn = document.getElementById('btn-'+b+'-'+type);
                        const state = d.configs[b][type];
                        btn.className = state ? "toggle-btn active" : "toggle-btn";
                        document.getElementById('st-'+b+'-'+type).innerText = state ? "ON" : "OFF";
                    });
                });

                document.getElementById('logs').innerHTML = d.logs.map(l => '<div class="log-msg">'+l+'</div>').join('');
            }
            setInterval(updateUI, 1500);
        </script>
    </body>
    </html>
    `);
});

app.listen(process.env.PORT || 2000);
