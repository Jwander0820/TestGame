# 專案文件索引

本專案採用 Spec-Driven Development（SDD）。所有需求、決策、驗收條件與開發紀錄，均應先寫入 `docs/`，再進入實作。

## 文件地圖

| 位置 | 用途 |
| --- | --- |
| `AGENT.md` | 專案治理與代理工作守則 |
| `discovery/product-vision.md` | 產品願景、核心循環、範圍與成功條件 |
| `discovery/open-questions.md` | 尚待確認的產品問題與建議預設值 |
| `decisions/` | Architecture Decision Records（ADR） |
| `design/` | 技術尖峰、架構與實作設計 |
| `design-system/` | 視覺系統與各頁／場景覆寫 |
| `specs/` | 可審閱、可驗收的功能規格與狀態索引 |
| `templates/feature-spec-template.md` | 新功能規格範本 |
| `logs/` | 階段進程、測試與重要問題紀錄 |

## SDD 狀態流程

`探索中 → 草案 → 待確認 → 已核准 → 實作中 → 已驗收 → 已封存`

只有「已核准」的規格能進入正式實作。探索性原型必須明確標示為原型，不能反向被視為已核准需求。

## 當前狀態

- 階段：已核准首個垂直切片／技術尖峰
- 原始輸入：專案根目錄的 `初始概念.md`
- 已確認：單關卡垂直切片、橫向畫面、三鍵操作、Vite + TypeScript + Phaser
- 已確認：同一阻礙 2／3／5／7 次的援助門檻、原地等待彩蛋
- 下一個決策點：美術方向與 SPEC-0003 必敗密道彩蛋關細節
