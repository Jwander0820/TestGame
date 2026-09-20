# Pity Platformer 視覺系統主檔

- 狀態：已核准基準
- 最後更新：2026-09-20
- 權威規格：`docs/specs/SPEC-0005-art-style-baseline.md`
- 適用範圍：遊戲世界、DOM 遊戲外框、後續正式像素資產與程式 fallback

## 文件優先序

1. `SPEC-0007` 增補本次重整（色盤、標題插畫、原創程式角色與地表）；`SPEC-0005` 定義整體美術承諾、資產狀態與驗收條件。
2. `pages/game-shell.md` 定義遊戲外框、HUD、觸控列與跨裝置排版。
3. 本檔定義共用 token、材質、輪廓、字體與動態規則。

頁面規格可以收窄元件使用方式，但不得重新引入兒童教材、作業紙、紅筆批改、現代 Debug 或與本色盤無關的行銷頁語言。`docs/logs/` 是歷史紀錄，不作為目前視覺規格的覆寫來源。

## 核心視覺論述

零死亡時，玩家看見的是完整、可愛、正統的像素奇幻冒險：清晨森林、古代遺跡、遠方王城與一名非常認真的新手勇者。

死亡後，王城才逐步維持不了公正形象。事故簿、蠟封、守衛、修繕隊、繩索、木板與王命封條以世界觀內的方式侵入；笑點來自體面制度逐漸公開放水，不來自一開始就潦草或像未完成測試畫面。

遊戲世界採純像素表現。DOM 外框以清楚文字、硬邊框線與同一套語意色彩服務操作，不強迫繁體中文使用低可讀性的像素字。

## 三層 token 架構

所有實作依 `Primitive → Semantic → Component` 三層引用。只有 Primitive 可以直接定義色值或尺寸；Semantic 表達用途；Component 只組合語意 token，不自行加入新色。

### 第一層：Primitive

#### 主要不透明色

| Token | 色值 | 用途基礎 |
| --- | --- | --- |
| `--px-ink-950` | `#14232B` | 最深輪廓、主要文字 |
| `--px-ink-700` | `#2D4650` | 次級輪廓、遠景深色 |
| `--px-sky-100` | `#E0EEE5` | 清晨天空亮部 |
| `--px-sky-300` | `#B2D8D5` | 天空與遠山中間值 |
| `--px-mist-300` | `#B8D5CD` | 遠景霧氣 |
| `--px-forest-300` | `#88B8AB` | 中景樹冠亮部 |
| `--px-forest-500` | `#50856B` | 中景森林主色 |
| `--px-forest-700` | `#25634E` | 森林陰影 |
| `--px-grass-300` | `#BBCB7A` | 安全草地頂面 |
| `--px-grass-500` | `#78A05A` | 草地本體 |
| `--px-stone-200` | `#C9C9B6` | 石材亮面 |
| `--px-stone-400` | `#8D9A90` | 石材主色 |
| `--px-stone-700` | `#465B59` | 石材陰影 |
| `--px-wood-300` | `#C99459` | 木材亮面 |
| `--px-wood-500` | `#8D603C` | 木材主色 |
| `--px-wood-700` | `#583D2E` | 木材陰影 |
| `--px-hero-red-300` | `#EF8061` | 主角披風亮部 |
| `--px-hero-red-500` | `#C84C42` | 主角識別色 |
| `--px-danger-400` | `#E76546` | 揭露後危險主色 |
| `--px-danger-700` | `#9D342F` | 危險輪廓與陰影 |
| `--px-aid-gold-300` | `#FFE48A` | 援助亮光 |
| `--px-aid-gold-500` | `#F3C743` | 王室援助與蠟封亮部 |
| `--px-aid-cyan-300` | `#62D4D6` | 魔法援助亮部 |
| `--px-aid-cyan-600` | `#218B93` | 魔法援助輪廓 |
| `--px-parchment-100` | `#FFF3D6` | 王室 UI 表面 |
| `--px-royal-brown-500` | `#86613E` | 王室 UI 邊框、蠟封暗部 |
| `--px-focus-blue-500` | `#2F78D8` | 鍵盤焦點 |
| `--px-white` | `#FFFFFF` | 高亮與反白文字 |

以上 28 色是本輪主要不透明色基準。瀏覽器字型抗鋸齒、遠景霧氣與非碰撞特效可產生額外透明混色，但正式像素角色、地形、物件與程式 fallback 不得藉此引入未記錄的主要色。

#### 幾何與節奏

