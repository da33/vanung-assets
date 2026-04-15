# Cloudflare Tunnel 設定步驟

## 1. 安裝 cloudflared

```bash
brew install cloudflare/cloudflare/cloudflared
```

## 2. 登入 Cloudflare

```bash
cloudflared tunnel login
```

會開啟瀏覽器，選擇你的網域（如果沒有，Cloudflare 會提供免費的 .trycloudflare.com 網域）

## 3. 建立 Tunnel

```bash
cloudflared tunnel create vnu-line-bot
```

記下 Tunnel ID

## 4. 建立設定檔

建立 `~/.cloudflared/config.yml`：

```yaml
tunnel: <你的-tunnel-id>
credentials-file: /Users/mac/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: <你的網域或使用trycloudflare.com>
    service: https://vnulineoff.zeabur.app
  - service: http_status:404
```
