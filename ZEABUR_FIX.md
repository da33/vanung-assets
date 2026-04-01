# 🚀 Zeabur 部署修復步驟

## 問題診斷結果

❌ Zeabur 伺服器返回 404（所有端點）
❌ 缺少 nixpacks.toml 檔案
❌ Rich Menu 未設定

## 立即修復步驟

### 1️⃣ 提交修復檔案到 Git

```bash
git add nixpacks.toml .node-version
git commit -m "修正(fix): 新增 nixpacks.toml 和 .node-version 修復 Zeabur 部署問題"
git push
```

### 2️⃣ 在 Zeabur 重新部署

1. 登入 Zeabur Dashboard
2. 進入專案：project-69cc8cdb74c6120ab98e9d99
3. 點擊「Redeploy」重新部署
4. 等待部署完成（約 2-3 分鐘）

### 3️⃣ 驗證部署成功

```bash
curl https://vun.zeabur.app/test
```

應該看到：✅ 機器人伺服器目前運行中！

### 4️⃣ 設定 LINE Webhook

1. 前往 LINE Developers Console
2. Webhook URL 設為：`https://vun.zeabur.app/callback`
3. 點擊「Verify」驗證
4. 啟用「Use webhook」

### 5️⃣ 建立 Rich Menu（可選）

執行腳本建立選單：
```bash
node setup-richmenu.js
```

或在 LINE Developers Console 手動設定 Rich Menu。

## 環境變數檢查

確認 Zeabur 已設定：
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `PORT=8080`
