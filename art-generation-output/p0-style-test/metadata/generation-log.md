# 圖片生成日誌 (Generation Log)

- 生成日期：2026-07-17
- 生成工具/模型：Google Gemini 3.1 Pro (Image Generation Tool)
- 色彩調整與後處理：使用 Python PIL 庫將輸出轉為標準 PNG-RGBA，並對環境風格圖使用 Nearest Neighbor 演算法等比例縮小以取得手機可讀性預覽。

---

## 1. 主角概念圖 (Character Concepts)

### chr_hero_concept_c01_v001.png
* **提示詞 (Prompt)**：
  ```text
  Pixel art character concept sheet of a very serious novice hero for a 2D side-scrolling platformer. Cute 2D pixel art style. He has a slightly oversized round steel helmet, a red short cape, a small wooden round shield on his back or arm, and simple, slightly ill-fitting silver metal armor. Big head, small body, cute and brave. The sheet shows front, back, and side views, with three expressions: serious, surprised, and pretending nothing happened. Character proportions suitable for 32x48 pixels. Solid flat light grey background, no weapons, crisp pixel edges, limited color palette.
  ```
* **負面提示詞 (Negative Prompt)**：
  ```text
  no 3D, no isometric view, no realism, no painterly illustration, no watercolor, no vector art, no blurry edges, no anti-aliasing, no smooth gradients, no gore, no debug UI, no school worksheet style, no red pen marks, no logo, no watermark, no unreadable text, no imitation of existing game characters
  ```
* **人工修正**：否。

### chr_hero_concept_c02_v001.png
* **提示詞 (Prompt)**：
  ```text
  Pixel art character concept sheet of a very serious novice hero for a 2D side-scrolling platformer. Cute 2D pixel art style. He has a slightly oversized round bronze helmet, a blue short cape, a small copper round shield, and simple, slightly ill-fitting bronze armor with minor gold accents. Big head, small body, serious expression. The sheet shows front, back, and side views, with three expressions: serious, surprised, and pretending nothing happened. Character proportions suitable for 32x48 pixels. Solid flat light grey background, no weapons, crisp pixel edges, limited color palette.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **人工修正**：否。

### chr_hero_concept_c03_v001.png
* **提示詞 (Prompt)**：
  ```text
  Pixel art character concept sheet of a very serious novice hero for a 2D side-scrolling platformer. Cute 2D pixel art style. He has a slightly oversized round iron helmet with a tiny plume, a green short cape, a small rustic round shield, and simple, slightly ill-fitting leather and chainmail armor. Big head, small body, cute and clumsy. The sheet shows front, back, and side views, with three expressions: serious, surprised, and pretending nothing happened. Character proportions suitable for 32x48 pixels. Solid flat light grey background, no weapons, crisp pixel edges, limited color palette.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **人工修正**：否。

---

## 2. 第一關風格圖 (Forest Styleframes)

### env_forest_styleframe_c01_v001.png
* **提示詞 (Prompt)**：
  ```text
  Pixel art styleframe of a 2D side-scrolling platformer, 16:9 ratio. Theme: Novice Forest at the outskirts of the royal city during a bright sunny afternoon. Far background shows a bright blue sky with fluffy white clouds, distant green mountains, and the silhouette of a majestic white royal castle. Mid-ground has round lush green trees, ancient stone ruins, and a wooden watchtower. Foreground consists of green grass platforms, a broken stone bridge, stone pillar platforms, and a deep pit. A cute novice hero with a large round helmet stands in the center. Modern cute pixel art, vibrant color palette, clear pixel edges, low-to-medium detail. No UI, no text.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **人工修正**：否。

### env_forest_styleframe_c02_v001.png
* **提示詞 (Prompt)**：
  ```text
  Pixel art styleframe of a 2D side-scrolling platformer, 16:9 ratio. Theme: Novice Forest at the outskirts of the royal city during a warm golden sunset. Far background shows an orange and pink sky, purple mountain silhouettes, and a glowing royal castle. Mid-ground features dark green trees, mossy stone ruins, and a watchtower. Foreground has grass-covered platforms, a broken stone bridge, and a deep pit. A cute novice hero with a large round helmet stands in the center. Modern cute pixel art, warm cozy color palette, clear pixel edges, low-to-medium detail. No UI, no text.
  ```
* **負面提示詞 (Negative Prompt)**：同上.
* **人工修正**：否。

### env_forest_styleframe_c03_v001.png
* **提示詞 (Prompt)**：
  ```text
  Pixel art styleframe of a 2D side-scrolling platformer, 16:9 ratio. Theme: Novice Forest at the outskirts of the royal city during a misty morning. Far background shows a pale teal sky, misty blue mountain silhouettes, and the distant royal castle in morning light. Mid-ground features dew-covered trees, ancient ruins, and a watchtower. Foreground has green grass platforms, a broken stone bridge, and a deep pit. A cute novice hero with a large round helmet stands in the center. Modern cute pixel art, cool refreshing color palette, clear pixel edges, low-to-medium detail. No UI, no text.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **人工修正**：否。

---

## 3. 基礎動畫測試 (Basic Poses)

### anim_hero_basicposes_c01_v001.png
* **提示詞 (Prompt)**：
  ```text
  Pixel art character sheet of the same novice hero for a 2D side-scrolling platformer. Side view, facing right, with a slightly oversized round silver helmet, a red short cape, and a small round wooden shield. Clear outlines, 32x48 pixel proportions. The sheet displays key poses: Idle (breathing), Running, Jumping, Falling, and Landing (clumsily adjusting helmet). All frames must have consistent character proportions, clothing design, colors, and pixel density. Arranged in a neat grid on a solid light grey background, no text, no UI.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **人工修正**：否。

---

## 4. 史萊姆彈簧援助分鏡 (Storyboard)

### assist_slime-spring_storyboard_c01_v001.png
* **提示詞 (Prompt)**：
  ```text
  2D pixel art storyboard for a comedy event in a side-scrolling platformer. 5 key panels showing a sequence: 1) Novice hero with a large silver helmet falls into a deep gap in a forest ruins. 2) A cute green slime suddenly appears from the bottom of the pit and compresses its body. 3) The slime bounces the hero high up back to the safe platform. 4) The hero looks extremely surprised mid-air. 5) The hero lands safely and immediately strikes a proud heroic pose, pretending he did it all by himself. Cute modern pixel art, bright fantasy forest kingdom, clean storyboard panel layout, no text, no UI.
  ```
* **負面提示詞 (Negative Prompt)**：同上。
* **人工修正**：否。

---

## 一致性修正與模型限制說明
1. **角色一致性**：由於生成模型難以在不同生成圖中完全維持相同的單個像素分佈，但透過在動畫測試與分鏡提示詞中鎖定關鍵特徵（稍大圓頭盔、紅短披風、圓木盾、不合身護甲），使動畫姿勢與分鏡中的主角能保有高度的視覺特徵一致性。
2. **像素品質**：已透過負面提示詞排除了抗鋸齒與平滑漸層。輸出在進行 nearest-neighbor 縮小後，邊緣與像素顆粒感依然保持清晰。
