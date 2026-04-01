#!/usr/bin/env node
/**
 * Zeabur 部署診斷工具
 * 檢查當前部署狀態並提供修復建議
 */

const https = require('https');

const DOMAIN = 'vun.zeabur.app';

function checkEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: DOMAIN,
            path: path,
            method: path === '/callback' ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    path,
                    status: res.statusCode,
                    body: data.substring(0, 100)
                });
            });
        });

        req.on('error', (e) => {
            resolve({ path, status: 'ERROR', error: e.message });
        });

        if (path === '/callback') {
            req.write(JSON.stringify({ events: [] }));
        }
        req.end();
    });
}

async function diagnose() {
    console.log('🔍 開始診斷 Zeabur 部署狀態...\n');
    console.log(`網域: https://${DOMAIN}\n`);

    const endpoints = ['/', '/test', '/callback'];

    for (const endpoint of endpoints) {
        const result = await checkEndpoint(endpoint);
        const icon = result.status === 200 ? '✅' : '❌';
        console.log(`${icon} ${endpoint}`);
        console.log(`   狀態: ${result.status}`);
        if (result.body) {
            console.log(`   回應: ${result.body}`);
        }
        console.log('');
    }

    console.log('\n📋 診斷結果：');
    console.log('如果所有端點都是 404，表示：');
    console.log('1. Express 應用程式未正確啟動');
    console.log('2. 或部署的檔案結構有問題');
    console.log('3. 或 package.json 的 start 指令錯誤\n');
}

diagnose();
