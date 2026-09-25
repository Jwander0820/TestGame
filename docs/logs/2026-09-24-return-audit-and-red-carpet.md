# 回頭查票與全程紅毯

- 日期：2026-09-24
- 規格：[SPEC-0015](../specs/SPEC-0015-return-audit-and-red-carpet.md)
- 狀態：實作與技術驗證完成，待真人試玩；未提交。

## 實作

據點後向左上升跳躍會觸發「回頭查票」。退件章鎖定玩家左側 96px，預告 300ms、落下 220ms、停留 300ms，每生命一次；玩家可改變方向避開。沿用已修正的掃掠碰撞，避免高速落下漏判。新機關用方塊與文字佔位，沒有新素材或按鍵。

左側出界及退回據點前落坑記為 backtrack-exit，查票命中記為 backtrack-audit，歸入 backtrack 區段並提供逐次反應。該區段累積 5 死後撤除查票。起點彩蛋仍可探索。

本關不限原因累積 21 死，或舊存檔三段最高援助齊備，工務處接管：撤除小怪與陷阱、停用舊平台碰撞、鋪設 x=0～3000 的同高紅毯道路並限制左側出界。提示明確要求只向右走，閒置及重生也保留提示。角色仍由原物理與輸入實際移動至終點，沒有自動跳躍或傳送通關。援助從既有進度推導，存檔版本不變；重玩保留，全新旅程清除。

## 本次驗證

- npm.cmd run check：25 檔 111 項測試、型別與正式 build 通過。新案例涵蓋反向觸發、一次性與重生、退休、分段掃掠碰撞、不同死因 20→21、舊最高援助、保存解析與重玩，以及只向右驅動器不送跳躍。
- fresh：全新進度全程只向右，精確 21 死後實際到達終點，jumpCommands=0、finalJumpCommands=0。
- left：反覆往左跳出世界，精確 backtrack-exit 21 次後改為只向右並完成，finalJumpCommands=0。
- audit：精確 backtrack-audit 5 次後退休，接續已知路線完成整關，沒有其他死因。
- audit&review=1：退件章下落中暫停，兩次 DOM 證據的位置與時間相同；點擊繼續後精確 5 死完成。
- 固定 375×667 reload：古橋據點從 20 死再反向出界一次，以專用 sessionStorage 保存後重載，restored=true、維持 21 死，最終援助只向右完成、沒有跳躍。
- 桌面及固定 375×667 max-assistance：改用 RightOnlyDriver，保留原 21 死，不新增死亡、不按跳躍即完成。舊 MaxAssistanceDriver 保留給原 checkpoint fixture。
- zero-assist：已知路線 0 死通關。reverse-easter-egg：左側探索、保存重載、返回主線與整關仍 0 死。
- 桌面退件章與紅毯、375×667／667×375 紅毯已目視，玩家、道路及原觸控三鍵可見。截圖保留 .playwright-cli/spec0015-*，不提交。
- fresh／left 瀏覽器 console warning/error 為 0；固定手機框仍出現既有 MutationObserver.observe 非 Node 錯誤，路線通過。未聲稱已修復此測試框問題。
- 正式 build 主 bundle 1459.58 kB、gzip 385.54 kB，超過 500 kB 為既有警告；本輪未另外驗證正式 dist 的瀏覽器執行期。
- 路線驗證後僅調整紅毯閒置提示，最終 check 仍通過，並再次目視紅毯提示。

## 驗證中修正

查票 fixture 起初重生尚未落地便向左離開岸邊，五次都成為 backtrack-exit，沒有觸發上升條件。改為落地後再左跳，實際取得五次 backtrack-audit；沒有放寬遊戲觸發或削弱碰撞。新局往右測試使用真正只往右的驅動器，避免舊最高援助路線的跳躍掩蓋道路缺口。

## 試玩與限制

`/tests/browser/shell-review.html?state=slimes` 在據點後向左跳可試回頭查票；`?state=max` 直接試紅毯。手機入口為 `/tests/browser/mobile-review.html?case=shellMax`，加 `&size=landscape` 切換橫向。以上獨立記憶體試玩不改正式存檔。

自動驗證與尺寸檢視通過，真人初見難度及真機多指觸控仍待試玩。美術與台詞是可替換的試作，未視為正式核准。不自行 commit／push／部署。
