# 2026-07-16：強化本機試玩啟動器

## 背景

使用者曾直接執行 `pnpm.cmd dev`，但系統沒有全域 pnpm。既有 `play-local.cmd` 已能在系統 Node.js 與 Codex runtime 間切換，卻假設 `node_modules` 一定存在；乾淨環境第一次執行時會只顯示找不到 Vite，而不是引導安裝專案套件。系統 Node.js 版本過舊時也沒有預先診斷。

## 改善

- 驗證 Node.js 符合專案 engines：20.19 以上的 20.x，或 22.12 以上版本。
- 系統 Node.js 不存在、npm 缺失或版本不支援時，優先嘗試 Codex 內建 runtime。
- `node_modules/.bin/vite.cmd` 不存在時，正常啟動會自動安裝本專案套件：
  - 系統環境使用 `npm install --no-package-lock`，不產生第二份鎖檔。
  - Codex runtime 使用 `pnpm install --frozen-lockfile`。
- 新增 `--check` 診斷模式，只檢查 runtime 與依賴，不啟動伺服器、不修改套件。
- 將實際 runtime、Node.js 版本、安裝失敗原因與下一步輸出到終端機。

## 不變範圍

- 正常啟動仍使用 Vite 開發伺服器，預設網址為 `http://localhost:5173`。
- 不要求全域 pnpm，不上傳任何內容，也不提交 `node_modules`。
- 正式靜態建置與遊戲程式碼沒有變更。

## 驗證

執行 `play-local.cmd --check`，確認目前環境能辨識可用 runtime、支援的 Node.js 版本與已安裝專案套件，且命令正常結束而不啟動伺服器。

實際結果：

- runtime：系統 Node.js v24.18.0。
- Vite、TypeScript、Vitest 與 Phaser 依賴檢查：ready。
- 結束碼：0。
- 未啟動開發伺服器、未修改或重新安裝套件。
- 正常執行啟動器後，Vite 8.1.4 於約 154 ms 進入 ready，輸出 `http://localhost:5173/`；確認後以 `Ctrl+C` 正常停止。
