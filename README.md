# 遊戲開始心軟了

一款會因玩家反覆死亡，逐漸用世界內的荒謬事件作弊幫忙的像素奇幻平台遊戲。Vite + TypeScript + Phaser，純靜態網站。

## 開始開發

需要 Node.js `^20.19.0 || >=22.12.0` 與 package.json 指定的 pnpm。依鎖檔安裝：

```powershell
pnpm install --frozen-lockfile
npm.cmd run dev -- --host 127.0.0.1
```

Windows 可直接執行 [play-local.cmd](play-local.cmd) 試玩。npm.cmd 避免 PowerShell 的 npm.ps1 執行限制；依賴仍以 pnpm-lock.yaml 為準，不新增第二份 lockfile。

```powershell
npm.cmd run check
git diff --check
```

check 依序執行單元測試、涵蓋 src 與 tests/browser 的型別檢查、正式建置，任一步失敗即停止。小修改仍可使用 typecheck／test／build 個別命令。

## 接手入口

先讀 [工作守則](docs/AGENT.md) → [目前狀態](docs/STATUS.md)，再依工作讀一份相關規格。文件完整索引在 [docs/README.md](docs/README.md)，Astra 協作說明在 [開發方式](docs/development.md)。

## 模組地圖

| 路徑 | 責任 |
| --- | --- |
| src/main.ts、index.html、src/styles.css | DOM 選單、外框、輸入連接與狀態呈現 |
| src/game/content/ | 關卡資料、幾何與視覺 token |
| src/game/sympathy/ | 純資料援助規則，不依賴 Phaser |
| src/game/session/、state/ | 進度交易、保存、生命週期 |
| src/game/scenes/ | Phaser 場景及世界效果 |
| src/game/visuals/ | 可重建的角色、地表與景物美術 |
| tests/browser/ | 可重現的整關測試入口，不進正式 bundle |
| art-generation-output/ | 過去美術試作／退件來源，並非正式資產 |
| docs/ | 規格、決策、來源、驗收與歷史 |

不因整理目錄搬動穩定邏輯；按責任邊界修改。模型設定在 Codex 管理，遊戲本身不需要 API 金鑰。

## 玩法與素材替換

目前持續增加玩法與對話，美術仍待驗收。左上方可探索不影響結局的[工務處施工後台](docs/specs/SPEC-0021-backstage-maintenance-room.md)，試玩與驗證入口見[後台驗證](docs/testing/automated-backstage.md)。最新的重槌補點名、關卡／工務處／勇者接話見 [SPEC-0020](docs/specs/SPEC-0020-encore-and-dialogue.md)。首關的隱藏頂板與假斷路見 [SPEC-0008](docs/specs/SPEC-0008-learned-traps.md)；金幣誘餌、第一坑空氣磚與向上攻擊見 [SPEC-0009](docs/specs/SPEC-0009-coin-and-pit-ambush.md)。

| 要修改 | 入口 |
| --- | --- |
| 陷阱幾何、援助解除對應 | src/game/content/levelOneTraps.ts |
| 發現、重生、解除規則 | src/game/state/LearnedTrapState.ts |
| 陷阱碰撞接線 | src/game/scenes/levelOne/LearnedTraps.ts |
| 陷阱外觀 | src/game/visuals/learnedTrapVisuals.ts，外觀沒有碰撞體 |
| 第一坑與金幣機關 | content/firstPitAmbush.ts、state/FirstPitState.ts、scenes/levelOne/FirstPitAmbush.ts、visuals/firstPitVisuals.ts（皆位於 src/game） |
| 後半段連環陷阱 | content/rearGauntlet.ts、state/RearGauntletState.ts、scenes/levelOne/RearGauntlet.ts、visuals/rearGauntletVisuals.ts（皆位於 src/game） |
| 幾何史萊姆原型 | content/levelOneSlimes.ts、state/SlimeState.ts、scenes/levelOne/SlimeEnemies.ts、visuals/slimePrototypeVisuals.ts（皆位於 src/game） |
| 終點二連落印 | content/goalStamp.ts、state/GoalStampState.ts、scenes/levelOne/GoalStamp.ts（皆位於 src/game）；矩形圖形與傷害共用位置尺寸 |
| 遊戲介面 | src/gameShell.ts；src/main.ts 提供正式保存，測試入口提供獨立記憶體保存 |
| 場景、彩蛋、機關文字 | src/game/content/levelOneCopy.ts |
| 死亡文字 | src/game/content/levelOneDeaths.ts |
| 援助、結算文字 | src/game/content/levelOne.ts |
| 說話者、路上接話、死因提示 | src/game/content/levelOneDialogue.ts；閱讀時間與打斷規則在 state/DialogueQueue.ts |
| 角色／場景／色盤 | src/game/visuals/heroPixels.ts、forestPainting.ts、content/levelOneVisuals.ts |

