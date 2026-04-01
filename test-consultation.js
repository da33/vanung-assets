const axios = require('axios');

const BASE_URL = 'http://localhost:8080/test-callback';

// 測試諮詢功能
async function testConsultation() {
    console.log('\n=== 測試諮詢功能 ===\n');

    const testCases = [
        { text: '諮詢', description: '關鍵字: 諮詢' },
        { text: '我要諮詢', description: '關鍵字: 我要諮詢' },
        { text: '專人', description: '關鍵字: 專人' },
        { text: '電話', description: '關鍵字: 電話' },
        { text: 'consult', description: '英文: consult' }
    ];

    for (const testCase of testCases) {
        try {
            const event = {
                type: 'message',
                replyToken: 'test-reply-token',
                source: { userId: 'test-user-id' },
                message: { type: 'text', text: testCase.text }
            };

            console.log(`📝 測試: ${testCase.description}`);
            console.log(`   輸入: "${testCase.text}"`);

            const response = await axios.post(BASE_URL, {
                events: [event]
            });

            console.log(`   ✅ 狀態: ${response.status}`);
            console.log(`   回應: ${JSON.stringify(response.data, null, 2)}\n`);
        } catch (error) {
            console.error(`   ❌ 錯誤: ${error.message}\n`);
        }
    }
}

// 測試 Postback 諮詢
async function testPostbackConsultation() {
    console.log('\n=== 測試 Postback 諮詢 ===\n');

    try {
        const event = {
            type: 'postback',
            replyToken: 'test-reply-token',
            source: { userId: 'test-user-id' },
            postback: { data: '諮詢' }
        };

        console.log('📝 測試: Postback 諮詢');
        console.log(`   Data: "諮詢"`);

        const response = await axios.post(BASE_URL, {
            events: [event]
        });

        console.log(`   ✅ 狀態: ${response.status}`);
        console.log(`   回應: ${JSON.stringify(response.data, null, 2)}\n`);
    } catch (error) {
        console.error(`   ❌ 錯誤: ${error.message}\n`);
    }
}

// 執行所有測試
async function runAllTests() {
    console.log('🚀 開始測試諮詢功能...\n');
    console.log('⚠️  請確保伺服器已在 Port 8080 啟動\n');

    await testConsultation();
    await testPostbackConsultation();

    console.log('✅ 測試完成!');
}

runAllTests().catch(console.error);
