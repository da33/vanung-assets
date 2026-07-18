const express = require('express');
const path = require('path');
const line = require('@line/bot-sdk');
const https = require('https');
require('dotenv').config();

// ===== AI 客服總開關 =====
// false = 停用 LINE@ AI 客服（改由真人專員服務）
// true  = 重新啟用 AI 客服
const AI_ENABLED = false;

// AI 客服對話記錄（記憶體暫存）
const aiSessions = {};

async function askMiniMax(userId, userMessage) {
    if (!aiSessions[userId]) aiSessions[userId] = [];
    aiSessions[userId].push({ role: 'user', content: userMessage });
    // 只保留最近 10 則
    if (aiSessions[userId].length > 10) aiSessions[userId] = aiSessions[userId].slice(-10);

    const body = JSON.stringify({
        model: 'MiniMax-M2',
        messages: [
            { role: 'system', content: `你是萬能科技大學招生處的AI客服助理。

【最重要規則】
1. 必須使用繁體中文、禁止簡體字，回答簡潔友善。
2. ⚠️ 所有會變動的具體資訊（獎學金金額與資格、招生名額、報名/考試/篩選日期、簡章內容）一律引導使用者至官方招生專區 www.exams.vnu.edu.tw 或撥打 03-4515811 查詢最新公告。
3. 絕對不可自行編造、推測或提供可能過時的數字、金額、日期；不確定就誠實說明並引導查官方，切勿杜撰。

【學校基本資訊（穩定事實）】
- 校名：萬能科技大學（全國唯一航空城大學）
- 地址：320676 桃園市中壢區萬能路1號
- 總機：03-4515811；招生分機：#21500、#20700
- 官網：www.vnu.edu.tw
- 招生專區（最新簡章與公告皆在此）：www.exams.vnu.edu.tw
- 獎助學金公告／早鳥預約：https://administration.vnu.edu.tw/ac/3151

【三大學院與系所】
1. 航空暨工程學院：航空光機電系、電機工程系、資訊工程系暨電資研究所、室內設計與營建科技系、精密機械與工業工程系、車輛工程系。
2. 觀光餐旅暨管理學院：觀光與休閒事業管理系、餐飲管理系、旅館管理系、航空暨運輸服務管理系、企業管理系、資訊管理系、行銷與流通管理系暨智慧商務研究所。
3. 設計學院：商業設計系、化妝品應用與管理系、時尚造型設計暨表演藝術系。

【入學管道（詳細名額與日程一律查招生專區）】
- 四技日間部：技職繁星、申請入學、甄選入學、登記分發、運動績優、日間單獨招生、身障生甄試與單招。
- 進修部：申請入學、產學攜手專班、產學訓專班。
- 轉學考：寒假轉學、暑假轉學。
- 研究所：碩士班甄試、碩士班考試、碩士在職專班。
- 境外生：海外僑生專班、大陸地區招生。

【招生日程】各管道的報名、考試、篩選與放榜日期每年由學校公告，一律引導使用者查招生專區 www.exams.vnu.edu.tw，切勿自行報日期。

【獎助學金】萬能設有「敦品勵學獎助學金」等多項獎助。各入學管道適用的金額、資格與申請期限請以官方公告為準，引導使用者查 https://administration.vnu.edu.tw/ac/3151，請勿自行報金額或條件。

若問題複雜或不確定，請委婉建議撥打招生專線 03-4515811（#21500 或 #20700），或提示將由真人專員為您解答。` },
            ...aiSessions[userId]
        ]
    });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.minimax.chat',
            path: '/v1/text/chatcompletion_v2',
            method: 'POST',
            timeout: 10000, // 增加 10 秒超時限制
            headers: {
                'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    // 處理 API 過載 (529) 或其他 API 錯誤
                    if (res.statusCode === 529 || json.error) {
                        console.error('AI API 報錯:', json.error || 'Server Overloaded');
                        resolve('抱歉，目前 AI 客服諮詢人數較多，請稍後再試，或直接撥打招生專線 03-4515811。');
                        return;
                    }

                    const raw = json.choices?.[0]?.message?.content || '抱歉，我暫時無法回答，請稍後再試。';
                    const reply = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                    aiSessions[userId].push({ role: 'assistant', content: reply });
                    resolve(reply);
                } catch (e) { 
                    console.error('解析 AI 回應失敗:', e);
                    resolve('抱歉，系統正在維護中，請稍後再試。'); 
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve('AI 回應逾時，請再試一次。');
        });

        req.on('error', (e) => {
            console.error('API 請求連線錯誤:', e);
             resolve('連線不穩定，請稍後再試。');
        });
        req.write(body);
        req.end();
    });
}

