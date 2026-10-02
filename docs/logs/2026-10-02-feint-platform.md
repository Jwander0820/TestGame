# 2026-10-02：虛晃落腳地板

- 規格：[SPEC-0023](../specs/SPEC-0023-feint-platform.md)
- 狀態：已實作，技術驗證與跨尺寸檢查完成；真人手感待驗收。
- 授權：使用者要求向前跳往落點時地板突然移動，再慢慢回來。

## 實作

古橋前高台向右閃 96px：120ms 快退、240ms 停留、1,100ms 緩回。判斷前進空中接近，每命只閃一次。圖形與靜態碰撞同步整數座標；暫停／死亡／後台不推進有效時間。落地後原崩落維持，後段第 3 次援助同時釘住兩種動作。新增專屬死因歸入後段，沿原保存推導退休，不增加存檔版本。

設定、純狀態、世界接線及滑軌／木栓呈現分離。程式繪圖沿用色盤，沒有新外部素材或依賴。零死 driver 在岸邊引招、收腳回到岸上、回位後重跳，再立即離開崩落高台；測試只操作既有左右／跳躍。

## 本輪證據

- `npm.cmd run check`：34 檔 152 項測試、型別、正式 build 通過。Phaser 主 bundle >500kB 是既有警告。
- `feint-platform.html?case=learned`：0 死完成，快退、慢回及每命一次均經歷。
- `?case=rush`：專屬 `feint-platform-miss` 精確 3 死後地板退休並完成。
- `?case=reload`：保存 3 死與後段固定援助，重載恢復退休後完成，沒有復活閃躲。
- `?case=pause&review=1`：空中引招後停在閃開位置；繼續後 0 死完成，`pauseHeld=true`。
- 375×667 iframe 暫停／恢復路線：0 死完成，`geometryHeld=true`、`pauseHeld=true`。實體碰撞中心與平台位置逐幀同步，閃開為 x1721，回位為 x1625。
- 新局 `zero-assist.html`：整關 `completed`，0 死。
- 新局 `final-mercy.html?case=fresh`：精確 21 死後全程紅毯完成；`jumpCommands=0`、`finalJumpCommands=0`，新地板 `retired`。

## 試玩及畫面

- `shell-review.html?state=feint`：正式外框，從高台前據點手動試玩，獨立記憶體保存。
- `mobile-review.html?case=feintPlay`：375×667 正式外框試玩；加 `&size=landscape` 為 667×375。
- `feint-platform.html?case=learned|rush|pause|reload`：自動驗證；加 `&review=1` 暫停在閃開畫面。
- `.playwright-cli/feint-platform-desktop.jpg`、`feint-platform-mobile.jpg`：本輪實際閃開畫面，未追蹤驗證產物。
- 正式外框 375×667／667×375 已目視，完整舞台、字幕及觸控三鍵可達。截圖：`.playwright-cli/feint-shell-portrait.jpg`、`feint-shell-landscape.jpg`。

## 限制

固定手機 iframe 檢視仍記錄到前輪已知的 `MutationObserver.observe` 初始化錯誤；本輪路線、畫面與操作鍵仍正常，此錯誤來源未在本切片定位。

真人初見節奏、趣味、美術與真實手機觸控仍待使用者試玩；桌面瀏覽器手機尺寸驗證不是實體觸控驗收。保留原有未追蹤檔案；沒有 stage／commit／push／部署。
