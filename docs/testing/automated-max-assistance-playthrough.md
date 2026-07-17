# 最高援助整關自動試玩

- 狀態：開發驗證工具
- 最後更新：2026-07-17
- 關聯規格：SPEC-0001 AC-4、SPEC-0002

## 用途

本測試先使用正式同情導演產生：

- `first-gap` 連續死亡 7 次。
- `warning-strip` 連續死亡 7 次。
- `intern-bridge` 連續死亡 7 次。
- 九個持久世界效果：第一坑三階物理援助、認證步道三階物理援助、安全橋三階物理援助。

接著將狀態回到本關起點，建立全新 Phaser 場景，確認保存狀態能重建所有援助物件，並由驅動器實際使用膠帶橋、退休認證步道與永久安全橋抵達終點。第 4 階膠帶橋會取代彈簧碰撞並把落腳平台降至同高，避免援助互相衝突。

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
- 終點訊息回報世界心軟 9 次。
- console 無 error／warning。

## 正式產物隔離

`max-assistance.html`、驅動器與 `playtest:max-assistance` 標記不得出現在 `dist/`。此頁只驗證援助碰撞與保存重建，不是正式遊戲的作弊入口。
