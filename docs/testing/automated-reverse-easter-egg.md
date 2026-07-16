# 反向零價值金幣實際碰撞整關驗證

- 狀態：開發驗證工具（已通過）
- 最後更新：2026-07-16
- 關聯規格：SPEC-0001 Beat 1、AC-8

## 目的

證明反向彩蛋不只在幾何公式與畫面中存在：玩家輸入必須能穿過單向平台底面、依序落在兩層膠帶、觸發 8 枚零價值金幣，再離開彩蛋區完成正式主線。

## 實際碰撞流程

1. 在隔離的真實 `localStorage` 建立全新進度，啟動實際 Phaser 場景。
2. 開發專用驅動器只讀取每幀公開的 `x`、`y` 與 `grounded`：
   - 起點確實落地後才送出左移與第一次跳躍。
   - 到達第一層膠帶水平範圍後放開左方向。
   - 實際落在 `reverse-step` 後才送出第二次跳躍。
   - 進入 `reverse-cache` 高度後轉向右側主路線。
3. 核對首次狀態文字、`reverse-zero-coins` 保存筆數、死亡及援助。
4. 首次發現後真正重新整理測試頁，以全新 `ProgressStore` 與場景讀回保存。
5. 驅動器第二次實際走過彩蛋平台後折返，依主路線跳躍區完成正式場景終點；完整吐槽不得重播，彩蛋 ID 不得重複。

## 通過條件

- 第一次反向路線在沒有死亡及援助下觸發。
- 首次狀態文字為「你特地往左找到了 8 枚沒有用途的金幣。很會。」。
- 保存中的 `reverse-zero-coins` 恰好一筆。
- 重載後仍能第二次進入彩蛋區、回到主線並完成正式場景終點。
- Navigation Timing 必須回報 `reload`，全新 store 中彩蛋保持一致。
- 第二次進入彩蛋區不重播完整狀態文字，彩蛋 ID 仍只有一筆。
- 頁面捕捉到的 console warning／error 均為 0。
- 測試外框及 `playtest:reverse-easter-egg` 標記不存在於 `dist/`。

## 執行方式

```powershell
npm run build
npm run dev
```

開啟：

```text
http://localhost:5173/tests/browser/reverse-easter-egg.html
```

正式 `dist` 的零彩蛋主路線、結算與保存另由 `automated-static-production-playthrough.md` 驗證；本頁專注於無法由 DOM 觀察的秘密平台實際碰撞，不把開發驅動器打進正式 bundle。

## 2026-07-16 實際結果

- 幀驅動版本完整流程連續執行兩次，皆為 `data-status="completed"`。
- Navigation Timing 回報 `reload`，證明第二段由真正頁面重載開始。
- 首次觸發：死亡 0、active assists 0、`reverse-zero-coins` 1 筆，狀態文字正確。
- 重載後驅動器再次抵達秘密平台高度，完整吐槽次數為 0。
- 最終主線完成：死亡 0、active assists 0、彩蛋仍為 1 筆。
- console warning／error 均為 0。

最初曾嘗試以正式 iframe 加牆鐘延遲送出兩次鍵盤跳躍；三次中只有一次成功，因瀏覽器排程無法證明按鍵恰好落在物理落地幀，故淘汰此方法，不列為驗收證據。正式產物本身已有獨立完整整關驗證。