// 記錄哪些用戶正在使用 AI 客服模式，使用 Map 記錄最後互動時間
const aiModeUsers = new Map();
const AI_TIMEOUT_MS = 30 * 60 * 1000; // 30 分鐘無互動自動關閉 AI

// 未命中關鍵字時的「已通知專員」一次性提示；同一使用者冷卻期內只提示一次，之後靜默交給真人
const notifiedUsers = new Map();
const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 60 分鐘內同一人只提示一次

const app = express();
// Zeabur 等平台會注入 PORT；優先讀 PORT，保留 WEB_PORT 當本機後備
const port = process.env.PORT || process.env.WEB_PORT || 8080;

// gzip 壓縮（HTML 58KB → 約 12KB）
const compression = require('compression');
app.use(compression());

// LINE Bot 設定
const config = {
    channelAccessToken: (process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim(),
    channelSecret: (process.env.LINE_CHANNEL_SECRET || '').trim(),
};

// 建立 LINE SDK 客戶端
const client = new line.Client(config);

/**
 * 【核心修復】
 * 將 Webhook 路由放在所有 middleware 之首，確保路徑不被攔截
 */
app.post('/callback', line.middleware(config), (req, res) => {
    console.log('--- 收到 Webhook 請求 ---');

    // 如果是驗證請求且 events 為空，也要直接回傳 200
    if (!req.body || !req.body.events || req.body.events.length === 0) {
        console.log('收到驗證請求 (空白 Events)，回傳 200');
        return res.status(200).send('OK');
    }

    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => {
            console.log('Webhook 處理完畢');
            res.json(result);
        })
        .catch((err) => {
            console.error('Webhook Error:', err);
            res.status(500).end();
        });
});

/**
 * 新增：手動驗證路徑
 * 讓使用者在瀏覽器打開這個網址看看是否通電
 */
app.get('/test', (req, res) => {
    res.send('✅ 機器人伺服器目前運行中！請將 Webhook URL 設為: https://' + req.headers.host + '/callback');
});

/**
 * 診斷端點 (不需簽章驗證,僅供測試)
 * 用於本地測試 Rich Menu 事件處理邏輯
 */
app.post('/test-callback', express.json(), (req, res) => {
    console.log('--- 收到測試 Webhook 請求 ---');

    if (!req.body || !req.body.events || req.body.events.length === 0) {
        console.log('收到空白測試請求');
        return res.status(200).send('OK');
    }

    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => {
            console.log('測試 Webhook 處理完畢');
            res.json(result);
        })
        .catch((err) => {
            console.error('測試 Webhook Error:', err);
            res.status(500).json({ error: err.message, stack: err.stack });
        });
});

