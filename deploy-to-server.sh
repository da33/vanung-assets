#!/bin/bash
# 部署到騰訊雲伺服器

SERVER_IP="129.226.94.144"
SERVER_USER="ubuntu"

echo "📦 準備部署檔案..."

# 建立部署壓縮檔
tar -czf deploy.tar.gz \
  server.js \
  package.json \
  package-lock.json \
  .env \
  --exclude=node_modules

echo "📤 上傳到伺服器..."
scp deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:~/

echo "🚀 在伺服器上安裝並啟動..."
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
  # 解壓縮
  tar -xzf deploy.tar.gz

  # 安裝 Node.js 20 (如果沒有)
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # 安裝依賴
  npm install

  # 停止舊的服務
  pm2 stop line-bot 2>/dev/null || true

  # 啟動服務
  pm2 start server.js --name line-bot
  pm2 save

  echo "✅ 部署完成！"
EOF

rm deploy.tar.gz
echo "🎉 完成！"
