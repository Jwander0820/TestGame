# 保存重載整關自動試玩

- 狀態：開發驗證工具（已通過）
- 最後更新：2026-07-16
- 關聯規格：SPEC-0001 AC-5

## 目的

證明保存行為不只在記憶體或單元測試中成立：瀏覽器必須把正式 v2 進度寫入 `localStorage`，經真正的頁面重新整理後建立全新 `ProgressStore` 與 Phaser 場景，並從保存的 checkpoint 繼續完成關卡。

## 初始狀態

測試透過正式同情導演建立以下狀態：

- 總死亡 14 次。
- `first-gap` 與 `warning-strip` 各解鎖 tier 2／3／4，共六個持久援助。
- checkpoint 為 `after-first-gap`，順序為 1。
- 關卡尚未完成。

測試使用命名空間包裝的真實 `window.localStorage`，不得讀寫正式的 `pity-platformer:progress` key。

## 驗證流程

1. 首次載入時建立上述狀態並寫入隔離的瀏覽器保存 key。
2. 測試頁呼叫真正的 `window.location.reload()`。
3. 重載後以全新 `ProgressStore` 讀回狀態，並在 DOM 回報導覽類型及還原欄位。
4. 全新 Phaser 場景應由 `after-first-gap` 出生，還原六個援助。
5. 驅動器使用正式 `ActionState` 與碰撞完成後半關。

## 通過條件

- Navigation Timing 回報 `reload`。
- 還原時死亡為 14、checkpoint 為 `after-first-gap`、順序為 1、持久援助為 6。
- 終點狀態為完成、checkpoint 為 `goal`。
- 完成時死亡仍為 14，測試過程沒有新增死亡。
- console 無 error／warning。
- 測試頁、測試儲存 key 字串與驅動器標記皆不得進入正式 `dist`。

## 執行方式

啟動開發伺服器後開啟：

```text
http://localhost:5173/tests/browser/progress-reload.html
```

本頁會自動保存、重新整理並繼續試玩，不需要人工操作。

## 2026-07-16 實際結果

- 實際導覽類型：`reload`。
- 還原欄位：死亡 14、`after-first-gap`、順序 1、六個持久援助、未完成。
- 後半關完成欄位：死亡 14、`goal`、已完成。
- 頁面捕捉到的 console warning／error 均為 0。
- 相同流程重複執行仍通過。
