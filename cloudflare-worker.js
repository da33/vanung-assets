// Cloudflare Worker - LINE Webhook 代理
// 解決 Zeabur SSL 與 LINE 不相容問題

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // 轉發到 Zeabur
  const zeaburUrl = 'https://vnulineoff.zeabur.app' + url.pathname

  const newRequest = new Request(zeaburUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })

  return await fetch(newRequest)
}
