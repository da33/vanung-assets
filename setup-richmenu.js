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
            action: { type: "postback", data: "簡章", displayText: "📋 查看招生簡章" }
        },
        {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: "postback", data: "獎", displayText: "💰 獎學金資訊" }
        },
        {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: "postback", data: "AI客服", displayText: "🤖 AI客服" }
        },
        {
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: "postback", data: "系所", displayText: "🏫 系所介紹" }
        },
        {
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: "postback", data: "入學管道", displayText: "🎓 入學管道" }
        },
        {
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: "uri", uri: "https://www.google.com/maps/search/?api=1&query=萬能科技大學", label: "📍 校園導覽" }
        }
    ]
};

async function setup() {
    try {
        console.log('🚀 建立 Rich Menu...');
        const richMenuId = await client.createRichMenu(richMenu);
        console.log(`✅ Rich Menu 已建立: ${richMenuId}`);

        console.log('\n📝 設為預設選單...');
        await client.setDefaultRichMenu(richMenuId);
        console.log('✅ 已設為預設選單');

        console.log('\n✨ 完成！請在 LINE Developers Console 上傳選單圖片');
        console.log(`Rich Menu ID: ${richMenuId}`);
    } catch (err) {
        console.error('❌ 錯誤:', err.message);
        if (err.originalError) {
            console.error(JSON.stringify(err.originalError.response?.data, null, 2));
        }
    }
}

setup();