換文案只修改文字，不更動 causeId／blockerId／effectId；換陷阱圖片沿用獨立 Zone 的幾何，不從圖片大小推導碰撞。角色圖以現行 32×48 畫布為接入契約，碰撞另由 levelOneLayout 設定。

開發伺服器的 `/tests/browser/trap-learning.html` 會以直覺操作反覆中陷阱，檢查 3 次撞頂板、5 次空中伏擊後援助通關；`zero-assist.html` 則執行已知零死解法。兩者使用測試記憶體保存，不影響正式進度。

`/tests/browser/pit-malice.html` 分別驗證直覺跳坑、晚跳撞空氣磚、停留貪金幣與空中暫停。零死路線會先在岸邊引出攻擊，再跨第一坑；金幣接觸後需盡快離開。`art-review.html` 已提供即時死亡／反應訊息與觸控三鍵，可用零死亡狀態試玩新版，保留舊 URL。

## 美術檢視

[SPEC-0015](docs/specs/SPEC-0015-return-audit-and-red-carpet.md) 新增「回頭查票」：據點後往左跳會招來退件章，位置鎖定、可掉頭躲開，回程區段第 5 次死亡撤除。往左出界或回到據點後方落坑有獨立死因與反應。本關各種死亡合計 21 次後，工務處退休所有陷阱、高台停止碰撞、整關鋪出同高紅毯，只需持續向右走，無需跳躍；保存／重玩保留，重新開始全新旅程才清除。舊三段最高援助存檔直接適用。

`shell-review.html?state=slimes` 可從林間據點往左跳試查票；`shell-review.html?state=max` 可直接體驗紅毯。`final-mercy.html?case=fresh|left|audit|reload` 與 `max-assistance.html` 驗證真實 Phaser 死亡累積、退件章、重載及只向右通關，皆使用獨立測試保存。

後半段五種連環機關見 [SPEC-0010](docs/specs/SPEC-0010-rear-gauntlet.md)；`/tests/browser/rear-gauntlet.html` 可重現各死因、援助解除、暫停與重載。`art-review.html` 的「後半段零援助」可直接試玩新增區段。

[SPEC-0011](docs/specs/SPEC-0011-second-wave-malice.md) 增加飛行物回頭追擊與最後高台的延遲重槌；橋上需補跳，重槌落點需及時離開。後段第 3 次援助揭露線索，第 5 次撤除兩招。`rear-gauntlet.html?case=returnSweep`／`?case=restHammer` 驗證各自死因；`?case=returnPause`／`?case=hammerReload` 驗證暫停與保存。加上 `&review=1` 可暫停在新機關畫面，再按「繼續驗證」。`/tests/browser/mobile-review.html` 提供真正 375×667 的 iframe 試玩與回歸入口，使用獨立測試進度。

[SPEC-0012](docs/specs/SPEC-0012-slime-prototypes.md) 增加起點方塊突進史萊姆與第一坑後的圓形跟跳史萊姆，依使用者要求只用幾何佔位圖形。接觸會受傷，沒有踩怪或戰鬥。後續 [SPEC-0014](docs/specs/SPEC-0014-slime-fake-rest.md) 加入假睡：方塊攤平後回頭追撞，圓形落地後向前補跳，需躲完兩招才真正休息。對應區段第 5 次死亡援助會讓牠永久「奉命休息」。`art-review.html` 選「零死亡」可試方塊，選「圓形史萊姆區」可直接試跟跳；`shell-review.html?state=slimes` 使用正式介面直接試圓形區。`slime-malice.html?case=revengeCharger|revengeJumper|revengePause|revengeReload` 驗證新死因、暫停與援助重載，`mobile-review.html` 提供對應手機框與截圖入口。測試頁使用獨立進度。

開發伺服器啟動後開啟 `/tests/browser/art-review.html`，可切換零死亡、首次死亡與最高援助。它使用記憶體進度，可用方向鍵試玩，不讀寫正式存檔。美術來源與狀態見 [原創美術紀錄](docs/art-outsourcing/07-original-pixel-refresh.md)。

第三批素材已進入標題與可玩首關：森林、騎士、草土地表、史萊姆、王冠金幣及王城入口；陷阱、援助與 UI 仍用可替換程式圖。來源與待清稿處見[第三批素材盤點](docs/art-outsourcing/08-third-batch-review.md)及[可玩素材紀錄](docs/art-outsourcing/09-third-batch-gameplay.md)。

[SPEC-0013](docs/specs/SPEC-0013-goal-collision-and-ux.md) 修正終點印章下落與邊緣碰撞，加入右側補蓋。最後高台先引完兩招再跳；首次中印章後仍撤除並移近終點。`/tests/browser/shell-review.html?state=goal` 使用正式介面從城門據點試玩，但不動正式存檔。省略參數從入口開始，`?state=max` 試最高援助。手機框 `mobile-review.html?case=shell` 支援 `size=landscape|wide|desktop`；`goal-collision.html?case=rush|second|pause|reload` 驗證精確死因、暫停與保存重載。
