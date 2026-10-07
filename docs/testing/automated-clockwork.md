# 第二關・鐘塔運送線驗證

- 日期：2026-10-07
- 規格：[SPEC-0024](../specs/SPEC-0024-clockwork-level-two.md)、[SPEC-0025](../specs/SPEC-0025-clockwork-malice.md)
- 初版實際結果：[驗證紀錄](../logs/2026-10-07-clockwork-level-two.md)
- 四種後手結果：[本輪反轉驗證紀錄](../logs/2026-10-07-clockwork-malice.md)；初版結果不代表新機關已通過。

啟動 `npm.cmd run dev -- --host 127.0.0.1`，以終端顯示的實際埠開啟以下網址。測試使用獨立記憶體進度；重載案例使用 `playtest:clockwork:reload:` 的 sessionStorage，均不修改正式玩家 localStorage。

## 正式外框試玩

- `/tests/browser/level-two-shell.html`：以首關完成的獨立紀錄，按「前往第二關」開始。
- `?station=1`：運送站對岸；`?station=2`：輸送帶起點；`?station=3`：鐘塔階梯前。
- `?mercy=1`：21 死最終援助，只向右走完成；可與 station 同用。
- 暫停後「繼續」接續當前關卡；「重走本關」回本關入口，保留死亡與援助。
- `data-playtest-frame` 可查看當前角色／機關狀態，`data-test-progress` 可查看此測試入口的保存結果。

## 自動路線

入口 `/tests/browser/level-two.html?case=...`，以 `#playtest-result` 的 `data-status=completed` 表示所有對應斷言通過。證據 JSON 顯示幾何、死亡、援助與動作；driver 只發出玩家可用的方向／跳躍，不移動角色或改機關。

| case | 驗證 |
| --- | --- |
| learned | 搭載台等閘刀、旁管觸發後退、快速出口向左撤回、鐘前等配重，四個後手皆觸發後整關零死 |
| pause | 後手預告或啟動中暫停 1 秒，玩家與機關幾何凍結，恢復並零死完成 |
| reload | 通過蒸汽取得第 2 據點後真正刷新頁面，再從保存據點零死完成 |
| assistReload | 閘刀精確 5 死取得步道後真正刷新，解除與死亡保存，之後完成 |
| steam | 站在蒸汽落點，每命中招；精確 5 死關閥後完成 |
| press | 留在壓機落點，精確 7 死永久退休後完成 |
| dock | 等閘刀啟動再跳入落點，每命中招；精確 5 死步道解除後完成 |
| backwash | 破解主蒸汽後停在旁管落點，精確 5 死關閥後完成 |
| recall | 破解主壓機後停在封口夾落點，精確 7 死退休後完成 |
| bell | 到鐘塔後停在配重落點，精確 7 死退休後完成 |
| naiveDock | 載台一到站就下貨；驗證 arrival-guillotine 首次死亡後停下 |
| naiveBackwash | 破解主蒸汽後照「洩壓完成」前進；驗證 steam-backwash 首次死亡後停下 |
| naiveRecall | 破解主壓機後照「快速出貨」前進；驗證 sorting-recall 首次死亡後停下 |
| naiveBell | 接近終點直接敲鐘；驗證 bell-counterweight 首次死亡後停下 |
| right | 全新第二關一直向右、不發跳躍；精確 21 死後平地通關 |

`naive` 是 `naiveDock` 的別名。四條直覺案例會破解其餘已經通過的機關，只對指定後手相信假安全提示；`data-status=completed` 表示首死的死因正確，不代表整關完成。

`pause` 可加 `&pause=dock-tell|dock-active|backwash-tell|backwash-active|recall-tell|recall-active|bell-tell|bell-active|carrier` 指定暫停時機，預設為 `dock-tell`。取樣等待本幀 Phaser postUpdate 完成後，再比較玩家 sprite／body、載台、壓機及四個後手位置與可見狀態。

加 `&review=1` 會依同一 `pause` 參數停在指定後手預告／攻擊畫面，例如 `&review=1&pause=bell-active`；按「接手試玩」可手動操作。載台每命 trace、death snapshot 與前 10 筆 geometryFailures 協助區分輸入、承載和碰撞問題；所有完整路線都要求 `geometryHeld=true`。

據點重載只使用 `playtest:clockwork:reload:` 的 sessionStorage；援助重載使用 `playtest:clockwork:assistReload:`。每次第一輪均重設該案例測試保存，正式 localStorage 不受影響。

## 視覺及回歸

正式外框檢視 960×540 舞台、375×667 直向、667×375 橫向，確認角色、下一落點、機關預告、狀態文字與 3 個觸控鍵。直向不裁切或拉伸；減少動態模式停裝飾齒輪，必要載台／陷阱運動保留。

第一關 `/tests/browser/zero-assist.html` 與 `/tests/browser/final-mercy.html?case=fresh` 應分別維持零死及精確 21 死。正式預設 `createGame` 不自動切第二關；接續由完成面板觸發。

真實手機觸控與真人趣味驗收仍需使用者試玩，尺寸模擬不等同真實裝置。