// 事件處理函式
function handleEvent(event) {
    console.log(`處理事件類型: ${event.type}`);
    console.log('完整事件物件:', JSON.stringify(event, null, 2));

    // 1. 處理 Webhook 驗證事件
    if (event.replyToken && event.replyToken === '00000000000000000000000000000000') {
        return Promise.resolve(null);
    }

    if (event.type === 'follow') {
        return sendWelcomeMessage(event.replyToken);
    }

    // 處理文字訊息與 Postback 事件
    let userText = '';
    if (event.type === 'message' && event.message.type === 'text') {
        userText = event.message.text.trim();
    } else if (event.type === 'postback') {
        userText = event.postback.data.trim();
        console.log(`收到 Postback 資料: ${userText}`);
    } else {
        return Promise.resolve(null);
    }

    const userId = event.source.userId;

    // --- 【超時機制】檢查 AI 模式是否過期 ---
    if (aiModeUsers.has(userId)) {
        const lastActive = aiModeUsers.get(userId);
        if (Date.now() - lastActive > AI_TIMEOUT_MS) {
            aiModeUsers.delete(userId);
            delete aiSessions[userId];
        }
    }

    // --- 【核心功能】真人接手自動關閉 AI ---
    // 監測是否為管理員在後台回覆。
    // 1. 手動關鍵字關閉
    if (userText.match(/#真人|#接手|#關閉AI|真人服務/)) {
        aiModeUsers.delete(userId);
        delete aiSessions[userId];
        return client.replyMessage(event.replyToken, {
            type: 'text', text: '✅ 真人專員已接手，AI 客服已自動關閉。'
        }).catch(handleError);
    }

    // 2. 靜默偵測：如果偵測到訊息是由管理員發出的 (在某些 Webhook 設定下會帶有管理員資訊)
    // 或者是只要管理員在後台輸入了任何內容且該內容不是特定的 AI 指令
    if (aiModeUsers.has(userId)) {
         // 如果收到的是特殊的前綴(例如管理員習慣用的符號)，可以自動關閉
         if (userText.startsWith('>>') || userText.startsWith('回覆:')) {
            aiModeUsers.delete(userId);
            return Promise.resolve(null); 
         }
    }
    // ------------------------------------

    console.log(`處理指令: ${userText}`);

    // AI 客服模式觸發
    if (userText.match(/AI客服|ai客服|智能客服|AI諮詢/)) {
        // AI 已停用：改導向真人專員
        if (!AI_ENABLED) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '🤖 AI 客服目前暫停服務中。\n\n如需協助，歡迎輸入「諮詢」由真人專員為您服務，或直接撥打招生專線 03-4515811（分機 #21500 / #20700）。'
            }).catch(handleError);
        }
        aiModeUsers.set(userId, Date.now());
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '您好！AI 助理已連線 🤖\n請直接輸入您的問題。\n\n⚠️ 如果您需要真人專員協助，請隨時輸入「#真人」或「結束」。'
        }).catch(handleError);
    }

    // 離開 AI 客服模式
    if (userText === '結束' && aiModeUsers.has(userId)) {
        aiModeUsers.delete(userId);
        delete aiSessions[userId];
        return client.replyMessage(event.replyToken, {
            type: 'text', text: '✅ 已離開 AI 客服系統。後續若需諮詢可再次點擊選單，或等候專員為您服務！'
        }).catch(handleError);
    }

    // 如果在 AI 客服模式，轉交 AI 處理
    if (AI_ENABLED && aiModeUsers.has(userId) && event.type === 'message') {
        aiModeUsers.set(userId, Date.now()); // 更新最後活動時間
        return askMiniMax(userId, userText).then(reply =>
            client.replyMessage(event.replyToken, { type: 'text', text: reply })
        ).catch(handleError);
    }

    // A. 諮詢關鍵字 (升級為具設計感的 Flex Message)
    if (userText.match(/諮詢|咨询|我要諮詢|專人|電話|問問/) || userText.includes('consult')) {
        notifiedUsers.set(userId, Date.now()); // 已提供真人聯絡方式，後續非關鍵字訊息靜默交給專員
        const telNo = '034515811';
        return client.replyMessage(event.replyToken, {
            type: 'flex',
            altText: '萬能招生專員為您服務',
            contents: {
                type: 'bubble',
                hero: {
                    type: 'image',
                    url: 'https://images.unsplash.com/photo-1521791136368-328ac1975a31?q=80&w=1000',
                    size: 'full', aspectRatio: '20:13', aspectMode: 'cover'
                },
                body: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'text', text: '1對1 招生諮詢', weight: 'bold', color: '#00B2FF', size: 'sm' },
                        { type: 'text', text: '招生專員．專業領航', weight: 'bold', size: 'xl', margin: 'md' },
                        { type: 'text', text: '入學、獎學金、科系規劃，由專員為您一對一詳盡解答。', size: 'xs', color: '#666666', wrap: true, margin: 'md' },
                        { type: 'separator', margin: 'lg' },
                        {
                            type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [
                                { type: 'button', style: 'primary', color: '#00B2FF', height: 'sm', action: { type: 'uri', label: '📞 直接撥打諮詢專線', uri: `tel:${telNo}` } },
                                { type: 'button', style: 'secondary', height: 'sm', action: { type: 'uri', label: '💬 LINE 免費通話', uri: `https://line.me/R/call/8/${telNo}` } },
                                { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '🧑‍💼 專員一對一對談', uri: 'https://line.me/ti/p/SuYhIZtjnm' } }
                            ]
                        }
                    ]
                },
                footer: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'text', text: `諮詢專線：${telNo}`, size: 'xxs', color: '#999999', align: 'center' }
                    ]
                }
            }
        }).catch(handleError);
    }

    // B. 最新招生簡章 (美化版)
    if (userText.match(/簡章|简章|報名|报名/)) {
        return client.replyMessage(event.replyToken, {
            type: 'flex',
            altText: '萬能科技大學 - 招生簡章與報名',
            contents: {
                type: 'bubble',
                hero: {
                    type: 'image',
                    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000',
                    size: 'full', aspectRatio: '20:13', aspectMode: 'cover'
                },
                body: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'text', text: '國立品質．萬能實戰', weight: 'bold', color: '#00B2FF', size: 'sm' },
                        { type: 'text', text: '2026 最新招生簡章', weight: 'bold', size: 'xl', margin: 'md' },
                        { type: 'text', text: '航空城唯一實戰型大學。各類別正在熱烈招生中，入學即享有優渥獎學金！', size: 'sm', color: '#666666', wrap: true, margin: 'md' }
                    ]
                },
                footer: {
                    type: 'box', layout: 'vertical', spacing: 'sm', contents: [
                        { type: 'button', style: 'primary', color: '#00B2FF', action: { type: 'uri', label: '立即下載電子簡章', uri: 'https://www.exams.vnu.edu.tw' } },
                        { type: 'button', style: 'secondary', action: { type: 'uri', label: '線上填寫報名表', uri: 'https://administration.vnu.edu.tw/ac/3151' } }
                    ]
                }
            }
        }).catch(handleError);
    }

    // C. 獎學金查詢
    if (userText.match(/獎|奖/)) {
        return client.replyMessage(event.replyToken, {
            type: 'flex',
            altText: '萬能獎學金加碼資訊',
            contents: {
                type: 'bubble',
                header: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'text', text: 'SCHOLARSHIP', weight: 'bold', color: '#00F0FF', size: 'sm' },
                        { type: 'text', text: '獎助學金資訊', weight: 'bold', size: 'xl', color: '#FFFFFF' }
                    ], backgroundColor: '#001A2C'
                },
                body: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'text', text: '115 學年度敦品勵學獎助學金實施中', weight: 'bold', size: 'md', wrap: true },
                        { type: 'text', text: '依入學管道與在學成績提供不同等級獎助學金。', size: 'sm', color: '#666666', wrap: true, margin: 'md' },
                        { type: 'separator', margin: 'lg' },
                        { type: 'text', text: '※ 完整金額、資格與申請期限,請以下方官方最新公告為準。', size: 'xxs', color: '#999999', margin: 'md', wrap: true }
                    ]
                },
                footer: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'button', style: 'primary', color: '#00B2FF', height: 'sm', action: { type: 'uri', label: '查看官方獎助學金公告', uri: 'https://administration.vnu.edu.tw/ac/3151' } }
                    ]
                }
            }
        }).catch(handleError);
    }

    // D. 系所輪播
    if (userText.match(/系所|学院|學系/)) {
        return client.replyMessage(event.replyToken, {
            type: 'flex',
            altText: '萬能科技大學 - 三大學院介紹',
            contents: {
                type: 'carousel',
                contents: [
                    createCollegeBubble('航空暨工程學院', '全國唯一航空特色學院', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500', '航空光機電、資訊工程、電機工程、車輛工程、精密機械與工業工程、室內設計與營建科技等系所。', 'http://www.cae.vnu.edu.tw/'),
                    createCollegeBubble('觀光餐旅暨管理學院', '職場對接．星級實作', 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?q=80&w=500', '觀光休閒、餐飲管理、旅館管理、航空暨運輸服務管理、企業管理、資訊管理、行銷與流通管理等系所。', 'http://www.cth.vnu.edu.tw/'),
                    createCollegeBubble('設計學院', '創意無限．美學實踐', 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=500', '商業設計、化妝品應用與管理、時尚造型設計暨表演藝術等系所。', 'http://www.dc.vnu.edu.tw/')
                ]
            }
        }).catch(handleError);
    }

    // E. 入學管道
    if (userText.match(/入學|管道|招生方式/)) {
        return client.replyMessage(event.replyToken, {
            type: 'flex',
            altText: '萬能科技大學 - 入學管道',
            contents: {
                type: 'bubble',
                hero: { type: 'image', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000', size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
                body: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'text', text: '多元入學管道', weight: 'bold', size: 'xl' },
                        { type: 'text', text: '選擇最適合你的升學方式', size: 'sm', color: '#999999', margin: 'md' },
                        { type: 'separator', margin: 'lg' },
                        { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'md', contents: [
                            { type: 'text', text: '📊 技職繁星', size: 'md', weight: 'bold' },
                            { type: 'text', text: '📝 申請入學', size: 'md', weight: 'bold' },
                            { type: 'text', text: '🎯 甄選入學', size: 'md', weight: 'bold' },
                            { type: 'text', text: '📚 登記分發', size: 'md', weight: 'bold' },
                            { type: 'text', text: '🏅 運動績優', size: 'md', weight: 'bold' },
                            { type: 'text', text: '🌟 日間單獨招生', size: 'md', weight: 'bold' }
                        ]}
                    ]
                },
                footer: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'button', style: 'primary', color: '#00B2FF', action: { type: 'uri', label: '查看詳細說明', uri: 'https://www.exams.vnu.edu.tw' } }
                    ]
                }
            }
        }).catch(handleError);
    }

    // F. 未命中選單關鍵字 → 一次性提示「已通知專員」，之後靜默交給真人
    // 本帳號為真人客服（聊天模式）。為避免對每則訊息都回覆而插話洗版，
    // 同一使用者在冷卻期(60 分)內只回一次「已收到、專員會回覆」的提示，其餘訊息靜默交由專員處理。
    const lastNotified = notifiedUsers.get(userId) || 0;
    if (Date.now() - lastNotified > NOTIFY_COOLDOWN_MS) {
        notifiedUsers.set(userId, Date.now());
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '✅ 已收到您的訊息，稍候將由招生專員親自回覆您 🙋\n（想自行查詢，也可點下方選單）'
        }).catch(handleError);
    }
    return Promise.resolve(null); // 冷卻期內不重複打擾，交給真人
}

