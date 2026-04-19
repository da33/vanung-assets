const express = require('express');
const path = require('path');
const line = require('@line/bot-sdk');
const https = require('https');
require('dotenv').config();

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
【重要規則】必須使用繁體中文回答，禁止使用簡體中文。回答要簡潔友善，若用戶詢問特定入學管道，請主動提供招生專區的查詢網址。

【學校基本資訊】
- 校名：萬能科技大學（全國唯一航空城大學）
- 地址：320676 桃園市中壢區萬能路1號
- 總機：03-4515811
- 招生分機：#21500、#20700
- 官網：www.vnu.edu.tw
- 教務處招生專區：www.exams.vnu.edu.tw （所有最新簡章與公告皆可在此查詢）

【🔥 最新重要活動】
- 早鳥預約報名系統：https://administration.vnu.edu.tw/ac/3151 （請鼓勵有興趣的同學優先填表預約）

【學院與系所】
航空暨工程學院：航空光機電系、航服系、車輛工程系、電機工程系、精密機械與工業工程系(含所)、室內設計與營建科技系(含所)、資訊工程系(含所)、電資研究所。
觀光餐旅暨管理學院：觀光休閒系、餐飲管理系、旅館管理系、企業管理系(含所)、資訊管理系(含所)、行銷與流通管理系暨智慧商務研究所。
設計學院：商業設計系、化妝品應用與管理系(含所)、時尚造型設計暨表演藝術系。

【學制與入學管道一覽】
1. 四技日間部（高中職畢業適用）：
   - 管道：技職繁星、申請入學、甄選入學、登記分發、運動績優、日間單招、身障生甄試與單招。
2. 四技與二技進修部（適合邊讀邊工作）：
   - 管道：申請入學、產學攜手專班、產學訓專班。
3. 轉學考：提供寒假轉學與暑假轉學機制。
4. 研究所：碩士班甄試（11-12月）、碩士班考試（3-5月）、碩士在職專班。
5. 境外生：海外僑生專班（含產攜僑生專班）、大陸地區招生專區（陸生轉學、學士班）。

※ 若用戶想了解任一入學管道的「簡章、名額、重要日程」，請引導至招生專區：www.exams.vnu.edu.tw

【115學年度重要日程】
- 申請入學第一階段篩選結果：2026/03/31 公告
- 研究所碩士班考試報名：2026/03/23～2026/05/14
- 研究所碩士在職專班：展延報名中
- 運動績優單招：2026/02/23 開放報名

【115學年度 敦品勵學獎助學金方案 (115/06/30前預約享有)】
- 繁星計畫：20,000元
- 申請入學：學測10級分以上10,000元，9級分以下3,000元
- 甄選入學：10,000元
- 聯合登記、單招、身障生(甄試/單招)、產學訓專班、四技進修部：皆為 3,000元
- 運動績優：
  * 電競隊(資工系) / 籃球隊(觀休系)：10,000元 + 競賽選手生活費每月最高1萬 (籃球隊再享住宿費全免)
  * 其他體育專長 / 進修部棒球隊：最高可獲 20,000元 + 選手住宿費全免
- 國際競賽培訓選手：
  * 全國技藝競賽金手獎 / 分區賽前五名：20,000元 + 生活費每月最高1萬元
  * 全國技藝競賽優勝 / 分區賽佳作：10,000元 + 生活費每月最高1萬元
※ 以上獎學金皆可與政府每年固定的 35,000 元學費補助同時生效。各獎項擇一申請。
※ 強烈建議引導有興趣的使用者於 115/06/30 前趕快填寫預約表單：https://administration.vnu.edu.tw/ac/3151

【特色與優勢】
- 航空城唯一實戰大學。
- 擁有新加坡樟宜機場海外實習機會（航服系）。
- 全國私科大技能競賽第一，並曾奪得亞洲技能競賽金牌與大專盃電競冠軍。

若問題過於複雜或不確定，請委婉建議用戶撥打招生專線 03-4515811（#21500 或 #20700），或是提示後續將由真人專員為您解答。` },
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

