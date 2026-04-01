# 部署檢查清單 - 修復 LINE Webhook 404 錯誤

## 當前狀況

❌ LINE Developer Console 顯示: **404 Not Found**

這表示您的生產環境伺服器:
- 可能尚未部署最新程式碼
- 或伺服器未正確啟動
- 或 Webhook URL 設定錯誤

## 需要確認的資訊

請提供以下資訊以協助診斷:

### 1. 部署平台
您的 LINE Bot 部署在哪個平台?
- [ ] Zeabur
- [ ] Heroku
- [ ] Vercel
- [ ] Railway
- [ ] Render
- [ ] 其他: __________

### 2. 部署網域
您的完整網域是什麼?
```
例如: vun.zeabur.app
或: your-app.herokuapp.com
```
您的網域: __________

### 3. 部署狀態
- [ ] 我已經將 `deploy/` 目錄的檔案上傳到伺服器
- [ ] 我還沒有部署最新的程式碼
- [ ] 我不確定

### 4. LINE Webhook URL 設定
您在 LINE Developer Console 中設定的 Webhook URL 是:
```
https://________/callback
```

## 快速診斷步驟

### 步驟 1: 測試伺服器是否運行

在瀏覽器開啟:
```
https://你的網域/test
```

**預期結果:**
```
✅ 機器人伺服器目前運行中!請將 Webhook URL 設為: https://你的網域/callback
```

**如果看到錯誤:**
- 404 → 伺服器未運行或路由錯誤
- 502/503 → 伺服器啟動失敗
- 無法連線 → 網域錯誤或伺服器離線

### 步驟 2: 檢查部署平台日誌

登入您的部署平台 Dashboard,查看日誌應該顯示:
```
🚀 萬能招生 Bot 已啟動於 Port: 8080
```

### 步驟 3: 確認程式碼版本

檢查部署的 `server.js` 是否包含以下內容:
```javascript
app.post('/callback', line.middleware(config), (req, res) => {
```

**如果是舊版,會顯示:**
```javascript
app.post('/webhook', line.middleware(config), (req, res) => {
```

## 常見問題與解決方案

### Q1: 我該如何部署最新程式碼?

**Zeabur:**
1. 登入 Zeabur Dashboard
2. 選擇您的專案
3. 上傳 `deploy/` 目錄的所有檔案
4. 等待自動部署完成

**Heroku:**
```bash
cd /Users/mac/代碼程式/招生處/deploy
git init
git add .
git commit -m "Update to latest version with /callback route"
git push heroku main
```

**手動上傳:**
1. 將 `deploy/` 目錄打包成 zip
2. 上傳到您的伺服器
3. 解壓縮並執行 `npm install`
4. 執行 `npm start`

### Q2: 部署後仍然 404?

檢查:
1. 環境變數是否正確設定 (LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET)
2. Port 是否正確 (通常平台會自動設定)
3. 伺服器日誌是否有錯誤訊息

### Q3: 如何確認使用正確的路由?

在部署平台的檔案管理中查看 `server.js`,確認第 22 行左右是:
```javascript
app.post('/callback', ...
```

而不是:
```javascript
app.post('/webhook', ...
```

## 下一步

請提供上述資訊,我將協助您:
1. 測試您的伺服器狀態
2. 確認程式碼版本
3. 提供具體的部署指令
4. 驗證 Webhook 設定