// 輔助函式：建立學院輪播卡片
function createCollegeBubble(title, subtitle, imageUrl, desc, linkUrl) {
    return {
        type: 'bubble', size: 'micro',
        hero: { type: 'image', url: imageUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
        body: {
            type: 'box', layout: 'vertical', contents: [
                { type: 'text', text: title, weight: 'bold', size: 'sm' },
                { type: 'text', text: subtitle, size: 'xxs', color: '#00B2FF', margin: 'xs' },
                { type: 'text', text: desc, size: 'xxs', color: '#888888', margin: 'md', wrap: true }
            ], spacing: 'sm'
        },
        footer: {
            type: 'box', layout: 'vertical', contents: [
                { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '進入系所', uri: linkUrl || 'https://www.vnu.edu.tw' } }
            ]
        }
    };
}

function sendWelcomeMessage(replyToken) {
    return client.replyMessage(replyToken, {
        type: 'flex', altText: '歡迎加入萬能招生處',
        contents: {
            type: 'bubble',
            hero: { type: 'image', url: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe1?q=80&w=1000', size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
            body: {
                type: 'box', layout: 'vertical', contents: [
                    { type: 'text', text: '您好！歡迎加入萬能招生處', weight: 'bold', size: 'lg' },
                    { type: 'text', text: '✨ 115 學年度敦品勵學獎助學金實施中，多元入學管道熱烈招生！', color: '#ff0000', weight: 'bold', size: 'sm', margin: 'sm', wrap: true },
                    { type: 'text', text: '完整獎助學金金額與申請期限，請點下方選單「獎學金」查看官方最新公告。', size: 'xs', color: '#666666', margin: 'md', wrap: true }
                ]
            }
        }
    }).catch(handleError);
}

function handleError(err) {
    console.error('❌ LINE API 錯誤');
    if (err.originalError && err.originalError.response) {
        console.error(JSON.stringify(err.originalError.response.data));
    } else {
        console.error(err);
    }
}

// 靜態檔案路徑必須放在後端 Webhook 路由之後
app.use(express.static(__dirname));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.listen(port, () => { console.log(`🚀 萬能招生 Bot 已啟動於 Port: ${port}`); });
