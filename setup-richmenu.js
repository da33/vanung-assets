const line = require('@line/bot-sdk');
require('dotenv').config();

const client = new line.Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN.trim()
});

const richMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "萬能招生選單",
    chatBarText: "選單",
    areas: [
        {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: "postback", data: "簡章", displayText: "查看招生簡章" }
        },
        {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: "postback", data: "諮詢", displayText: "諮詢專線" }
        },
        {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: "postback", data: "獎", displayText: "獎學金資訊" }
        },
        {
            bounds: { x: 0, y: 843, width: 2500, height: 843 },
            action: { type: "postback", data: "系所", displayText: "系所介紹" }
        }
    ]
};

async function setup() {
    try {
        console.log('🚀 建立 Rich Menu...');
        const richMenuId = await client.createRichMenu(richMenu);
        console.log(`✅ Rich Menu ID: ${richMenuId}`);
        console.log('\n下一步：');
        console.log('1. 在 LINE Developers Console 上傳選單圖片');
        console.log('2. 或使用以下指令設為預設選單：');
        console.log(`   node -e "require('@line/bot-sdk').Client({channelAccessToken:'${process.env.LINE_CHANNEL_ACCESS_TOKEN.trim()}'}).setDefaultRichMenu('${richMenuId}')"`);
    } catch (err) {
        console.error('❌ 錯誤:', err.message);
    }
}

setup();
