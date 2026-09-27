# 第三批可玩關卡素材來源與狀態

- 日期：2026-09-25；2026-09-27 補記第一關及陷阱修整
- 狀態：已接入並完成技術驗證；使用者美術驗收待完成
- 規格：[SPEC-0017](../specs/SPEC-0017-third-batch-gameplay-art.md)、[SPEC-0018](../specs/SPEC-0018-first-level-visual-polish.md)、[SPEC-0019](../specs/SPEC-0019-first-level-trap-art-polish.md)
- 產生方式：使用內建 `image_gen` 以使用者提供的 JPG 作參考或去背衍生；原始 ZIP 保留在 `素材`，未直接進入正式建置

| 專案檔案 | 來源圖 | 可玩用途 | 顯示尺寸／後備 |
| --- | --- | --- | --- |
| `src/game/visuals/assets/title-forest-background.jpg` | `Pixel_art_platformer_game_backgr…` | 標題遠景與遠方王城 | 標題 960×540；缺檔用程式天空與王城 |
| `src/game/visuals/assets/level-one-forest-no-castle.png` | 上述森林 JPG 去除遠方王城與道路的衍生版 | 第一關森林遠景 | 等比顯示 960×640，遊戲舞台裁掉底緣；缺檔用無城堡程式山景 |
| `src/game/visuals/assets/hero-poses-third-batch.png` | `Pixel_art_knight_standing` | 騎士待機、跑步兩幀、跳躍；標題亦用同一造型 | 遊戲 40×48；缺檔用原程式角色 |
| `src/game/visuals/assets/forest-ground-third-batch.png` | `Pixel_art_game_terrain_assets` | 整關草土地表，鏡像接合 | 480×54 重複貼圖；缺檔用原程式地表 |
| `src/game/visuals/assets/slime-square-third-batch.png` | `Pixel_slime_platformer_character` | 起點方塊史萊姆 | 36×28；缺檔用原幾何造型 |
| `src/game/visuals/assets/slime-round-third-batch.png` | 兩張史萊姆角色圖 | 第一坑後圓形史萊姆 | 32×32；缺檔用原幾何造型 |
| `src/game/visuals/assets/crown-coin-third-batch.png` | `Pixel_art_game_items_mechanisms` | 誘餌王冠金幣 | 20×20；缺檔用原圓形金幣 |
| `src/game/visuals/assets/castle-goal-muted-third-batch.png` | `Castle_entrance_pixel_art_asset`，再以本關森林遠景調整 | 終點王城入口 | 230×160；缺檔用原旗桿與旗幟 |

角色、道具、地形與城門的衍生 PNG 保留透明背景；新森林遠景則是不透明全幅圖。程式於載入後在記憶體中裁取與縮放，不修改原始圖片。貼圖只負責呈現，碰撞與援助狀態仍由既有模組控制。遠景已畫好的連續地面由中景樹林覆蓋，不會假裝坑洞有落腳處。

## 2026-09-27 陷阱視覺來源

`素材/遊戲開始心軟了 - 機關與道具.zip` 中的 `Pixel_art_malicious_trap_assets_20260925122037.jpg` 與 `Pixel_art_game_items_mechanisms_20260925122037.jpg` 作為收放地刺、伏擊、重槌及印章的形體參考。兩圖有白底、英文標籤、示意人物與固定透視，不直接裁進遊戲，也未新增正式貼圖。可玩版由 `src/game/visuals/trapPixelArt.ts` 按現行色盤繪製硬邊像素造型；碰撞與陷阱狀態保持獨立。技術驗證與截圖見[陷阱修整紀錄](../logs/2026-09-27-trap-art-polish.md)，造型待使用者驗收。

## 內建圖片生成提示組

- **騎士四姿態**：以提供的白底騎士為確切外觀參考，產生透明 RGBA 水平四幀；依序為朝右待機、跑步跨步、跑步換腳及跳躍。固定同一角色、比例與腳底線，保留圓盔、短紅披風、小圓盾，不加武器、文字或背景；硬邊有限色像素風。
- **史萊姆雙造型**：以兩張史萊姆圖的色彩、眼睛與輪廓為參考，在透明 RGBA 上分開繪製寬扁史萊姆與圓史萊姆，底線一致，無道具、陰影、地面或文字。另以第一張圖重做單獨的方形版本，供起點使用。
- **草土地表**：以地形 JPG 的草、石與土色為參考，產生單一側視長條地表，頂面水平、下方岩土、左右可重複接合，背景透明，不含其他圖塊或透視角度。
- **王冠金幣**：以道具圖左上方金幣為確切造型參考，去除白底，保留單枚正面圓形金幣與王冠徽記，無動態線、陰影或文字。
- **王城入口**：以城門 JPG 為確切造型參考，隔離石門及紅色王旗，門洞與外圍均透明，保留苔痕、金飾與木門，不加入地面或其他景物。
- **王城入口修訂版**：以先前城門透明圖為形體參考，森林背景圖為色盤與像素密度參考；保留雙石塔與中央拱門，改用灰米色石塊、少量苔痕、深色木門及小王冠標記，移除大片紅旗、繁複金邊與亮青裝飾。輸出為透明 RGBA，不含文字、地面或場景背景。舊版 `castle-goal-third-batch.png` 留作未採用候選，不進入現行貼圖清單。
- **無城堡森林遠景（2026-09-27）**：以 `title-forest-background.jpg` 為編修目標，只移除右上遠方城堡、旗幟、城牆及通往城堡的道路；用同色盤霧山、樹林與稜線補上。保留原晨光天空、雲層、主要樹位、前景、硬邊像素與橫向構圖；不加新建築、角色或文字。以內建 `image_gen` 輸出不透明 PNG，約 1.51 MB，僅供可玩關卡。

## 驗證與限制

本輪 `npm.cmd run check` 之 25 檔 111 項、型別及建置通過；正式入口與美術檢視頁在桌面、375×667、667×375 已目視。零死亡整關與既有 21 死最高援助整關自動路線通過；攔截圖片請求後，程式美術後備仍可進入遊戲。實際截圖與詳細結果見[導入紀錄](../logs/2026-09-25-gameplay-art.md)。

原始 JPG 合成圖無固定幀格。衍生騎士在小尺寸的表情與腳底線、方塊史萊姆的方形感、地表重複細節及修訂版城門手機縮圖仍待使用者美術驗收。陷阱已按來源形體重繪為程式像素圖；援助、UI、小特效仍使用程式暫用造型，不宣稱所有 12 張均已接入。
