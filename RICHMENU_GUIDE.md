# LINE Rich Menu 設定指南

本指南說明如何在 LINE Developer Console 中正確設定 Rich Menu,以確保選單能與機器人正常互動。

## 前置條件

✅ 伺服器程式碼已更新,支援以下事件類型:
- `postback` 事件 (推薦使用)
- `message` 事件 (文字訊息)

## Rich Menu Action 設定方式

### 方式一:使用 Postback Action (推薦)

在 LINE Developer Console 的 Rich Menu 設定中:

1. **Action Type**: 選擇 `Postback`
2. **Data**: 填入關鍵字,例如:
   - `簡章` - 觸發招生簡章回覆
   - `諮詢` - 觸發諮詢資訊回覆
   - `獎學金` 或 `獎` - 觸發獎學金資訊回覆
   - `系所` - 觸發系所介紹輪播

**範例設定:**
```
Action Type: Postback
Data: 簡章
Display Text: (可選) 查看招生簡章
```

### 方式二:使用 Message Action

1. **Action Type**: 選擇 `Message`
2. **Text**: 填入關鍵字,例如:
   - `簡章`
   - `諮詢`
   - `獎學金`
   - `系所`

**範例設定:**
```
Action Type: Message
Text: 簡章
```

## 支援的關鍵字列表

| 關鍵字 | 觸發內容 |
|:---|:---|
| `簡章`、`简章`、`報名`、`报名` | 招生簡章與報名資訊 |
| `諮詢`、`咨询`、`我要諮詢`、`專人`、`電話`、`問問`、`consult` | 諮詢專線與聯絡方式 |
| `獎`、`奖` | 獎學金資訊 |
| `系所`、`学院`、`學系` | 四大學院介紹輪播 |

## Webhook 設定

確保 LINE Developer Console 中的 Webhook 設定正確:

1. **Webhook URL**: `https://你的網域/callback`
2. **Use webhook**: 啟用 ✅
3. **Verify**: 點擊驗證按鈕,應該顯示成功

## 測試步驟

1. 在 LINE App 中開啟與機器人的對話
2. 點擊 Rich Menu 按鈕
3. 機器人應該立即回覆對應的 Flex Message

## 故障排除

### 問題:點擊選單沒有反應

**可能原因與解決方法:**

1. **Webhook URL 錯誤**
   - 檢查 LINE Developer Console 中的 Webhook URL 是否正確
   - 確認伺服器正在運行

2. **Rich Menu Action 設定錯誤**
   - 確認 Action Type 是 `Postback` 或 `Message`
   - 確認 Data/Text 欄位有填入關鍵字

3. **伺服器未運行**
   - 檢查部署平台 (Zeabur/Heroku 等) 的伺服器狀態
   - 查看伺服器日誌是否有錯誤

4. **關鍵字不匹配**
   - 確認 Rich Menu 中設定的關鍵字在支援列表中
   - 關鍵字需完全匹配 (不區分大小寫)

### 查看伺服器日誌

如果問題持續,請查看伺服器日誌:
- 應該看到 `--- 收到 Webhook 請求 ---`
- 應該看到 `處理事件類型: postback` 或 `處理事件類型: message`
- 應該看到 `處理指令: [關鍵字]`

如果沒有看到這些日誌,表示 Webhook 請求根本沒有到達伺服器。

## 進階:使用 LINE Messaging API 建立 Rich Menu

如果需要透過程式碼建立 Rich Menu,可以參考以下範例:

```javascript
const richMenu = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "萬能招生處選單",
  chatBarText: "選單",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: "postback", data: "簡章", displayText: "查看招生簡章" }
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: "postback", data: "諮詢", displayText: "諮詢專線" }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: "postback", data: "獎學金", displayText: "獎學金資訊" }
    },
    {
      bounds: { x: 0, y: 843, width: 2500, height: 843 },
      action: { type: "postback", data: "系所", displayText: "系所介紹" }
    }
  ]
};
```

## 總結

✅ 伺服器已支援 `postback` 和 `message` 兩種 Rich Menu action
✅ 關鍵字比對邏輯正常運作
✅ 只需在 LINE Developer Console 正確設定 Rich Menu 即可使用
