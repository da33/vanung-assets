# 🚀 快速部署指南

## ✅ 已完成的修復

1. **Webhook 404 錯誤** - 路由已統一為 `/callback`
2. **諮詢按鈕不顯示** - 移除 `toLowerCase()` bug

## 📦 部署檔案

所有最新程式碼已同步到 `deploy/` 目錄:
- ✅ `server.js` (13,217 bytes)
- ✅ `.env` (環境變數)
- ✅ `package.json`
- ✅ `index.html`

## 🎯 部署步驟

### 1️⃣ 上傳檔案到伺服器

將 `deploy/` 目錄的所有檔案上傳到您的部署平台 (Zeabur/Heroku 等)

### 2️⃣ 設定 LINE Webhook

前往 [LINE Developer Console](https://developers.line.biz/console/):
- Webhook URL: `https://你的網域/callback`
- Use webhook: ✅ Enabled
- 點擊 **Verify** → 應顯示 Success ✅

### 3️⃣ 測試功能

**伺服器測試:**
```
https://你的網域/test
```

**LINE 對話測試:**
- 輸入「諮詢」→ 收到諮詢卡片 ✅
- 輸入「簡章」→ 收到簡章卡片 ✅
- 輸入「獎學金」→ 收到獎學金卡片 ✅
- 點擊 Rich Menu → 觸發對應功能 ✅

## 🔍 故障排除

### Webhook 驗證失敗?
- 確認 URL 是 `/callback` (不是 `/webhook`)
- 確認伺服器正在運行
- 檢查 SSL 憑證有效

### 諮詢按鈕無反應?
- 確認已部署最新版本 (13,217 bytes)
- 查看伺服器日誌
- 確認 Rich Menu Action Type 為 `Postback`

## 📚 詳細文件

- [完整部署指南](file:///Users/mac/.gemini/antigravity/brain/b7e1d239-7961-41b6-b8cb-b83b82c2be28/implementation_plan.md)
- [修復完成報告](file:///Users/mac/.gemini/antigravity/brain/b7e1d239-7961-41b6-b8cb-b83b82c2be28/walkthrough.md)
- [Rich Menu 設定指南](file:///Users/mac/代碼程式/招生處/RICHMENU_GUIDE.md)

---

**準備就緒!** 請按照上述步驟部署到生產環境 🎉
