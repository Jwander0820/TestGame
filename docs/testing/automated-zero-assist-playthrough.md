# 零援助整關自動試玩

- 狀態：開發驗證工具
- 最後更新：2026-07-16
- 關聯規格：SPEC-0001 AC-1、AC-4、AC-8

## 用途

本測試透過正式 `ActionState` 持續按住右方向，並只在預先定義的平台起跳區間送出跳躍按下／放開。角色仍使用正式 Phaser Arcade Physics、碰撞、死亡、checkpoint 與終點邏輯。

它能證明零援助路線在實際遊戲迴圈中可完成，不只是在幾何公式上可達；但它不驗證實體鍵盤手感、真人反應時間或真實手機多點觸控，因此不能取代 AC-1／AC-2 的真人驗收。

## 執行方式

先啟動開發伺服器：

```powershell
.\play-local.cmd
```

再開啟：

```text
http://localhost:5173/tests/browser/zero-assist.html
```

頁面輸出狀態：

- `data-status="completed"`、`data-deaths="0"`：零援助通過。
- `data-status="completed-with-deaths"`：抵達終點，但路線失誤造成死亡。
- `data-status="timeout"`：20 秒內未抵達終點。

## 正式產物隔離

- Vite 正式建置仍只以根目錄 `index.html` 為入口。
- `tests/browser/zero-assist.html` 不會出現在 `dist/`。
- 零援助驅動器只由測試頁匯入；正式 bundle 不含 `playtest:zero-assist` 標記。
