# 正式產物原地等待彩蛋自動驗證

- 狀態：開發驗證工具（已通過）
- 最後更新：2026-07-16
- 關聯規格：SPEC-0002 原地等待彩蛋、AC-9

## 目的

以正式 `/dist/` 驗證原地等待不是單純的假時鐘邏輯：瀏覽器焦點、Phaser 更新、角色落地、真實 8 秒門檻、localStorage 保存及重載後的一次性行為都必須同時成立。

## 驗證流程

1. 在隔離來源清除正式進度 key，iframe 載入 `/dist/` 並從標題開始。
2. 角色落地且沒有輸入時先等待約 4 秒，尚不得觸發。
3. 將焦點移到測試外框超過 8 秒：
   - iframe `document.hasFocus()` 必須為 false。
   - `idle-apology` 不得因背景時間而被發現。
4. 重新聚焦遊戲舞台：
   - 需重新累積約 8 秒才觸發。
   - 狀態文字為「你是在等遊戲先道歉嗎？」。
   - 保存中只新增一次 `idle-apology`，死亡及援助不變。
5. 重新整理正式 iframe，再等待超過 8 秒：
   - 保存仍包含唯一一筆 `idle-apology`。
   - 不重播完整彩蛋文字。

## 通過條件

- 背景等待超過門檻仍未發現彩蛋。
- 回復焦點後觸發耗時至少 8 秒，且小於測試逾時上限。
- 首次觸發的死亡數為 0，沒有建立關卡死亡或援助。
- 重載後彩蛋 ID 仍只出現一次，狀態文字不重播。
- iframe 內捕捉到的 console warning／error 均為 0。
- 測試外框與 `playtest:idle-easter-egg` 標記不存在於 `dist/`。

## 執行方式

```powershell
npm run build
npm run dev
```

開啟：

```text
http://localhost:5173/tests/browser/idle-easter-egg.html
```

## 2026-07-16 實際結果

- 修正測試碼表起點後，完整流程連續執行兩次皆通過。
- 背景等待 8.5 秒後，`idle-apology` 仍未出現。
- 回復焦點後分別於 8,108ms 與 8,034ms 偵測到首次彩蛋。
- 首次狀態文字為「你是在等遊戲先道歉嗎？」。
- 首次與重載後保存中的 `idle-apology` 數量皆為 1。
- 重載後再次等待 8.5 秒，狀態維持基本操作提示，未重播彩蛋文字。
- 全程死亡 0、active assists 0、console warning／error 0。
