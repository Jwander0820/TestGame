# SPEC-0006：整體美術收斂後續交接

> 2026-09-20 接續說明：使用者已要求恢復專案整理並重做像素奇幻美術，本次範圍見 [SPEC-0007](SPEC-0007-astra-art-refresh.md)，當前事實見 [STATUS](../STATUS.md)。以下保留 2026-08-10 暫停快照，不代表目前仍暫停，也不授權未被本次涵蓋的功能。

- 狀態：草案（交接快照，不授權自動續作）
- 負責人：使用者／下一位接手代理
- 建立日期：2026-08-10
- 最後更新：2026-08-10
- 關聯文件：SPEC-0001、SPEC-0002、SPEC-0005、`docs/design-system/pity-platformer/MASTER.md`

## 目的與暫停邊界

使用者於 2026-08-10 要求暫停後續處理，先依目前進度產出可接手的規格書。本文件記錄工作樹在暫停點的決策、已完成項目、驗證證據、尚未驗證變更與後續順序。

本文件本身不授權下一位代理繼續修改、生成資產、清理檔案、提交或推送。只有在使用者明確要求恢復工作後，才可依本規格繼續。暫停點的未提交工作樹是需保留的交接內容，不得以 `reset`、`checkout`、`clean` 或批次覆寫移除。

## 已定案的視覺方向

1. 第一眼必須是可信、可愛、正統的像素奇幻冒險，核心場景為王城外圍、新手森林、見習勇者與遠方王城。
2. 「假正經」笑點只在死亡後逐步出現，使用王城事故簿、守衛、蠟封、修繕隊、繩索、木橋與王命等世界內語彙。
3. 兒童教材、作業紙、紅筆批改、試卷、補考與現代 Debug 介面不得回到主視覺。
4. 遊戲世界維持純像素、最近鄰與硬邊；DOM 外框可保持清楚文字，但必須共用深青、羊皮紙、王室金、紅披風與援助青色的語意色彩。
5. 視覺 token 採 Primitive → Semantic → Component 三層；正式像素資產以 24–32 個主要色為世界基準，不能把高色數生成圖直接宣稱為受限色盤成品。
6. P0 的 C01 主角輪廓與 C03 晨光森林只作方向參考，不是正式核准資產；目前正式核准的 P1 遊戲資產數量仍為零。

## 暫停點狀態總覽

| 工作流 | 暫停點狀態 | 已有結果 | 尚欠項目 |
| --- | --- | --- | --- |
| 視覺規格 | 已收斂 | SPEC-0005、MASTER、game-shell 已統一正統像素奇幻方向 | 最終驗證後再補實作紀錄 |
| DOM 外框 | 已實作 | 深青王室外框、羊皮紙選單、王室金操作色、紅披風死亡階段 | 最新 CSS 仍需完整測試重跑 |
| Phaser 呈現 | 已實作 | `pixelArt: true`、關閉 antialias、整數像素、五層奇幻背景 | 需完成最新工作樹回歸驗證 |
| 程式 fallback | 已實作 | 32×48 勇者、像素平台、史萊姆彈簧、木製援助橋 | 正式動畫與 tileset 尚未製作 |
| 死亡後敘事 | 已實作 | 零死亡不顯示事故簿；首次死亡後揭露；最高援助仍留在奇幻世界內 | 最新反向彩蛋文案尚未截圖驗證 |
| P1 試作資產 | 已降級 | 錯誤主角／史萊姆已退出 `public`；原始交付仍保留 | 森林地表仍只是限定 placeholder |
| 單元與建置 | 曾通過 | 14 個測試檔、58 項測試；typecheck、build、diff check 通過 | 通過時間早於最後兩組小修改，不能視為目前工作樹最終結論 |
| 瀏覽器整關 | 部分通過 | 標準桌機零援助 0 死完成；最高援助 21 死完成 | 375×667 曾出現一次 22 死，需重現稽核 |
| 跨尺寸目視 | 大致完成 | 1280×800、960×540、844×390、667×375、375×667 已檢查 | 需保存整理後的正式證據，並補最新彩蛋文案畫面 |
| 驗收文件 | 未封版 | AC-9 仍誠實標為待重新驗證 | 完整通過後才能改為通過並新增實作日誌 |

## 已完成的文件收斂

以下文件已改成目前方向，下一位代理應先讀，不能讓舊歷史日誌覆寫它們：

- `docs/specs/SPEC-0005-art-style-baseline.md`
- `docs/design-system/pity-platformer/MASTER.md`
- `docs/design-system/pity-platformer/pages/game-shell.md`
- `docs/discovery/open-questions.md`
- `art-generation-output/p1-vertical-slice/review-index.md`
- `docs/art-outsourcing/06-integration-audit.md`
- `docs/specs/SPEC-0001-vertical-slice.md`
- `docs/testing/SPEC-0001-acceptance-matrix.md`

治理結論如下：

