# 部署指南 - 修復 LINE Webhook 404 錯誤

## 問題已修復

✅ `deploy/server.js` 已更新為最新版本
✅ 路由已從 `/webhook` 改為 `/callback`
✅ 已包含 postback 事件處理
✅ 環境變數已同步

## 部署步驟

### 方法一:使用 Zeabur (推薦)

1. **準備部署檔案**
   ```bash
   cd /Users/mac/代碼程式/招生處/deploy
   ```

2. **確認檔案完整**
   - ✅ `server.js` (最新版)
   - ✅ `package.json`
   - ✅ `index.html`
   - ✅ `.env` (包含 LINE 憑證)

3. **部署到 Zeabur**
   - 登入 Zeabur Dashboard
   - 選擇您的專案
   - 上傳 `deploy/` 目錄的所有檔案
   - 或使用 Git 推送 (如果已設定)

4. **設定環境變數** (如果 Zeabur 不支援 .env 檔案)
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `PORT` (通常 Zeabur 會自動設定)

### 方法二:手動上傳

1. 將 `deploy/` 目錄內的所有檔案打包
2. 上傳到您的伺服器
3. 執行 `npm install`
4. 執行 `npm start`

## LINE Developer Console 設定

部署完成後,請在 LINE Developer Console 進行以下設定:

### 1. 設定 Webhook URL

```
https://你的網域/callback
```

> [!IMPORTANT]
> 注意路徑是 `/callback` 而非 `/webhook`

### 2. 啟用 Webhook

- Use webhook: ✅ 啟用
- 點擊 "Verify" 按鈕
- 應該顯示 "Success" ✅

### 3. 設定 Rich Menu (如果尚未設定)

參考 [RICHMENU_GUIDE.md](file:///Users/mac/代碼程式/招生處/RICHMENU_GUIDE.md) 進行設定。

**推薦設定:**
- Action Type: `Postback`
- Data: `簡章` / `諮詢` / `獎學金` / `系所`

## 驗證步驟

### 1. 測試 Webhook 連線

在瀏覽器開啟:
```
https://你的網域/test
```

應該看到:
```
✅ 機器人伺服器目前運行中!請將 Webhook URL 設為: https://你的網域/callback
```

### 2. 測試 LINE Bot

1. 在 LINE App 中開啟與機器人的對話
2. 手動輸入關鍵字測試:
   - 輸入 `簡章` → 應該收到招生簡章卡片
   - 輸入 `諮詢` → 應該收到諮詢資訊卡片
   - 輸入 `獎學金` → 應該收到獎學金資訊卡片
   - 輸入 `系所` → 應該收到系所輪播卡片

3. 點擊 Rich Menu 按鈕
   - 應該觸發對應的回覆

## 故障排除

### Webhook 驗證失敗

**檢查項目:**
1. URL 是否正確 (必須是 `https://網域/callback`)
2. 伺服器是否正在運行
3. SSL 憑證是否有效
4. 防火牆是否允許 LINE Platform 的請求

### Rich Menu 沒有反應

**檢查項目:**
1. Webhook 是否已啟用
2. Rich Menu Action Type 是否為 `Postback` 或 `Message`
3. Data/Text 欄位是否填入正確的關鍵字
4. 查看伺服器日誌確認是否收到請求

### 查看伺服器日誌

部署平台通常提供日誌查看功能:
- Zeabur: Dashboard → Logs
- Heroku: `heroku logs --tail`

正常運作時應該看到:
```
🚀 萬能招生 Bot 已啟動於 Port: 8080
--- 收到 Webhook 請求 ---
處理事件類型: postback
收到 Postback 資料: 簡章
處理指令: 簡章
```

## 完成!

部署完成後,您的 LINE Bot 應該能:
- ✅ 正確接收 Webhook 請求
- ✅ 處理 Rich Menu 點擊 (postback 事件)
- ✅ 處理文字訊息 (message 事件)
- ✅ 回覆精美的 Flex Message

如有任何問題,請參考 [RICHMENU_GUIDE.md](file:///Users/mac/代碼程式/招生處/RICHMENU_GUIDE.md) 的故障排除章節。
