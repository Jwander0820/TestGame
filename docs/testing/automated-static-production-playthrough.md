# 正式靜態產物整關自動試玩

- 狀態：開發驗證工具（已通過）
- 最後更新：2026-07-16
- 關聯規格：SPEC-0001 AC-5、AC-7

## 目的

驗證 `npm run build` 產生的 `/dist/` 本身，而不是由開發入口重新編譯的遊戲。開發測試外框以同來源 iframe 載入實際 `dist/index.html`、雜湊 CSS 與雜湊 JavaScript，透過正式標題按鈕及 window 鍵盤事件操作完整流程。

## 驗證流程

1. 在隔離的測試來源清除正式進度 key，再載入 `/dist/`。
2. 從正式標題 UI 按「開始」。
3. 持續送出 `ArrowRight`，並週期性按下／放開 `Space`；遊戲仍使用正式 `InputController`、Phaser 物理、死亡、援助與終點邏輯。
4. 首次抵達 `after-first-gap` 時暫停：
   - 按「繼續」後立即核對 checkpoint 仍為 `after-first-gap`。
   - 再次暫停並按「重來本關」，核對 checkpoint 回到 `start`。
5. 從起點繼續自動操作，直到正式結算面板出現。
6. 重新整理 `/dist/` iframe，核對正式標題顯示本題已完成及一致的死亡數。

## 通過條件

- `/dist/` 標題、遊戲與結算 UI 均可操作。
- 「繼續」不修改 checkpoint；「重來本關」只重設本關進度 marker。
- 在援助介入後仍能完成正式產物，且沒有卡死。
- 重新整理後標題顯示「再寫一次」與已完成摘要，死亡數與結算一致。
- iframe 內捕捉到的 console warning／error 均為 0。
- 測試外框、驅動器及 `playtest:static-production` 標記不存在於 `dist/`。

## 執行方式

先建立正式產物，再啟動開發伺服器：

```powershell
npm run build
npm run dev
```

開啟：

```text
http://localhost:5173/tests/browser/static-production.html
```

測試外框只負責操作同來源的 `/dist/`；實際遊戲仍由正式雜湊 bundle 執行。

## 2026-07-16 實際結果

- 連續執行兩次，皆為 `data-status="completed"`。
- 「繼續」後 marker：`after-first-gap`。
- 「重來本關」後 marker：`start`。
- 正式結算兩次皆為死亡 5 次、發現 0 個特殊事件。
- 重載後開始按鈕為「再寫一次」，摘要及死亡數均與結算一致。
- iframe 內捕捉到的 console warning／error 均為 0。
