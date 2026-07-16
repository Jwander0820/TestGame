# 2026-07-16：零援助瀏覽器整關完成

## 背景

先前的關卡幾何測試可證明平台間距小於理論跳躍範圍，但無法覆蓋 Phaser 實際固定時間步進、碰撞、落地判定、checkpoint 與終點 overlap。

## 本次處理

- 新增可選 `PlaytestDriver` 介面；正式遊戲未提供驅動器時完全沿用玩家輸入。
- 建立開發專用 `ZeroAssistDriver`，持續透過正式 `ActionState` 按住右方向，並在四個起跳區間送出跳躍 edge。
- 建立 `tests/browser/zero-assist.html`，使用記憶體保存，避免污染玩家 localStorage。
- 測試頁以 DOM `data-status` 與 `data-deaths` 提供可讀的完成證據，20 秒未完成則明確 timeout。

## 驗證結果

- 實際瀏覽器 Phaser 遊戲迴圈在 12 秒觀察窗內抵達終點。
- 結果：`data-status="completed"`、`data-deaths="0"`。
- 終點訊息：世界總共心軟 0 次，證明沒有依賴任何援助。
- 瀏覽器 console：無 error／warning。
- `npm test`：6 個測試檔、25 項測試全數通過。
- `npm run build`：TypeScript 與 Vite 正式建置通過。
- `dist/tests/browser/zero-assist.html` 不存在；正式產物也找不到 `playtest:zero-assist` 驅動器標記。

## 驗收判斷

此結果將 AC-1、AC-4、AC-8 的「路線與遊戲迴圈可完成」證據提升為實際整合測試，但仍不等於真人只用鍵盤完成，也不覆蓋真實觸控裝置。SPEC-0001 維持已核准／驗收中。