| Token | 值 | 用途 |
| --- | ---: | --- |
| `--pixel-unit` | `1px` | 像素資產與硬邊程式圖形基本單位 |
| `--outline-gameplay` | `2px` | 主角、平台、陷阱與援助物輪廓 |
| `--outline-ui` | `3px` | DOM 外框與主要操作元件 |
| `--tile-size` | `24px` | 首關地形模組 |
| `--hero-frame-width` | `32px` | 主角動畫格寬 |
| `--hero-frame-height` | `48px` | 主角動畫格高 |
| `--space-1` | `4px` | 緊密內距 |
| `--space-2` | `8px` | 圖示與文字間距 |
| `--space-3` | `12px` | 觸控目標間距 |
| `--space-4` | `16px` | 標準面板內距 |
| `--touch-target-min` | `56px` | 觸控按鈕最小尺寸 |
| `--radius-shell` | `4px` | DOM 外框最大常用圓角 |
| `--duration-fast` | `150ms` | 按壓與焦點回饋 |
| `--duration-normal` | `220ms` | 一般 UI 進退場 |

### 第二層：Semantic

| Token | 引用 | 意義 |
| --- | --- | --- |
| `--color-scene-sky` | `var(--px-sky-100)` | 天空基底 |
| `--color-scene-far` | `var(--px-mist-300)` | 低對比遠景 |
| `--color-scene-mid` | `var(--px-forest-500)` | 中景森林 |
| `--color-game-outline` | `var(--px-ink-950)` | 遊戲層主要輪廓 |
| `--color-safe-top` | `var(--px-grass-300)` | 可站立頂面 |
| `--color-safe-body` | `var(--px-grass-500)` | 安全地形本體 |
| `--color-material-stone` | `var(--px-stone-400)` | 石材主面 |
| `--color-material-wood` | `var(--px-wood-500)` | 木材與臨時修補主面 |
| `--color-danger-revealed` | `var(--px-danger-400)` | 首次觸發後的危險 |
| `--color-danger-outline` | `var(--px-danger-700)` | 危險形狀提示 |
| `--color-assist-primary` | `var(--px-aid-gold-500)` | 王城公開援助 |
| `--color-assist-magic` | `var(--px-aid-cyan-300)` | 魔法或史萊姆援助焦點 |
| `--color-hero-id` | `var(--px-hero-red-500)` | 主角識別 |
| `--color-ui-surface` | `var(--px-parchment-100)` | 王室試煉 UI 表面 |
| `--color-ui-ink` | `var(--px-ink-950)` | UI 文字 |
| `--color-ui-border` | `var(--px-royal-brown-500)` | UI 邊框 |
| `--color-focus` | `var(--px-focus-blue-500)` | 可存取性焦點 |

偽裝危險在首次觸發前沿用安全色，但必須由元件狀態保留可學習的細微材質線索；首次觸發後才切換 `danger` 語意，並同時加入裂痕、尖角、缺口或動態，不只改色。

### 第三層：Component

| Component token | 引用 | 規則 |
| --- | --- | --- |
| `--hero-outline` | `var(--color-game-outline)` | 所有主角姿勢共用 |
| `--hero-cape` | `var(--color-hero-id)` | 不與危險主色共用 |
| `--platform-top` | `var(--color-safe-top)` | 與實際碰撞頂面對齊 |
| `--platform-body` | `var(--color-safe-body)` | 細節不得高於頂面 |
| `--trap-revealed-fill` | `var(--color-danger-revealed)` | 只在揭露後使用 |
| `--repair-plank-fill` | `var(--color-material-wood)` | 繩索、木板與臨時橋 |
| `--incident-ledger-bg` | `var(--color-ui-surface)` | 首次死亡後才出現 |
| `--incident-ledger-ink` | `var(--color-ui-ink)` | 一般文字至少 4.5:1 |
| `--death-badge-bg` | `var(--color-assist-primary)` | 保持世界觀內徽記感 |
| `--touch-control-bg` | `var(--color-ui-surface)` | 清楚但不偽裝成遊戲平台 |
| `--touch-control-border` | `var(--color-ui-border)` | 按下時以位移與陰影變化回饋 |
| `--touch-control-focus` | `var(--color-focus)` | 不與危險或援助混淆 |

## 像素、材質與光影

- 光源固定來自左上方；角色、石材、木材、草地與援助物至少使用亮面、主色、陰影三階，不各自改變光向。
- 遊戲層不得使用平滑漸層、模糊陰影或抗鋸齒筆刷。遠景霧氣可以透明，但不得模糊必要落腳點。
- 草、石、木與臨時修補是首輪必備材質。每種材質需有可在原始尺寸辨識的形狀語言，並通過 4×4 重複拼接無裂縫檢查。
- 遊戲層輪廓對比最高；中景次之；遠景最低。前景不得遮住主角腳部、碰撞頂面或下一必要落點。
- 32×48 主角的有效輪廓高度目標為 38–44px，腳底基線漂移不超過 1px；黑色剪影仍需看出朝向與主要動作。
- 像素資產以最近鄰顯示並採整數座標。非整數 viewport 縮放仍需以實際遊戲截圖檢查閃爍與可讀性。