- 美術方向已定案，不再把 Q5 寫成完全未選。
- 正式資產製作方式仍未定案。
- C01／C03 是 reference，不是 selected production asset。
- 錯誤主角與史萊姆明確退件；森林圖只可作限定 placeholder。
- 歷史日誌中的教材、紅筆或公文遊樂場描述保留為歷史，不是目前 SSOT。

## 已完成的程式與資產調整

### DOM 與全域呈現

- `index.html`：標題、選單、完成與暫停語彙改為王室試煉與旅程語言；favicon 改為王室盾徽。
- `src/styles.css`：加入三層 token、深青外框、羊皮紙面板、硬邊框線、像素 Canvas、跨裝置安全區與 reduced-motion。
- `src/main.ts`：只依既有死亡次數設定呈現階段，不新增第二套進度真相來源。
- 667×375 目視時發現暫停鍵遮住事故簿，已把低高度橫向的暫停鍵移至上方中央；修正後截圖確認不再遮擋。

### Phaser 場景

- `src/game/rendering.ts` 與測試：集中定義像素渲染設定。
- `src/game/content/levelOneVisuals.ts` 與測試：建立 Primitive、Semantic、Component 與文字色彩映射，並驗證 component 不逸出 primitive palette。
- `src/game/visuals/LevelOneScenery.ts`：建立天空、雲、山、王城、森林、遺跡與前景五層像素奇幻背景。
- `src/game/visuals/createTextures.ts`：重畫程式 fallback 勇者、平台、史萊姆彈簧與木製援助橋。
- `src/game/scenes/VerticalSliceScene.ts`：零死亡隱藏事故簿；死亡後才揭露；移除作業紙／紅筆式註記；反向彩蛋改為王庫退役幣語彙。
- `src/game/scenes/levelOne/LevelOneWorld.ts`：危險揭露增加形狀提示，援助改用王命、木橋與魔法青色，不只靠顏色辨識。

### 資產狀態

以下公開試套已刪除，但原始交付仍保留在 `art-generation-output/p1-vertical-slice/`，因此可追溯且可復原：

- `public/assets/level-one/character/chr_hero_idle_sheet.png`
- `public/assets/level-one/assists/assist_slime_spring_sheet.png`

`public/assets/level-one/forest/` 仍可載入，但只作限定 placeholder。`levelOneArtManifest.ts` 與 `levelOneArt.ts` 已不再載入退件的主角／史萊姆。

## 驗證證據與精確限制

### 最後一次完整自動驗證

在低高度橫向暫停鍵定位與反向彩蛋文案修改之前，曾取得以下結果：

- `npm.cmd run typecheck`：通過。
- `npm.cmd test`：14 個測試檔、58 項測試全部通過。
- `npm.cmd run build`：通過。
- `git diff --check`：通過；只有 Git 的 LF／CRLF 提示。
- 正式 bundle 保留既有 Phaser 單一 chunk 大於 500 kB 的非阻塞警告。
- 當時的 `dist` 不含退件主角與史萊姆，仍含 forest PNG 與 atlas。

上述結果不能直接當作暫停點最新版已通過，因為其後還有兩組變更：

1. `src/styles.css` 的低高度橫向暫停鍵定位；已做 667×375 目視確認，但未重跑全套測試與 build。
2. 反向彩蛋改為「王庫退役幣」的場景、瀏覽器測試與測試文件；尚未重跑 typecheck、test、build 或彩蛋整關。

### 瀏覽器證據

- 零援助整關：`status=completed`、`deaths=0`。
- 最高援助整關：在 1280×800 標準桌機 viewport 複跑後為 `status=completed`、`deaths=21`。
- 375×667 viewport 的第一次最高援助路線曾為 `completed-with-extra-deaths`、`deaths=22`，額外死因是 `landing-stamp-ambush: 1`；標準桌機複跑未重現。
- 這個差異不可直接忽略，也不可把預期死亡數改成 22。恢復工作後應確認它是低效能／時序邊界、測試驅動器不穩定，還是實際物理回歸。
- 瀏覽器測試頁唯一已知 console error 是缺少 `/favicon.ico`，發生於開發測試頁，不是正式首頁執行錯誤。

### 目視證據

已實際檢查：

- 標題畫面：深青王室外框與羊皮紙選單。
- 零死亡：大比例程式勇者、森林、遠山與王城；事故簿不出現。
- 第一次死亡：事故簿才揭露。
- 第五次第一坑死亡：像素史萊姆彈簧出現。
- 預載最高援助：三個主要阻礙各 7 死，事故簿顯示王命通過，第一坑出現木橋。
- 844×390、667×375：舞台完整，三鍵可操作；667×375 的暫停鍵遮擋已修正。
- 375×667：Canvas 維持完整 16:9，控制列在舞台下方，未裁切或拉伸。

目前 `.playwright-cli/` 是未追蹤的暫存驗收產物。使用者尚未授權清理；恢復後應先挑選需要保留的截圖複製到忽略追蹤的 `output/playwright/`，再依安全規則處理暫存目錄。

## 恢復後的 P0 順序

只有在使用者明確要求恢復後，才依序執行。

### P0-1：不改程式，先驗證暫停點

