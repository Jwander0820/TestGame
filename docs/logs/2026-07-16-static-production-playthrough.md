# 2026-07-16：正式靜態產物整關與暫停進度修正

## 稽核發現

準備 SPEC-0001 AC-7 正式產物驗收時，檢查主介面事件接線發現：

- 「繼續」錯誤呼叫 `restartLevel`，會把保存的 checkpoint 改回 `start`。
- 「重來本關」只重啟場景，反而沒有呼叫 `restartLevel`；若已有 checkpoint，場景會從該 checkpoint 建立角色，而不是本關起點。

這兩個行為與 FR-5 相反。修正方式是將同一個既有的 `restartLevel` 呼叫從 `resumeGame` 移到 `restartGame`，沒有改變進度資料格式。

## 正式產物驗證方式

- 執行 `npm run build` 產生 `dist/index.html` 與雜湊 CSS／JavaScript。
- 開發測試外框以同來源 iframe 載入 `/dist/`，遊戲使用正式 bundle 而非開發入口。
- 外框從正式標題按鈕開始，向 iframe window 送出 `ArrowRight` 與按下／放開 `Space` 的鍵盤事件。
- 實際遊戲仍使用正式 `InputController`、Phaser 物理、死亡、同情導演、UI 與保存流程。

## 暫停／重玩回歸結果

首次到達 `after-first-gap` 後：

1. Escape 暫停並按「繼續」，同步保存 marker 仍為 `after-first-gap`。
2. 再次 Escape 暫停並按「重來本關」，同步保存 marker 變為 `start`。
3. 自動鍵盤路線從起點重新開始並繼續完成，證明場景與輸入未卡死。

## 正式整關結果

- 同一流程連續執行兩次，皆成功顯示正式結算面板。
- 兩次均死亡 5 次，結算文字為「死亡 5 次，發現 0 個特殊事件。沒有能力評級。」
- 結算後真正重新整理 `/dist/` iframe，正式標題顯示「再寫一次」。
- 重載摘要為「本題已完成，累積死亡 5 次。可以再寫一次。」
- 重載死亡票券仍為 5。
- iframe 捕捉到的 console warning／error 均為 0。

## 驗收判斷

- FR-5 的「繼續」與「重來本關」現在各自符合保存語意。
- AC-7 已覆蓋正式建置、靜態子路徑載入、完整關卡、結算、正式 localStorage 與重載流程，可標記自動整合通過。
- AC-1 仍保留真人鍵盤試玩，因自動 window 鍵盤事件不能替代操作手感、完成時間與死亡分布資料。