const app = express();
const port = process.env.WEB_PORT || 8080;

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
    if (aiModeUsers.has(userId) && event.type === 'message') {
        aiModeUsers.set(userId, Date.now()); // 更新最後活動時間
        return askMiniMax(userId, userText).then(reply =>
            client.replyMessage(event.replyToken, { type: 'text', text: reply })
        ).catch(handleError);
    }

    // A. 諮詢關鍵字 (升級為具設計感的 Flex Message)
    if (userText.match(/諮詢|咨询|我要諮詢|專人|電話|問問/) || userText.includes('consult')) {
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
                        { type: 'button', style: 'primary', color: '#00B2FF', action: { type: 'uri', label: '立即下載電子簡章', uri: 'https://www.vnu.edu.tw/joinus' } },
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
                        { type: 'text', text: '獎學金全面加碼', weight: 'bold', size: 'xl', color: '#FFFFFF' }
                    ], backgroundColor: '#001A2C'
                },
                body: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '政府補助', size: 'sm', color: '#555555', flex: 2 }, { type: 'text', text: '$35,000 / 年', size: 'sm', weight: 'bold', align: 'end', flex: 3 }] },
                        { type: 'box', layout: 'horizontal', margin: 'md', contents: [{ type: 'text', text: '萬能加碼', size: 'sm', color: '#555555', flex: 2 }, { type: 'text', text: '最高 $50,000', size: 'sm', weight: 'bold', color: '#E02020', align: 'end', flex: 3 }] },
                        { type: 'box', layout: 'horizontal', margin: 'md', contents: [{ type: 'text', text: '證照獎金', size: 'sm', color: '#555555', flex: 2 }, { type: 'text', text: '依等級累加', size: 'sm', weight: 'bold', align: 'end', flex: 3 }] },
                        { type: 'separator', margin: 'lg' },
                        { type: 'text', text: '* 詳情依當年度招生簡章為準', size: 'xxs', color: '#999999', margin: 'md', style: 'italic' }
                    ]
                },
                footer: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '查看詳細對照表', uri: 'https://administration.vnu.edu.tw/ac/3151' } }
                    ]
                }
            }
        }).catch(handleError);
    }

    // D. 系所輪播
    if (userText.match(/系所|学院|學系/)) {
        return client.replyMessage(event.replyToken, {
            type: 'flex',
            altText: '萬能科技大學 - 四大學院介紹',
            contents: {
                type: 'carousel',
                contents: [
                    createCollegeBubble('航空學院', '全國唯一航空特色學院', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500', '設有機電、航維、應外等專業特色系所。', 'http://www.cae.vnu.edu.tw/'),
                    createCollegeBubble('觀光餐旅學院', '職場對接．星級實作', 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?q=80&w=500', '榮獲多項餐飲金牌，業界實習機會最豐富。', 'http://www.cth.vnu.edu.tw/'),
                    createCollegeBubble('設計學院', '創意無限．美學實踐', 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=500', '室設、商設、化妝品應用，培育設計頂尖人才。', 'http://www.dc.vnu.edu.tw/'),
                    createCollegeBubble('資訊工程學院', 'AI 引領．數位轉型', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=500', '資工、資管，對接智慧產業，就業即刻起航。', 'http://www.csie.vnu.edu.tw/')
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
                            { type: 'text', text: '📝 個人申請', size: 'md', weight: 'bold' },
                            { type: 'text', text: '📊 繁星推薦', size: 'md', weight: 'bold' },
                            { type: 'text', text: '🎯 技優甄審', size: 'md', weight: 'bold' },
                            { type: 'text', text: '📚 統測分發', size: 'md', weight: 'bold' },
                            { type: 'text', text: '🌟 獨立招生', size: 'md', weight: 'bold' }
                        ]}
                    ]
                },
                footer: {
                    type: 'box', layout: 'vertical', contents: [
                        { type: 'button', style: 'primary', color: '#00B2FF', action: { type: 'uri', label: '查看詳細說明', uri: 'https://www.vnu.edu.tw/joinus' } }
                    ]
                }
            }
        }).catch(handleError);
    }

    // F. 預設回覆
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `您好！歡迎瀏覽萬能招生處。我可以為您提供簡章、獎學金以及系所資訊。請點擊選單或輸入關鍵字與我互動！`
    }).catch(handleError);
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
                    { type: 'text', text: '✨【115學年度 敦品勵學獎助學金】熱烈報名中！最高可獲 20,000元獎金+住宿免費等多項補助。', color: '#ff0000', weight: 'bold', size: 'sm', margin: 'sm', wrap: true },
                    { type: 'text', text: '即日起至 115/06/30 前填表預約報名即可享有，請點擊下方選單了解詳情！', size: 'xs', color: '#666666', margin: 'md', wrap: true }
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
