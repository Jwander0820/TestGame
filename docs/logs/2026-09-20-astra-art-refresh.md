# Astra 工作入口與像素奇幻重整

- 狀態：實作與技術驗證完成，美術待使用者驗收
- 日期：2026-09-20（Asia/Taipei）
- 規格：[SPEC-0007](../specs/SPEC-0007-astra-art-refresh.md)

## 開發流程

新增根 README、STATUS 與 development，縮短 AGENT 並保留完整前版於 archive。SPEC-0006 保留為歷史快照，明確連到本次恢復範圍。沒有更換模型設定、套件或遊戲引擎。

新增 npm.cmd run check，將 tests/browser 加入 TypeScript 範圍。原先未檢查的 idle-easter-egg 與 static-production 有 DOM 空值捕捉及 iframe Window 全域型別問題；以共用 requireTestElement／getTestFrameWindow 修正，沒有改變路線或放寬通過條件。

## 美術

原創矩陣騎士取代方塊占位角色，增加行走／跳躍顯示姿態；維持 32×48 貼圖與原 body 尺寸。森林、城堡、遺跡與地表使用共用 PixelPainter，標題以 Canvas 重用相同資料。平台頂面仍為原 y - 12，54px 視覺層中心為 y + 15。

天空／森林色盤降低飽和度，MASTER 同步。地表取消執行時 atlas 請求，改為固定尺度重複鋪設；舊 public 森林檔仍保留且會被 Vite 複製，不冒稱已從 dist 移除。

外框減輕邊框／徽章，桌面依視窗高度限制舞台；手機開始與暫停按鈕最小 56px。檢查時發現直向暫停面板溢出與橫向死亡數對比不足，分別省略次要裝飾及補上深色底修正。

新增 /tests/browser/art-review.html，使用記憶體進度切換 0／1／21 死的場景，不讀寫正式存檔。此頁呈現「載入該進度的場景」，不等於實際死亡動畫或 DOM 選單。

## 自動驗證

- 改動前：14 個測試檔、58 項測試、typecheck、build 通過。
- 改動後 npm.cmd run check：15 個測試檔、60 項測試，全 src／tests/browser 型別檢查及 build 通過。
- 正式 JS 約 1,430.27 kB、gzip 376.69 kB；仍有既有 Phaser 大於 500 kB 警告。
- 正式 JS 搜尋未含美術檢視種子、零援助／最高援助驅動器；dist 未包含測試 HTML，也未恢復退件主角／史萊姆。
- git diff --check 通過；Git 的 LF／CRLF 提示非錯誤。

## 本次瀏覽器證據

| 路線 | 結果 |
| --- | --- |
| zero-assist | completed，0 死 |
| max-assistance 桌面 | completed，21 死，三種原始死因各 7 |
| max-assistance 375×667 | completed，21 死；本次未重現額外 landing-stamp-ambush |
| progress-reload | completed，保留預載 14 死並完成 |
| reverse-easter-egg | completed，0 死 |
| static-production | completed；完成、暫停、重玩、reload 通過；首次跑 12 死，最終建置複跑 8 死，兩次 console warning/error 皆 0（此路線沒有固定死亡數要求） |
| idle-easter-egg | completed；背景等待未觸發、恢復後約 8.1 秒觸發、reload 不重播；0 死、0 援助，console warning/error 皆 0 |

HMR 搬移 graphicsPainter 期間曾出現舊模組匯出錯誤，完整重載後恢復；不能把舊 tab 累積日誌誤報成最終產物錯誤。

## 視覺證據與限制

output/art-refresh/（忽略追蹤）包含四種 viewport 的 zero／first／max 截圖，以及正式外框 title／play、直向 pause、桌面 desktop-title。960×540、844×390、667×375、375×667 的正式舞台維持 16:9、無水平溢出，開始按鈕 56px；直向三鍵位於舞台下方，橫向控制保留拇指安全區。實際查看了代表性截圖，修正後選單操作可達。

舊 375×667 的 22 死只在本次一次通關未重現，沒有修改預期，也不能據此宣稱根因已消除。真人鍵盤／多點觸控與美術滿意度仍待使用者試玩。本輪完成第一版重整，不標示最終美術已核准。

未 stage、commit、push、發布；.playwright-cli/ 與 art-generation-output/ 保留。
