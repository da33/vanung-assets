#!/bin/bash
# 快速修復 LINE Webhook SSL 問題

echo "🔧 啟動本地伺服器並建立 Ngrok 隧道..."
echo ""
echo "步驟："
echo "1. 安裝 ngrok: brew install ngrok"
echo "2. 執行: ngrok http 8080"
echo "3. 複製 https 網址（例如: https://xxxx.ngrok.io）"
echo "4. 在 LINE Console 設定 Webhook URL: https://xxxx.ngrok.io/callback"
echo ""
echo "或者使用 Zeabur 的自訂網域功能綁定你自己的網域"
