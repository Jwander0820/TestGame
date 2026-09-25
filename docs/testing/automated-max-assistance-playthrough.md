# 最高援助整關自動試玩

- 狀態：開發驗證工具
- 最後更新：2026-09-24
- 關聯規格：SPEC-0001 AC-4、SPEC-0002、SPEC-0015

## 用途

本測試先使用正式同情導演產生：

- `first-gap` 連續死亡 7 次。
- `warning-strip` 連續死亡 7 次。
- `intern-bridge` 連續死亡 7 次。
- 九個持久世界效果：第一坑三階物理援助、認證步道三階物理援助、安全橋三階物理援助。

接著將狀態回到本關起點，建立全新 Phaser 場景。SPEC-0015 會將三段最高援助還原為全程紅毯，停用舊高台與危險物；RightOnlyDriver 從起點到終點只送出向右指令，完全不注入跳躍。

## 執行方式

```powershell
.\play-local.cmd
```

開啟：

```text
http://localhost:5173/tests/browser/max-assistance.html
```

通過條件：

- `data-status="completed"`。
- `data-deaths="21"`，表示測試期間沒有新增死亡。
- 終點訊息回報全程紅毯通關。
- console 無 error／warning。

## 正式產物隔離

`max-assistance.html`、驅動器與 `playtest:right-only` 標記不得出現在 `dist/`。此頁只驗證援助碰撞與保存重建，不是正式遊戲的作弊入口。

`final-mercy.html?case=fresh` 從零死亡開始只按右，驗證所有死因合計 21 次後通關；`?case=left` 反覆往左跳出世界 21 次，再只按右；`?case=reload` 預先建立 20 死與古橋據點，實際第 21 死後保存重載，再只按右通關。`?case=audit` 驗證回頭查票精確 5 死後退休。
