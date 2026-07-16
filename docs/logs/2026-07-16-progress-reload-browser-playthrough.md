# 2026-07-16：瀏覽器保存重載整關驗證

## 驗證目標

補齊 SPEC-0001 AC-5 的瀏覽器證據：保存不能只在同一個 JavaScript 執行個體或記憶體假物件中成立，頁面真正重新整理後仍需載入可玩的 checkpoint 狀態。

## 隔離方式

- 測試頁透過命名空間包裝的 `window.localStorage` 寫入測試專用 key。
- `ProgressStore` 仍以正式 `pity-platformer:progress` 邏輯 key 讀寫，但包裝層將它映射到測試命名空間。
- 不讀寫玩家在主頁使用的正式進度 key。
- 測試完成或逾時後刪除測試進度；頁面重載階段標記只使用 `sessionStorage`。

## 實際流程

1. 正式同情導演建立 14 次死亡、兩區 tier 4、六個持久援助及 `after-first-gap` checkpoint。
2. 全新 `ProgressStore` 將狀態寫入瀏覽器保存。
3. 測試頁呼叫 `window.location.reload()`。
4. 重載後建立另一個 `ProgressStore`，確認 Navigation Timing 為 `reload`，並核對所有保存欄位。
5. 全新 Phaser 場景從 checkpoint 建立角色、還原援助，再由正式 ActionState 驅動完成後半關。

## 結果

- 重載前後總死亡均為 14。
- 還原 marker 為 `after-first-gap`、順序為 1、援助數為 6。
- 終點 marker 為 `goal` 且 completed 為 true。
- 路線中沒有新增死亡。
- 頁面捕捉到的 console warning／error 均為 0。
- 流程重複執行仍得到相同結果。

## 判斷

AC-5 的保存、真實頁面重載、全新 store／場景重建及可繼續完成，已有端到端自動證據。真人仍可檢查正式主頁的繼續摘要文案，但不再是保存正確性或可玩性的驗收缺口。
