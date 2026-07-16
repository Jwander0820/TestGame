# 最高援助整關自動試玩

- 狀態：開發驗證工具
- 最後更新：2026-07-16
- 關聯規格：SPEC-0001 AC-4、SPEC-0002

## 用途

本測試先使用正式同情導演產生：

- `first-gap` 連續死亡 7 次。
- `warning-strip` 連續死亡 7 次。
- 六個持久世界效果：移動落腳平台、彈簧、橋、縮短危險帶、高架繞道、危險帶退休。

接著將狀態回到本關起點，建立全新 Phaser 場景，確認保存狀態能重建所有援助物件，並由驅動器實際使用橋／彈簧與高架繞道路線抵達終點。

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
- `data-deaths="14"`，表示測試期間沒有新增死亡。
- 終點訊息回報世界心軟 6 次。
- console 無 error／warning。

## 正式產物隔離

`max-assistance.html`、驅動器與 `playtest:max-assistance` 標記不得出現在 `dist/`。此頁只驗證援助碰撞與保存重建，不是正式遊戲的作弊入口。
