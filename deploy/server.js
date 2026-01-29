const express = require('express');
const path = require('path');
const line = require('@line/bot-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

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
        // 如果選單是發送 postback data，我們將其視為指令
        userText = event.postback.data.trim();
        console.log(`收到 Postback 資料: ${userText}`);
    } else {
        // 其他不處理的事件
        return Promise.resolve(null);
    }

    console.log(`處理指令: ${userText}`);

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
                                { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '📍 開啟地圖導航', uri: 'https://www.google.com/maps?q=萬能科技大學招生處' } }
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
                        { type: 'button', style: 'primary', color: '#00B2FF', action: { type: 'uri', label: '立即下載電子簡章', uri: 'https://administration.vnu.edu.tw/ac/2433' } },
                        { type: 'button', style: 'secondary', action: { type: 'uri', label: '線上填寫報名表', uri: 'https://administration.vnu.edu.tw/ac/2433' } }
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
                        { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '查看詳細對照表', uri: 'https://administration.vnu.edu.tw/ac/2433' } }
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
                    createCollegeBubble('航空學院', '全國唯一航空特色學院', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500', '設有機電、航維、應外等專業特色系所。'),
                    createCollegeBubble('觀光餐旅學院', '職場對接．星級實作', 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?q=80&w=500', '榮獲多項餐飲金牌，業界實習機會最豐富。'),
                    createCollegeBubble('設計學院', '創意無限．美學實踐', 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=500', '室設、商設、化妝品應用，培育設計頂尖人才。'),
                    createCollegeBubble('資訊工程學院', 'AI 引領．數位轉型', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=500', '資工、資管，對接智慧產業，就業即刻起航。')
                ]
            }
        }).catch(handleError);
    }

    // E. 預設回覆
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `您好！歡迎瀏覽萬能招生處。我可以為您提供簡章、獎學金以及系所資訊。請點擊選單或輸入關鍵字與我互動！`
    }).catch(handleError);
}

// 輔助函式：建立學院輪播卡片
function createCollegeBubble(title, subtitle, imageUrl, desc) {
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
                { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '進入系所', uri: 'https://www.vnu.edu.tw' } }
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
                    { type: 'text', text: '獲取最新招生與獎學金資訊，請點擊下方選單。', size: 'sm', margin: 'sm' }
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
