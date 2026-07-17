# 圖片生成日誌 (P1正式素材 - 第一批)

- 生成日期：2026-07-17
- 生成工具/模型：Google Gemini 3.1 Pro (Image Generation Tool)
- 後處理處理說明：
  - 使用 Python PIL 庫偵測底圖背景顏色，並以 25 階色差容差進行透明去背（RGBA 透明通道）。
  - 將角色與援助動畫底圖以 Nearest Neighbor (最鄰近插值法) 進行等高寬裁切與水平重新對齊，確保生成標準 spritesheet，且在縮小/重對齊過程中不破壞像素邊緣的清爽度。

---

## 1. 角色動畫素材 (Character Sheets)

### chr_hero_idle_sheet.png (ID: CHR-01)
* **提示詞 (Prompt)**：
  ```text
  Pixel art character sheet of a cute novice hero for a 2D side-scrolling platformer. Side view, facing right, showcasing 4 frames of idle breathing animation. The character features a slightly oversized round silver steel helmet, a red short cape, simple silver metal armor, and a small round wooden shield on his back. Proportions suitable for 32x48 pixels. 4 frames arranged in a horizontal row. Solid flat light grey background, no text, no UI, crisp pixel edges, limited color palette.
  ```
* **負面提示詞 (Negative Prompt)**：
  ```text
  no 3D, no isometric view, no realism, no painterly illustration, no watercolor, no vector art, no blurry edges, no anti-aliasing, no smooth gradients, no gore, no debug UI, no school worksheet style, no red pen marks, no logo, no watermark, no unreadable text, no imitation of existing game characters
  ```
* **後處理說明**：透明去背，水平分割裁切，Nearest-Neighbor 重整為寬 128px、高 48px (每格 32×48 px，4 幀) 的標準 Spritesheet。

### chr_hero_run_sheet.png (ID: CHR-02)
* **提示詞 (Prompt)**：
  ```text
  Pixel art character sheet of the same cute novice hero for a 2D side-scrolling platformer. Side view, facing right, showcasing 6 frames of running animation. The character features a slightly oversized round silver steel helmet, a red short cape, simple silver metal armor, and a small round wooden shield. Legs are running actively while the upper body maintains a brave posture. Proportions suitable for 32x48 pixels. 6 frames arranged in a horizontal row. Solid flat light grey background, no text, no UI, crisp pixel edges, limited color palette.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **後處理說明**：透明去背，水平分割裁切，Nearest-Neighbor 重整為寬 192px、高 48px (每格 32×48 px，6 幀) 的標準 Spritesheet。

---

## 2. 第一關環境素材 (Environment Tileset)

### tile_forest_ground.png (ID: ENV-04)
* **提示詞 (Prompt)**：
  ```text
  Pixel art tileset sheet of Novice Forest at the outskirts of the royal city during a misty morning. 24x24 pixel modules, side-view 2D platformer. Includes dew-covered green grass top tiles, dark teal-grey stone platform tiles, left and right corner tiles, cliff slices, stone bridge structures, stone columns, wooden planks, support beams, pit edges, mist-covered bushes, and small rocks. Cool refreshing color palette, misty blue and green tones, crisp pixel edges, limited color palette. Solid flat light grey background, no characters, no text.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **後處理說明**：透明去背，保留 24×24 的模組網格，存為標準 PNG-RGBA。

---

## 3. 援助物件素材 (Assists Sheets)

### assist_slime_spring_sheet.png (ID: OBJ-04)
* **提示詞 (Prompt)**：
  ```text
  Pixel art character sheet of a cute green slime for a 2D side-scrolling platformer. Side-view, showcasing 4 frames of a spring bounce animation: 1) Idle standing, 2) Heavily compressed down, 3) Bouncing high up, stretching vertically, 4) Recovering back to idle. Proportions suitable for 48x32 pixels each frame. 4 frames arranged in a horizontal row. Solid flat light grey background, no text, no UI, crisp pixel edges, limited color palette.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **後處理說明**：透明去背，水平分割裁切，Nearest-Neighbor 重整為寬 192px、高 32px (每格 48×32 px，4 幀) 的標準 Spritesheet。
