# 2026-07-16：補上本機試玩啟動器

## 背景

使用者在 PowerShell 執行 `pnpm.cmd dev` 時收到找不到指令的錯誤。這代表全域 PATH 沒有 pnpm，不代表專案或套件損壞。

## 本次處理

- 新增根目錄 `play-local.cmd`，讓使用者可雙擊或從 PowerShell 啟動。
- 啟動器優先使用系統 Node.js／npm，不要求另裝全域 pnpm。
- 系統 Node.js 不存在時，嘗試使用 Codex 桌面環境內建的 Node.js／pnpm。
- 兩者皆不存在時，顯示 Node.js LTS 安裝網址與可理解的錯誤訊息。
- 新增 `docs/testing/local-playtest.md`，記錄啟動、操作、試玩重點與常見問題。

## 驗證結果

- 系統 Node.js／npm 路徑：成功啟動 Vite 8.1.4，`http://localhost:5173/` 回應 HTTP 200。
- 模擬 PATH 不含 Node.js：成功切換到 Codex 內建執行環境並啟動相同網址。
- 啟動器採用 ASCII 指令內容，避免 Windows `cmd.exe` 對無 BOM UTF-8 批次檔產生錯誤解析。
