# 首關反直覺陷阱實作與驗證

- 日期：2026-09-20，Asia/Taipei
- 規格：[SPEC-0008](../specs/SPEC-0008-learned-traps.md)
- 使用者決策：美術與台詞暫留，確保可替換，先把玩法做好。

## 本次變更

- 第一落點新增只擋頭頂的隱藏頂板。原本太早跳避開王徽會被截斷；晚一點跳能越過。撞頭本身不直接扣命，後續本段死亡才計數，重生清除歸因。
- 第二段假斷路可直接步行，承重後顯形；跳躍路線有空中伏擊。碰到後顯形並記一次事故。
- 第三次第一段失敗撤頂板；第五次撤王徽。第三次第二段失敗顯路；第五次撤空中伏擊。沿用舊援助 ID／門檻，既有存檔無需遷移。
- 王徽原 `landing-ambush` 死亡自這版開始歸入 `first-gap`；歷史死亡與舊 blocker 記錄不重算，不改存檔版本。新的死亡才累積新歸屬。
- 新機關以不可見 Zone 作碰撞，visuals 工廠單獨畫外觀。純規則不依賴 Phaser。場景／機關台詞集中至 `levelOneCopy.ts`，死因台詞至 `levelOneDeaths.ts`；保留原文。其餘援助／結算文字、場景標籤與 DOM 選單維持各自內容入口。
- 更新已知解法的起跳位置，假斷路改走路；保留原始直覺操作為另一個回歸 fixture，驗證確實中招且最後援助通關。
- 正式產物測試補上保存原始進度及結束／離頁還原，避免測試清除玩家紀錄。

## 技術檢查

`npm.cmd run check`：16 檔 67 tests 通過，含瀏覽器工具型別檢查，正式 build 通過。後續修改正式產物 fixture 的保存還原，再跑 typecheck 通過。主 bundle 約 1,435 kB／gzip 378 kB，既有 >500 kB 警告仍在。

新增測試覆蓋：死亡／重生歸因、線索恢復、援助冪等與順序、混合第一段事故共用門檻、第三與第五次空中伏擊援助、假斷路支撐範圍與頭頂淨空。

## 實際瀏覽器結果

使用 Vite 本機服務及真正 Phaser／Arcade 物理。測試驅動器只透過 ActionState 操作，不瞬移角色。

| 入口 | 結果 |
| --- | --- |
| trap-learning.html | completed，8 死：hidden-ceiling-bait 3、jumped-at-false-gap 5；3 個援助後通關 |
| zero-assist.html | completed，0 死 |
| max-assistance.html | completed，保持預置 21 死、9 個援助，無新增死亡 |
| progress-reload.html | 真正 reload；恢復 after-first-gap、14 死、6 個援助；14 死完成，console 0 警告／錯誤 |
| reverse-easter-egg.html | 完成反向探索、真正 reload、彩蛋不重播、折返主線 0 死；console 0 警告／錯誤 |
| trap-learning.html，375×667 | completed，同樣 8 死（撞頂板 3、空中伏擊 5）後通關 |
| static-production.html，1280×900 | 真實鍵盤事件操作 dist；8 死完成，checkpoint 繼續／重玩／結算／真正 reload 保存皆通過，console 0 警告／錯誤；originalProgressRestored=true |

手機尺寸結果截圖保留於忽略的 `output/gameplay-traps/mobile-trap-learning.png`。`git diff --check` 通過。桌面 trap-learning／零死／最高援助測試使用原預覽視窗；375×667 與正式產物 1280×900 由 viewport 工具明確指定。沒有用手機 viewport 取代真實觸控驗收。

## 限制

美術與文字是暫留素材，不宣稱品質已核准。真人初見的惡意感、理解陷阱的速度及真實手機多指手感仍需使用者試玩。寶箱追逐、假終點連環戲等不在本次切片。沒有提交或發布。