## 死亡前後的視覺階段

| 階段 | 基底 | 新增元素 |
| --- | --- | --- |
| 零死亡 | 正統清晨森林與克制王室試煉 UI | 不顯示大型事故簿或施工笑點 |
| 首次死亡 | 同一色盤與材質 | 小型事故簿或蠟封首次出現 |
| 偷偷放水 | 奇幻世界不切換主題 | 平台靠近、繩索、木板、守衛心虛 |
| 公開援助 | 援助短暫成為焦點 | 金色／魔法青效果、史萊姆、修繕隊 |
| 荒謬繞過 | 世界公開放棄公正 | 王命封條、停用機關、終點主動靠近 |

任何階段都不得突然切換成作業紙、紅筆、現代 Debug 或與世界無關的通用 App UI。

## DOM 外框與字體

- DOM 外框共享本色盤與 3px 硬邊，但以文字清楚和操作可用為優先，不模擬低解析中文點陣字。
- 繁體中文基準字體為 `"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif`；遠端字型失敗不得阻止遊戲開始。
- 顯示標題可使用較有個性的字重或未來自架字型，正式字型來源與製作方式仍待決。
- 一般文字與底色對比至少 4.5:1；重要狀態不能只靠顏色傳達。
- 圓角不超過 `--radius-shell`；不使用玻璃模糊、柔軟大陰影、膠囊卡片或行銷網站式懸浮效果。

## 控制與動態

- 每個觸控目標至少 56×56px，間距至少 12px；按下時使用 1–2px 內縮、陰影縮短與圖示位移，不只改色。
- 所有 DOM 按鈕具有可見 `:focus-visible`，焦點色不得與危險或援助色混淆。
- 一個畫面最多一個主要 UI 動畫。蠟封、事故簿或修繕入場需短促，不反覆遮擋操作。
- UI 進退場以 150–220ms 為主；不引入 GSAP、濾鏡或 shader。
- `prefers-reduced-motion: reduce` 時停用非必要抖動、漂移、縮放與鏡頭震動，保留玩法必要動作。

## 跨裝置基準

| Viewport | 主要檢查 |
| --- | --- |
| 960×540 | 原始舞台、像素輪廓、HUD 與落點 |
| 844×390 | 手機橫向、觸控鍵與右上狀態區 |
| 667×375 | 低高度橫向、安全帶與必要字幕 |
| 375×667 | 直向完整 16:9 舞台、舞台下方控制列 |

四種尺寸都需檢查零死亡、首次死亡與最高援助狀態。主角、下一落點、揭露後危險與援助目標不得被 HUD 或觸控鍵遮擋；直向不裁切或拉伸 Canvas。

## 禁止模式

- 兒童教材、作業紙橫線、紅筆批改、試卷、補考章。
- 與遊戲無關的行銷配色、商店評分、裝置 mockup、下載 CTA 或行銷卡片網格。
- 高解析插畫縮小後冒充像素、平滑向量背景、混合像素密度與未記錄色盤。
- 現代 Debug 視窗、工具面板、亂碼文字或烘焙在圖像內的可變文案。
- 只靠紅／綠區分安全與危險，或讓援助特效遮住下一落點。
- Emoji 直接作為正式操作圖示；圖示需使用原創像素資產、清楚文字或一致且可追溯的 SVG。

## 交付前檢查

- [ ] 視覺行為符合 `SPEC-0005`，頁面規格沒有重新定義相反方向。
- [ ] 色值只出現在 Primitive；Semantic 與 Component 皆透過 token 引用。
- [ ] 正式像素資產與 fallback 使用不超過 32 個主要不透明色。
- [ ] 主角、平台、危險與援助在原始尺寸及實際手機縮放下可辨識。
- [ ] 零死亡畫面沒有事故簿、施工或放水元素搶先暴露笑點。
- [ ] 揭露後危險具有顏色以外的輪廓、材質或動態提示。
- [ ] DOM 文字維持 4.5:1、焦點可見、觸控目標達 56×56px。
- [ ] `prefers-reduced-motion` 與四種 viewport 已納入驗證。
- [ ] 所有新資產都有來源、授權、尺寸、色盤與狀態紀錄。
