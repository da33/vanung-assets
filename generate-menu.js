// 萬能招生 LINE Rich Menu 產圖器 — v2 夜航航空風（深色琥珀金 / 登機證 / 跑道）
// 自帶背景，不依賴外部圖檔。輸出 richmenu-v2.jpg (2500x1686, <1MB)
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// ---- 字體：用涵蓋 CJK + 符號的單一字檔，避免 node-canvas 豆腐框 ----
function reg(p, family) { try { registerFont(p, { family }); } catch (e) { console.warn(`字體註冊失敗 ${family}:`, e.message); } }
reg('/System/Library/Fonts/Supplemental/Arial Unicode.ttf', 'AU');   // 中文 + ✈☎★▦◎
reg('/System/Library/Fonts/SFNSMono.ttf', 'SFMono');                 // 登機證等寬碼

const W = 2500, H = 1686, COLS = 3, ROWS = 2;
const CW = W / COLS, CH = H / ROWS;

// v2 夜航配色
const NIGHT_TOP = '#02030A', NIGHT_MID = '#05070D', NIGHT_BOT = '#0A0F1C';
const AMBER = '#FFB81C', AMBER_HI = '#FFE9A8', AMBER_LO = '#E89200', WHITE = '#F2F5FA';

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
const foil = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, AMBER_HI); g.addColorStop(0.5, AMBER); g.addColorStop(1, AMBER_LO);
    return g;
};

// ---- 背景：夜空漸層 ----
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, NIGHT_TOP); bg.addColorStop(0.55, NIGHT_MID); bg.addColorStop(1, NIGHT_BOT);
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// ---- 底部跑道暖光 ----
const glow = ctx.createRadialGradient(W / 2, H + 220, 200, W / 2, H + 220, 1550);
glow.addColorStop(0, 'rgba(255,184,28,0.16)');
glow.addColorStop(0.5, 'rgba(255,184,28,0.05)');
glow.addColorStop(1, 'rgba(255,184,28,0)');
ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

// ---- 星點 ----
for (let i = 0; i < 150; i++) {
    const x = Math.random() * W, y = Math.random() * H * 0.85, r = Math.random() * 2.2 + 0.4;
    ctx.globalAlpha = Math.random() * 0.5 + 0.15;
    ctx.fillStyle = Math.random() > 0.85 ? AMBER : '#cfe0ff';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
ctx.globalAlpha = 1;

// ---- 飛行航跡弧線 + 末端小飛機 ----
ctx.save();
ctx.setLineDash([6, 16]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,184,28,0.22)';
ctx.beginPath(); ctx.moveTo(120, H - 170); ctx.quadraticCurveTo(W * 0.5, 110, W - 170, 360); ctx.stroke();
ctx.restore();
ctx.save();
ctx.font = "64px 'AU'"; ctx.fillStyle = 'rgba(255,233,168,0.85)';
ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.shadowColor = 'rgba(255,184,28,0.6)'; ctx.shadowBlur = 20;
ctx.translate(W - 170, 350); ctx.rotate(-0.32); ctx.fillText('✈', 0, 0);
ctx.restore();

// ---- 登機證分隔虛線 ----
ctx.save();
ctx.setLineDash([10, 16]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,184,28,0.25)';
for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(CW * c, 44); ctx.lineTo(CW * c, H - 44); ctx.stroke(); }
ctx.beginPath(); ctx.moveTo(44, CH); ctx.lineTo(W - 44, CH); ctx.stroke();
ctx.restore();
// 交點打孔小圓（登機證撕線感）
ctx.save();
ctx.strokeStyle = 'rgba(255,184,28,0.4)'; ctx.lineWidth = 2;
[[CW, CH], [CW * 2, CH]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke(); });
ctx.restore();

// ---- 六格內容 ----
const cells = [
    { icon: '▤', label: '招生簡章', sub: 'BROCHURE',    gate: 'GATE 01' },
    { icon: '★', label: '獎學金',   sub: 'SCHOLARSHIP', gate: 'GATE 02' },
    { icon: '☎', label: '真人諮詢', sub: 'CONSULT',     gate: 'GATE 03' },
    { icon: '▦', label: '系所介紹', sub: 'PROGRAMS',    gate: 'GATE 04' },
    { icon: '✈', label: '入學管道', sub: 'ADMISSION',   gate: 'GATE 05' },
    { icon: '◎', label: '校園導覽', sub: 'CAMPUS',      gate: 'GATE 06' },
];

cells.forEach((cell, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x0 = col * CW, y0 = row * CH, cx = x0 + CW / 2, cy = y0 + CH / 2;

    // 左上 gate 碼 + 右上裝飾點
    ctx.save();
    ctx.font = "26px 'SFMono'"; ctx.fillStyle = 'rgba(255,184,28,0.5)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    try { ctx.letterSpacing = '3px'; } catch (e) {}
    ctx.fillText(cell.gate, x0 + 50, y0 + 48);
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    ctx.fillStyle = 'rgba(255,184,28,0.5)';
    ctx.beginPath(); ctx.arc(x0 + CW - 62, y0 + 64, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 圖示圓環
    const iy = cy - 150;
    ctx.save();
    ctx.strokeStyle = foil(cx - 100, iy - 100, cx + 100, iy + 100); ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255,184,28,0.45)'; ctx.shadowBlur = 28;
    ctx.beginPath(); ctx.arc(cx, iy, 92, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // 圖示
    ctx.save();
    ctx.font = "90px 'AU'"; ctx.fillStyle = foil(cx - 55, iy - 55, cx + 55, iy + 55);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,184,28,0.55)'; ctx.shadowBlur = 22;
    ctx.fillText(cell.icon, cx, iy + 4);
    ctx.restore();

    // 中文標題（描邊模擬粗體）
    ctx.save();
    ctx.font = "70px 'AU'"; ctx.fillStyle = WHITE; ctx.strokeStyle = WHITE; ctx.lineWidth = 1.4;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 8;
    ctx.fillText(cell.label, cx, cy + 50); ctx.strokeText(cell.label, cx, cy + 50);
    ctx.restore();

    // 金色底線
    ctx.save();
    ctx.strokeStyle = foil(cx - 50, 0, cx + 50, 0); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 46, cy + 112); ctx.lineTo(cx + 46, cy + 112); ctx.stroke();
    ctx.restore();

    // 等寬英文副標
    ctx.save();
    ctx.font = "27px 'SFMono'"; ctx.fillStyle = AMBER;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = '6px'; } catch (e) {}
    ctx.fillText(cell.sub, cx + 3, cy + 152);
    ctx.restore();
});

const out = path.join(__dirname, 'richmenu-v2.jpg');
const buf = canvas.toBuffer('image/jpeg', { quality: 0.9 });
fs.writeFileSync(out, buf);
console.log(`✅ 選單圖已產生: ${out}`);
console.log(`   尺寸 ${W}x${H}　大小 ${(buf.length / 1024).toFixed(0)}KB　(LINE 上限 1024KB)`);
