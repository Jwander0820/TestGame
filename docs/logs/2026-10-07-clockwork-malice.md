# 第二關安全提示的四次反轉

- 日期：2026-10-07
- 狀態：實作及技術驗證完成；真人難度感受、美術與實體觸控待驗收
- 規格：[SPEC-0025](../specs/SPEC-0025-clockwork-malice.md)
- 初版：[第二關架構與接續](2026-10-07-clockwork-level-two.md)
- 操作：[第二關驗證入口](../testing/automated-clockwork.md)

## 變更

使用者試玩初版後指出「一次就通關，沒有惡意」。保留運送線架構，新增四個固定後手：到站後才落的卸貨閘、主蒸汽停止後的旁管回噴、驗收後逆轉加速將玩家送向封口夾，以及終點鐘的下落配重。初見告示誤導，死後台詞揭露反轉，第三死延長預告及公開解法，第五／七死由工務處實際撤除機關。

四個死因沿用載台、蒸汽、分揀三段 blocker 與既有 2／3／5／7 門檻、效果 ID。本關 21 死或全部退休後四招立即停用，仍保留只向右不跳的乘客通道。存檔、輸入與物理參數不改，舊第一關與已保存最高援助不重新刁難。

新增內容、純狀態、相對碰撞封裝與可替換程式像素圖。檢查發現用陷阱前後包圍盒聯集會誤殺時間錯開的接近；改用既有相對 slab 判定，並以 60fps 配重回收、玩家剛好走近但未接觸的幾何反例回歸。

## 驗證

穩定版本 `npm.cmd run check` 通過：41 檔、208 項測試、TypeScript 嚴格型別及靜態 build。既有 Phaser bundle 大於 500kB 警告維持，沒有新增依賴。

穩定版本實際 Phaser 22 條案例全部 `data-status=completed`、`geometryHeld=true`、沒有幾何失敗。初版證據保留，不作為本輪後手證據。

| 案例 | 實際結果 |
| --- | --- |
| learned | 0 死完成，四招都觸發並完整收回，未使用位置／機關／保存作弊 |
| naiveDock／Backwash／Recall／Bell | 各首死 1 次即停，對應 arrival-guillotine／steam-backwash／sorting-recall／bell-counterweight；此 completed 是死因斷言通過 |
| dock／backwash | 各精確 5 死，步道／關閥後完整完成 |
| recall／bell | 各精確 7 死，排序機退休後完整完成；第 5 死停帶沒有卡死 |
| steam／press | 原機關精確 5／7 死後完整完成，未混入新死因 |
| pause ×8 | 四招各預告與攻擊中暫停 1 秒，玩家／身體／載台／壓機／四招幾何凍結，恢復各 0 死完成 |
| reload | 第 2 據點真正刷新，恢復 order2，0 死完成 |
| assistReload | 閘刀第 5 死後真正刷新，恢復踏板及步道，仍精確 5 死完成 |
| right | 全新第二關精確 21 死、0 次跳躍，四招全部退休，平路完成並保存 |

右走的死因為載台落空 5、原壓機 3、鐘塔落空 13。22 條 actual JSON 存於 `output/playwright/malice-first.json`、`malice-faults*.json`、`malice-pause-*.json`、`malice-reloads.json`、`malice-originals.json`、`malice-right.json`；這些均為忽略的本機證據，不列入產品資產。

四種後手桌面實截圖及正式外框 375×667、667×375 已目視。新告示／落點不遮角色，直向維持比例，觸控鍵 64px；橫向最小 60px，無水平溢出。圖形與物理採樣對齊，證據保存在 ignored `output/playwright/malice-*.png`。

本機試玩埠為 5176。驗證使用記憶體或獨立 sessionStorage，不修改正式玩家 localStorage。測試瀏覽器只有 Phaser 正常 LOG，沒有本輪執行期錯誤。

第一關回歸：已知路線 0 死完成、全新只向右精確 21 死紅毯完成。未改首關玩法。

## 邊界

像素圖均為本專案原創程式繪製，沿用既有色盤和主角資產，沒有新增外部圖像來源。開發及上述驗證期間未 stage／commit／push／部署；原有素材、模型規劃及 `.playwright-cli/` 保留。

2026-10-07 使用者後續要求先提交一版，已核准本機提交第二關、四種後手、接續介面及相關規格／驗證入口。實際提交識別以 Git 紀錄為準。

自動路線只證明初見策略會中招、存在可學習解法與援助可通關；是否夠惡意、真人手感與實體手機觸控仍待使用者實際試玩。
