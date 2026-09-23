# 終點碰撞與遊玩介面驗證

- 日期：2026-09-23
- 規格：[SPEC-0013](../specs/SPEC-0013-goal-collision-and-ux.md)
- 狀態：本機實作與技術驗證完成，待真人試玩；未提交。

## 根因與實作

舊 createGoalAmbush 只有 tween，沒有傷害碰撞體；onComplete 只以玩家中心 x 範圍和 y ≥ 310 判定。實際 Phaser 重現舊路線 17 幀矩形重疊、最終仍零死亡。首次重疊玩家 x=2686、y=294.375，印章 y≈238.70。先前零死亡通關證據不能證明落下判定正確。

新 GoalStampState 使用相對移動矩形掃掠判定，按預告／下落／停留的時間邊界拆段。圖形與判定共用 76×84 尺寸；下落從 y=125 到 y=376，底部與地表 y=418 對齊。下落、空中接觸和邊緣都能命中，預告與退場不傷害。

新增右移 80px 的補蓋；各預告 200ms、落下 460ms、停留 220ms，第二輪於觸發後 1020ms 開始。未命中而死於其他機關時重設；首次印章死亡後撤除並沿用終點前移。最高橋段援助也撤除，保存版本及門檻不變。

介面加入安全據點階段、固定高度死亡／援助訊息、手機全頁暫停選單。遊戲輸入在選單停用，不攔截原生按鈕空白鍵；失焦／切分頁自動暫停。gameShell.ts 接受保存介面，正式入口用 localStorage，shell-review 使用記憶體並重用 index.html，避免測試更動正式進度。

## 本次證據

- npm.cmd run check：22 檔 98 項測試、型別、build 通過。涵蓋空中／邊緣／大時間步／相對移動／兩次攻擊／撤除重設、選單輸入與引招路線；移除舊「中心點跳高即安全」假設。
- 最終文案調整後另跑 build 通過：index-BJdcKT2e.js 約 1452.86 kB、gzip 383.56 kB；Phaser 超過 500 kB 是既有建置警告。
- goal-collision 舊操作：修正後精確 goal-approval-stamp 1 次，再通關。
- second：第一輪結束後過早前進，被補蓋命中 1 次，再通關；命中前幀 x=2766、y≈262.29，包含身體邊緣。
- pause：暫停 700ms 遊戲時間不變，恢復後 0 死通關。
- reload：首次落印死亡後以測試專用 sessionStorage 保存重載，restored=true、死因仍 1 次，再通關，不使用正式保存 key。
- zero-assist：最後高台引完兩招後跳躍，0 死通關。max-assistance：維持 21 死原紀錄通關。
- 正式 dist 於獨立 4179 origin 冒煙驗證：空白鍵開始、暫停通過；console warning/error 為 0。未宣稱正式產物整關實機驗證。
- 桌面及固定 iframe 375×667、667×375、844×390、960×540 已目視。直向三鍵 64px 高，下緣約 478.5px；橫向三鍵 60px 高，667×375 下緣 365px。375×667 暫停按鈕 56px 高、下緣約 444px；667×375 最底按鈕約 306px。控制位於地表下方安全帶，角色與下一必要落點可見。
- 原生按鈕空白鍵：開始、暫停、返回旅程皆可操作。最高援助介面也已目視，但不是四尺寸全部狀態排列的完整矩陣。
- 截圖：.playwright-cli/spec0013-mobile-pause.png、spec0013-landscape.png、spec0013-wide.png、spec0013-desktop-max.png，保留不提交。
- git diff --check 通過；原有 .playwright-cli/ 保留。

## 限制與入口

瀏覽器尺寸覆寫未改變 innerWidth，改用固定 iframe；不能宣稱真機。真人初見、實際多指操作仍待試玩。舊手機 fixture 的 MutationObserver 問題未列為已修正事項。

移動落印常數到 content 模組時，熱重載曾短暫出現舊模組匯出錯誤；更新 import 並重新載入後路線正常通關。正式產物冒煙驗證使用文案調整前的 index-B_rqec63.js，最後只替換死亡備用文案並重建。

`/tests/browser/shell-review.html?state=goal` 提供正式介面城門試玩；`art-review.html` 新增「終點連續落印」；`mobile-review.html?case=shell` 為 375×667，可加 size=landscape／wide／desktop。
