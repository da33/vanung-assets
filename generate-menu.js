const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const W = 2500, H = 1686;
const BG_PATH = '/Users/mac/Downloads/下載/smile-ai-45e66493-30df-4529-b952-ea56297bdd43.png';

async function main() {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 背景圖
    const bg = await loadImage(BG_PATH);
    ctx.drawImage(bg, 0, 0, W, H);

    // 深色遮罩
    ctx.fillStyle = 'rgba(5,5,5,0.55)';
    ctx.fillRect(0, 0, W, H);

    // 掃描線
    for (let y = 0; y < H; y += 8) {
        ctx.fillStyle = 'rgba(0,240,255,0.01)';
        ctx.fillRect(0, y, W, 2);
    }

    const cells = [
        { x: 0,    y: 0,   w: 833,  h: 843,  icon: '≡',  label: '招生簡章', sub: 'BROCHURE',    accent: '#2979FF' },
        { x: 833,  y: 0,   w: 834,  h: 843,  icon: '★',  label: '獎學金',   sub: 'SCHOLARSHIP', accent: '#00E5FF' },
        { x: 1667, y: 0,   w: 833,  h: 843,  icon: 'AI', label: 'AI 客服',  sub: 'AI SERVICE',  accent: '#E040FB' },
        { x: 0,    y: 843, w: 833,  h: 843,  icon: '⊞',  label: '系所介紹', sub: 'DEPARTMENTS', accent: '#FF6E40' },
        { x: 833,  y: 843, w: 834,  h: 843,  icon: '◎',  label: '入學管道', sub: 'ADMISSION',   accent: '#18FFFF' },
        { x: 1667, y: 843, w: 833,  h: 843,  icon: '◈',  label: '校園導覽', sub: 'CAMPUS TOUR', accent: '#FF5252' },
    ];

    cells.forEach(cell => {
        const cx = cell.x + cell.w / 2;
        const cy = cell.y + cell.h / 2;

        // 圖示
        ctx.save();
        ctx.fillStyle = cell.accent;
        ctx.font = `bold ${cell.icon.length > 1 ? '140' : '170'}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = cell.accent;
        ctx.shadowBlur = 40;
        ctx.fillText(cell.icon, cx, cy - 110);
        ctx.restore();

        // 主標題
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 90px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = cell.accent;
        ctx.shadowBlur = 25;
        ctx.fillText(cell.label, cx, cy + 90);
        ctx.restore();

        // 副標題
        ctx.save();
        ctx.fillStyle = cell.accent;
        ctx.font = '44px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = cell.accent;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.85;
        ctx.fillText(cell.sub, cx, cy + 210);
        ctx.restore();
    });

    const out = fs.createWriteStream('/Users/mac/Downloads/richmenu_new.jpg');
    canvas.createJPEGStream({ quality: 0.95 }).pipe(out);
    out.on('finish', () => {
        console.log('✅ 完成');
        require('child_process').exec('open /Users/mac/Downloads/richmenu_new.jpg');
    });
}

main().catch(console.error);
