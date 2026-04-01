const axios = require('axios');
require('dotenv').config();

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN.trim();

async function validateMessage(name, message) {
    try {
        const response = await axios.post('https://api.line.me/v2/bot/message/validate/reply', {
            messages: [message]
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ ${name} 是有效的!`);
    } catch (error) {
        console.error(`❌ ${name} 驗證失敗:`);
        if (error.response && error.response.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

async function run() {
    // A. 諮詢關鍵字
    const msgA = {
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
                            { type: 'button', style: 'primary', color: '#00B2FF', height: 'sm', action: { type: 'uri', label: '📞 直接撥打諮詢專線', uri: `tel:034515811` } },
                            { type: 'button', style: 'secondary', height: 'sm', action: { type: 'uri', label: '💬 LINE 免費通話', uri: `https://line.me/R/call/8/034515811` } },
                            { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '📍 開啟地圖導航', uri: 'https://www.google.com/maps?q=萬能科技大學招生處' } }
                        ]
                    }
                ]
            },
            footer: {
                type: 'box', layout: 'vertical', contents: [
                    { type: 'text', text: `諮詢專線：034515811`, size: 'xxs', color: '#999999', align: 'center' }
                ]
            }
        }
    };

    // B. 最新招生簡章
    const msgB = {
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
    };

    // C. 獎學金查詢
    const msgC = {
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
    };

    // D. 系所輪播
    const msgD = {
        type: 'flex',
        altText: '萬能科技大學 - 四大學院介紹',
        contents: {
            type: 'carousel',
            contents: [
                {
                    type: 'bubble', size: 'micro',
                    hero: { type: 'image', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500', size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
                    body: {
                        type: 'box', layout: 'vertical', contents: [
                            { type: 'text', text: '航空學院', weight: 'bold', size: 'sm' },
                            { type: 'text', text: '全國唯一航空特色學院', size: 'xxs', color: '#00B2FF', margin: 'xs' },
                            { type: 'text', text: '設有機電、航維、應外等專業特色系所。', size: 'xxs', color: '#888888', margin: 'md', wrap: true }
                        ], spacing: 'sm'
                    },
                    footer: {
                        type: 'box', layout: 'vertical', contents: [
                            { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: '進入系所', uri: 'https://www.vnu.edu.tw' } }
                        ]
                    }
                }
            ]
        }
    };

    await validateMessage("A. 諮詢關鍵字", msgA);
    await validateMessage("B. 最新招生簡章", msgB);
    await validateMessage("C. 獎學金查詢", msgC);
    await validateMessage("D. 系所輪播", msgD);
}

run();
