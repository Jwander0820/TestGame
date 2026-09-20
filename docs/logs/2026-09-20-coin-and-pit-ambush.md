# 金幣誘餌與第一坑連環伏擊

- 日期：2026-09-20（Asia/Taipei）
- 規格：[SPEC-0009](../specs/SPEC-0009-coin-and-pit-ambush.md)
- 來源：使用者要求金幣改成惡意、第一坑增加空氣磚與向上殺傷物，讓援助吐槽有前面的受苦經驗支撐。

## 實作

第一坑接近岸邊即發射一次向上飛行物，晚跳軌跡另有隱藏磚。已知解法是在岸上引出攻擊、等它飛走，再以原跳距通過；新增機關不改角色速度、重力或輸入。

左側 8 枚既有金幣與坑內 1 枚誘餌共用惡意行為：碰到轉紅，300ms 後成為 48×48 殺傷區，維持 480ms。停留會死，持續離開有幾何餘裕。原本金幣慶祝浮動改成武裝／爆開演出；原有彩蛋發現與記錄仍保留。

新死因全部計入 first-gap。第 3 次撤除空氣磚並顯示金幣危險外框；第 5 次連同飛行物、金幣及落點王徽停用；第 7 次仍鋪橋。沿用既有援助 ID 與存檔版本，沒有清除／重算玩家紀錄。

狀態使用有效遊玩時間，不用牆鐘推算機關，因此暫停／死亡不偷跑計時。重生清掉已武裝金幣與飛行物，但保留線索和已觸發的援助。所有碰撞 Zone 與圖形分開，死因文字集中在內容檔，保留後續抽換能力。

試玩頁沿用 art-review.html URL，補上即時死亡／事件文字與三鍵觸控。上方進度切換只是測試工具，不是正式遊戲難度選單。

## 技術驗證

- npm.cmd run check：18 檔、74 tests 通過；TypeScript 與正式 build 通過。
- 新增純狀態／路線測試：飛行一次、重生重新上膛、金幣延遲且不因重複接觸延長、援助取消已武裝陷阱、重載效果順序、持續移動逃出金幣傷害區、岸邊引誘／等待／重生重設。
- 新增暫停 fixture 後再次 typecheck 通過。
- 主 bundle 約 1,440 kB，gzip 379.48 kB；既有 >500 kB 警告保留。

## 實際瀏覽器

| 入口／操作 | 結果 |
| --- | --- |
| zero-assist.html | completed，0 死；岸邊引出後通過第一坑 |
| pit-malice.html?case=riser | completed，剛好 5 次 first-pit-riser，兩個援助後通關 |
| pit-malice.html?case=brick | completed，剛好 3 次 first-pit-air-brick，一個援助後通關 |
| pit-malice.html?case=coin | completed，1 次 bait-coin-burst；重生後主線完成，沒有誤計其他死因 |
| pit-malice.html?case=pause，375×667 | 空中暫停 1 秒，pauseHeld=true；恢復後仍 5 次上竄死因並完成，未跳過攻擊時序 |
| max-assistance.html，375×667 | completed，保持原預置 21 死，9 個援助，沒有新增死亡 |
| reverse-easter-egg.html，1280×900 | 金幣及時撤離、真實 reload、彩蛋不重播、折返主線 0 死；console 0 警告／錯誤 |
| progress-reload.html | 真實 reload，恢復 after-first-gap／14 死／6 援助，維持 14 死完成；console 0 警告／錯誤 |
| trap-learning.html | 維持原 8 死：落點頂板 3、假斷路空中伏擊 5，沒有新增非預期死因 |
| static-production.html，1280×900 | 11 死完成；checkpoint 繼續／重玩／結算／真實 reload 保存通過；console 0 警告／錯誤，originalProgressRestored=true |

以上皆為本輪真實引擎結果；正式產物以鍵盤事件操作，其他測試以 ActionState 驅動。`git diff --check` 通過。手機 viewport 是版面與引擎路線證據，不代表真人多指觸控已驗收。

## 尚待真人確認

惡意感、第一次死亡是否能看懂原因、重試節奏及多指觸控手感仍需真人試玩。美術與文字繼續暫留；本輪只增加必要機關呈現與三句暫用死因文字。未提交、未部署。
