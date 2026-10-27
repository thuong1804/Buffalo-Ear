const { chromium } = require("playwright");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

(async () => {
    const root = path.resolve(__dirname, "..");
    const font = await readFile(path.join(root, "public/fonts/nunito-sans-4.woff2"));
    const icon = await readFile(path.join(root, "public/favicon.svg"));
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            viewport: { width: 1200, height: 630 },
            deviceScaleFactor: 1,
        });
        await page.setContent(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>
            @font-face {font-family:Nunito;src:url(data:font/woff2;base64,${font.toString("base64")})}
            * {box-sizing:border-box} body {margin:0;background:#f2f8f7;color:#172f2b;font-family:Nunito,sans-serif}
            main {height:630px;padding:64px 80px;border-bottom:14px solid #1d6858}
            header {display:flex;align-items:center;gap:20px;font-size:34px;font-weight:600;letter-spacing:-1px}
            img {width:64px;height:64px} h1 {margin:70px 0 20px;font-size:88px;line-height:1.15;font-weight:600;letter-spacing:-3px}
            h1 span {color:#1d6858} p {font-size:28px;color:#3f5851;margin:0} footer {margin-top:48px;font-size:22px;color:#175343}
        </style></head><body><main><header><img src="data:image/svg+xml;base64,${icon.toString("base64")}" alt="">BUFFALO EAR</header>
        <h1>Nghe kỹ. <span>Nhớ lâu.</span></h1><p>Luyện nghe tiếng Anh, từng ngày.</p><footer>Listening · Dictation · Grammar</footer></main></body></html>`);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(root, "public/social-card.png") });
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
