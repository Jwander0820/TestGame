# 原創程式像素美術重整紀錄

- 狀態：已實作，待使用者美術驗收
- 最後更新：2026-09-20
- 規格：[SPEC-0007](../specs/SPEC-0007-astra-art-refresh.md)

| 美術 | 可編輯來源 | 用途與來源 |
| --- | --- | --- |
| 騎士 | src/game/visuals/heroPixels.ts | 本次原創 16×24 矩陣，2× 繪成 32×48 遊戲貼圖；標題以 4× 展示同一角色 |
| 森林／王城／遺跡 | src/game/visuals/forestPainting.ts | 本次原創整數繪圖，共用於 Phaser 與標題 Canvas |
| 草地／岩土平台 | 同上 paintGroundTile | 96×54，重複鋪設，不拉伸像素；最上沿與原碰撞頂面一致 |
| 色盤 | src/game/content/levelOneVisuals.ts | 既有受限色盤降低天空／森林飽和度；MASTER 同步記錄 |
| 外框 | src/styles.css | 本次原創，維持系統字型回退，無外部字型請求 |

以上由本次專案開發撰寫，未使用第三方圖片／字型或外包資產，不增加第三方授權依賴。這是來源紀錄，不是使用者最終核准。

P1 原始交付與 public/assets/level-one/environment 下的舊森林 PNG／atlas 保留供追溯；執行時 manifest 已不載入。Vite 仍會複製 public 內容到 dist，因此不能宣稱舊森林檔已從產物消失。退件主角／史萊姆未重新加入。

驗收時使用 /tests/browser/art-review.html 切換零死亡、首次死亡、最高援助。該頁使用記憶體進度，不讀寫玩家存檔，也不包含在正式建置入口。
