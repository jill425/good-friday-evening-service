# Good Friday Evening Service

耶穌受難日晚間崇拜視覺網站。3D 星空背景 + 捲動圖片動畫展示。

## 專案架構

```
good_friday_evening_service/
├── app/
│   ├── layout.js         # HTML 骨架、頁面 metadata
│   ├── page.js           # 首頁入口
│   └── globals.css       # 全域樣式（黑底 reset）
├── components/
│   ├── StarScene.js      # Three.js 3D 星空（流星尾巴效果）
│   └── ImageScroll.js    # GSAP ScrollTrigger 捲動圖片動畫
├── public/
│   └── images/           # 圖片素材（2,3,5,6,7,8,9,10,11.webp）
├── netlify.toml          # Netlify 部署設定
├── next.config.mjs
└── package.json
```

## 技術棧

| 功能 | 技術 |
|------|------|
| 框架 | Next.js（App Router） |
| 3D 星空 | Three.js — 粒子沿 Z 軸飛向鏡頭，LineSegments 模擬流星尾巴 |
| 捲動動畫 | GSAP + ScrollTrigger — 9 張圖依序 pin、放大飛出 |
| 部署 | Netlify + @netlify/plugin-nextjs |

## 本地開發

```bash
npm install
npm run dev
# 開啟 http://localhost:3000
```

## 部署

推上 GitHub 後，Netlify 連接 repo 即可自動觸發部署。build 設定已寫在 `netlify.toml`。
