# 2026-09-28：重槌補點名與關卡鬥嘴

- 規格：[SPEC-0020](../specs/SPEC-0020-encore-and-dialogue.md)
- 狀態：本機實作及技術驗證完成，真人趣味／難度與實體觸控待驗收。未 stage、commit、push 或部署。

## 修改

後半段新增 `rest-platform-encore`：x2490 武裝後延遲 1100ms，在 x2660 落下第二把槌；急著到門前等待會中招。落點固定且有預告，第 5 次後段援助撤除。初稿兩槌之間只剩 6px 角色中心容錯，幾何檢查後加寬為 36px（陷阱邊緣相隔 64px、角色碰撞寬 28px），避免像素級卡位。既有引擎零死路線新增兩槌間等候，未修改正式玩家輸入或物理。

開場、沿途、據點、閒置、死因與援助用「關卡嘴硬、工務處拆台、勇者回嘴」串接。12 則援助文案先交代世界實際變化；重複死因提供對應解法。`levelOneDialogue.ts` 管內容，`DialogueQueue.ts` 管閱讀時間與優先序。一般播放每句至少 3.2 秒、長句按長度增加；重要事件可打斷。新死亡會清除舊接話，重生保留原句，暫停凍結接話；終點搬近說明排在死因之後。讀檔不補播身後路過台詞。

沿用既有 DOM status 與 polite live region，增加換行保留；移除重複的沿途浮字，死亡浮字固定在畫面內並換行。據點更新仍立即發布狀態，即使對話因優先序而保留。沒有新增依賴、外部資產或保存欄位。

## 驗證

`npm.cmd run check`：27 檔、121 項通過，TypeScript 與 Vite build 通過。Phaser 主 bundle 大於 500 kB 是既有建置警告。純狀態測試涵蓋補槌時間邊界、一次武裝、退休、亂序援助、安全站位，以及對話閱讀時間、打斷、長 delta、重設與死因提示。

以下皆使用實際 Phaser／ActionState 與獨立測試保存，沒有改正式玩家存檔：

| 路線 | 本輪結果 |
| --- | --- |
| `zero-assist.html` | 桌面 `completed`、0 死 |
| `mobile-review.html?case=zero` | 固定 375×667，`completed`、0 死 |
| `rear-gauntlet.html?case=restEcho` | `completed`、5 死，全部為 `rest-platform-encore` |
| `rear-gauntlet.html?case=encorePause` | `completed`、5 死；`pauseHeld`、`dialoguePauseHeld`、`dialogueSurvivedRespawn` 均為 true |
| `rear-gauntlet.html?case=encoreReload` | `completed`、5 死；保存重載後 `restoredDeaths=5` |
| `mobile-review.html?case=encore` | 375×667，`completed`、5 死、`restoredDeaths=5` |
| `final-mercy.html?case=fresh` | 新局只按右、不跳，精確 21 死後紅毯完成 |
| `mobile-review.html?case=finalReload` | 375×667，古橋據點第 21 死保存重載，`restored=true`、紅毯只按右完成 |
| `goal-collision.html?case=rush` | `completed`，精確 1 次 `goal-approval-stamp`，終點搬近後通關 |
| `shell-review.html` 真實鍵盤 ArrowRight | 手機尺寸觸發第一次方塊死亡，重生前後均保留「它剛才不動，是因為還沒看到你。」 |

桌面與手機直橫向已檢視。375px 狀態區兩行高 46px，橫向兩行高 38px；抽樣對話 `scrollHeight` 等於 `clientHeight`，左右／跳躍鍵仍可見。沒有以桌面自動化冒充實體觸控。

本輪本機開發瀏覽器曾出現缺少 favicon 的 404；其餘檢查到的主控台只有 Phaser 啟動訊息，未重現前輪 MutationObserver 錯誤，不宣稱已修復其根因。

## 畫面與試玩

本機截圖位於 Git 忽略的 output 目錄：

- [桌面介面](../../output/playwright/spec0020-desktop.png)
- [手機開場](../../output/playwright/spec0020-mobile-intro.png)
- [手機重生後的死因台詞](../../output/playwright/spec0020-mobile-death-dialogue.png)
- [橫向對話與觸控區](../../output/playwright/spec0020-landscape-dialogue.png)
- [桌面補點名](../../output/playwright/spec0020-encore-desktop.png)
- [375×667 補點名](../../output/playwright/spec0020-encore-mobile.png)

`http://127.0.0.1:5173/tests/browser/shell-review.html` 從頭試新對話；加 `?state=goal` 可從終點前據點試兩把槌，均為獨立記憶體進度。對話趣味、初見難度和正式美術仍待使用者確認。
