# P1 第一批素材試套

- 日期：2026-07-17
- 關聯規格：`SPEC-0001` AC-9
- 狀態：技術與畫面試套完成；正式美術／授權驗收待補件

## 本次完成

- 保留 `art-generation-output/p1-vertical-slice/` 原始交付檔，另將核准試套的主角待機、史萊姆與森林 object sheet 複製到 `public/assets/level-one/`。
- 新增集中資產清單、Phaser preload、nearest-neighbor 過濾及待機／彈跳動畫；載入失敗時沿用原本程式圖形。
- 森林圖只以人工確認的 `grass-platform` atlas frame 顯示，碰撞平台仍由既有資料與 Phaser static body 決定。
- 史萊姆美術與不可見彈簧碰撞體分離；畫面稽核後改用較高姿勢並放大 1.25 倍。
- 跑步 sheet 因每格有效角色高度只有約 8–10px，未進 `public` 與 `dist`。

## 驗證

- `npm.cmd run typecheck`
- `npm.cmd test`：12 個測試檔、54 項測試通過
- `npm.cmd run build`
- 零援助與最高援助瀏覽器整關完成
- 桌面 960×540、手機橫向 844×390 與史萊姆短暫狀態截圖檢查
- 正式 `dist` 含三項試套 PNG 與一份 atlas JSON，不含退回的跑步 sheet

## 下一個美術協作閘門

1. 補正跑步 sheet 的角色高度與腳底基線。
2. 為 object sheet 提供正式 atlas JSON 或改正 tileset 命名與規格。
3. 補齊每個動畫幀的語意、播放順序與基線說明。
4. 補交可追溯來源與商業使用授權後，才把素材狀態由試套改為正式核准。