1. 完整閱讀 `docs/AGENT.md`、SPEC-0005 與本規格。
2. 以 `git status --short` 與 `git diff` 確認工作樹；不得還原或覆寫現有變更。
3. 執行：

   ```powershell
   npm.cmd run typecheck
   npm.cmd test
   npm.cmd run build
   git diff --check
   ```

4. 驗證 `dist` 不含退件主角／史萊姆，且 playtest driver 不進正式產物。
5. 執行 `zero-assist.html`、`max-assistance.html`、`reverse-easter-egg.html`、`progress-reload.html` 與正式產物測試。
6. 最高援助至少在標準桌機連續通過兩次；再於 375×667 複跑，記錄是否仍多出 `landing-stamp-ambush`。

### P0-2：補齊最終目視

在 960×540、844×390、667×375、375×667 分別檢查零死亡、首次死亡與最高援助：

- 主角、下一落點、危險、援助物件、事故簿、暫停鍵與觸控鍵不得互相遮擋。
- 零死亡不得出現事故簿或現代除錯語彙。
- 反向彩蛋應顯示「王庫退役幣 × 8」；發現後改為「清點完畢 · 面值仍零」。
- 最新畫面不能再顯示「用途：0 × 8」。
- `docs/testing/automated-reverse-easter-egg.md` 第 16 行仍有一處歷史用語「膠帶」，恢復後應改為王城木台，但不要重寫 `docs/logs/` 的歷史證據。

### P0-3：封版文件

只有 P0-1 與 P0-2 全部通過後：

1. 把 `docs/testing/SPEC-0001-acceptance-matrix.md` 的 AC-9 從「待重新驗證」更新為實際結果。
2. 新增 `docs/logs/2026-08-10-art-style-baseline.md`，記錄最終命令、測試數、bundle、瀏覽器路線與截圖尺寸。
3. 補寫 `docs/art-outsourcing/06-integration-audit.md` 的最終驗收結論。
4. 確認 SPEC-0001、SPEC-0005、MASTER、game-shell、review-index 與 acceptance matrix 沒有互相衝突。

## 下一批正式資產規格

在基線驗收完成前，不要再生成大量資產。下一批只做最小可比較樣本：

| 資產 | 畫布／幀 | 最小有效輪廓 | 其他硬條件 |
| --- | --- | --- | --- |
| 勇者 idle | 2 幀，每幀 32×48 | 高 40–44px | 每幀只可有一個角色；頭盔、紅披風、小盾；無武器剪影 |
| 勇者 run | 4 幀，每幀 32×48 | 高至少 38px | 與 idle 同比例、同輪廓、同基準線 |
| 史萊姆彈簧 | 4 幀，每幀 48×32 | 主體需填滿可讀區 | 透明背景；壓縮、發射、回彈可辨；不得只有 3–6px 高 |
| 森林 tileset | 真正 24×24 tile | 邊界可無縫拼接 | 草地、土、石、邊角與平台端點；不可把 1024 圖縮小冒充 tile |

所有樣本需同時通過：

- 非透明像素主要色盤稽核；整個世界以 24–32 個主要色為基準。
- 無半透明毛邊、無平滑縮放、無插值污染。
- 有效 bbox、基準線、透明 padding 與幀數符合規格。
- 100% 與 400% 最近鄰預覽都可讀。
- 人工審查通過前只放在 `art-generation-output/`，不得加入 `public`、manifest 或正式 build。

## 禁止事項

- 不得恢復已退件的公開主角／史萊姆 sheet。
- 不得把 C01／C03、森林 placeholder 或任何生成圖改寫成「正式核准」。
- 不得為了讓測試變綠而放寬最高援助的 21 死預期。
- 不得重新引入教材、紅筆、補考、試卷、現代 Debug 或與世界無關的通用 App 視覺。
- 不得改動物理、陷阱時序、援助門檻、保存格式或關卡幾何，除非先新增／更新已核准規格。
- 不得清理歷史日誌來掩蓋曾經的方向；應以目前 SSOT 明確 supersede。
- 未經使用者明確同意，不得 stage、commit、push、建立 PR 或發布。

## 交接完成條件

下一階段只有同時滿足以下條件，才可宣告美術基線完成：

- 最新工作樹的 typecheck、58 項以上單元測試、build 與 diff check 全部通過。
- 零援助 0 死、最高援助 21 死、反向彩蛋、保存重載與正式產物路線通過。
- 375×667 的額外死亡差異已被重現並修正，或以重複證據證明為測試環境偶發，且文件誠實記錄。
- 四種指定 viewport 的零死亡、首次死亡與最高援助都無關鍵遮擋。
- 退件 sheet 不存在於 `public` 與 `dist`，原始檔仍可追溯。
- AC-9、整合稽核與實作日誌已依實際證據更新。
- 使用者看過代表性截圖並明確允許進入下一批正式資產製作。

## 變更紀錄

| 日期 | 變更 | 證據／原因 |
| --- | --- | --- |
| 2026-08-10 | 建立暫停點交接規格 | 使用者要求停止後續處理，先依目前進度整理可接手規格 |
