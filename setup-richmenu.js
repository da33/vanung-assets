// 萬能招生 LINE Rich Menu 建立／上傳／設為預設（v2 夜航航空風）
// 用法：先跑 `node generate-menu.js` 產生 richmenu-v2.jpg，再跑 `node setup-richmenu.js`
const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new line.Client({
    channelAccessToken: (process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim()
});

const IMAGE_PATH = path.join(__dirname, 'richmenu-v2.jpg');

const richMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "萬能招生選單 v2",
    chatBarText: "招生選單",
    areas: [
        {   // 左上：招生簡章
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: "postback", data: "簡章", displayText: "📋 查看招生簡章" }
        },
        {   // 中上：獎學金
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: "postback", data: "獎", displayText: "💰 獎學金資訊" }
        },
        {   // 右上：真人諮詢（取代原 AI客服）→ 觸發 server.js 的專員諮詢 Flex
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: "postback", data: "諮詢", displayText: "☎ 真人諮詢" }
        },
        {   // 左下：系所介紹
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: "postback", data: "系所", displayText: "🏫 系所介紹" }
        },
        {   // 中下：入學管道
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: "postback", data: "入學管道", displayText: "🎓 入學管道" }
        },
        {   // 右下：校園導覽（Google Maps）
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: "uri", uri: "https://www.google.com/maps/search/?api=1&query=萬能科技大學", label: "📍 校園導覽" }
        }
    ]
};

async function setup() {
    try {
        if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) throw new Error('缺少 LINE_CHANNEL_ACCESS_TOKEN');
        if (!fs.existsSync(IMAGE_PATH)) throw new Error(`找不到選單圖 ${IMAGE_PATH}，請先執行 node generate-menu.js`);

        // 0) 清掉舊選單，避免累積
        const existing = await client.getRichMenuList();
        if (existing.length) {
            console.log(`🧹 清除 ${existing.length} 個舊選單...`);
            for (const m of existing) {
                await client.deleteRichMenu(m.richMenuId);
                console.log(`   刪除 ${m.richMenuId} (${m.name})`);
            }
        }

        // 1) 建立新選單
        console.log('🚀 建立 Rich Menu...');
        const richMenuId = await client.createRichMenu(richMenu);
        console.log(`✅ 已建立: ${richMenuId}`);

        // 2) 上傳圖片
        const buf = fs.readFileSync(IMAGE_PATH);
        console.log(`🖼️  上傳選單圖 (${(buf.length / 1024).toFixed(0)}KB)...`);
        await client.setRichMenuImage(richMenuId, buf, 'image/jpeg');
        console.log('✅ 圖片已上傳');

        // 3) 設為預設選單
        await client.setDefaultRichMenu(richMenuId);
        console.log('✅ 已設為預設選單');

        console.log(`\n✨ 完成！Rich Menu ID: ${richMenuId}`);
    } catch (err) {
        console.error('❌ 錯誤:', err.message);
        if (err.originalError) {
            console.error(JSON.stringify(err.originalError.response?.data, null, 2));
        }
        process.exitCode = 1;
    }
}

setup();
