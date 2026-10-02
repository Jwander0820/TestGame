# SPEC-0021 後台驗證

使用獨立 `sessionStorage` 測試命名空間，不讀寫正式旅程。啟動 `npm.cmd run dev -- --host 127.0.0.1`。

## 路線

`/tests/browser/backstage.html?case=...` 以正式 ActionState、角色速度與 Phaser 碰撞從主線起點攀上兩層平台，再往左起跳進入房間，沒有瞬移到入口的捷徑。

| case | 驗證內容 |
| --- | --- |
| workshop | 三次站定試彈、三次碰鈴、三次回頭抓包、移開重裝，零死返回並完成主線 |
| springPause | 同上，另在第一次空中暫停 750ms，比對有效時間與互動計數凍結 |
| dodge（預設） | 躲過施工牌、工作台及兩個可選互動、返回主線零死完成 |
| hit | 故意站在落牌下，被局部復位後完成探索與主線；應維持 0 死 |
| repeat | 同局拜訪兩次、第二次立即退出、發現紀錄只有一筆 |
| reload | 房內真實 reload，從既有主線據點重新走入，只播再次拜訪文案 |
| pause | 落牌預告中暫停 750ms，確認主線睡眠與房內有效時間停止後完成 |
| immediate | 進房直接向右離開，不觸發工作台／落牌亦能通關 |
| five | 五次第一段金幣死亡援助的保存狀態，進房、探索與返回；在返回處停止，計數仍為 5 |
| max | 已保存的 21 死紅毯狀態仍可走可選階梯進房，返回後只向右通關 |
| checkpoint | 已保存林間據點與紅毯，從據點走回起點探房，返回不覆蓋據點，繼續完成 |

加 `&review=1` 會停在施工牌預告前緣，按「暫停／繼續」接續路線，或「接手試玩」使用鍵盤／下方三鍵。一般重新載入重設該測試資料；`reload` 模式的第二趟保留第一趟資料。

`#playtest-result` 的 `data-status="completed"` 表示該路線通過。`data-isolated` 比對房內前後整份主線 levels 與死亡數，`data-main-frozen` 比對主線有效時間，`data-egg-count` 檢查獨立旗標只存一筆。`hit` 額外確認房內從落牌位置被送回入口，而非把最後走到出口誤當作復位。

## 矩陣與正式介面

- `/tests/browser/backstage-suite.html?group=room`：hit、repeat、max、reload。
- `?group=workshop`：三次試彈、空中暫停、原落牌命中與重訪。
- `?group=boundary`：pause、immediate、five、checkpoint。
- `?group=regression`：原本只向右與左出界精確 21 死、停留金幣精確 1 死、主線零死。
- `/tests/browser/shell-review.html?state=backstage`：正式外框與選單；按開始後自動走到後台，再交還鍵盤／觸控。使用記憶體進度。
- `?state=workshop`：自動沿正常路線躲過落牌，走到彈簧台後交還操作；站定試彈，落地後走開再回台可重玩。
- `/tests/browser/mobile-review.html?case=workshopPlay`：固定 375×667 正式外框；加 `&size=landscape` 為 667×375。`?case=workshop` 在手機框跑三次試彈整關驗證。

新機制通過另需 `data-springs=3`、`data-bells=3`、`data-catches>=3` 與 `data-worker-changes>=4`。狀態測試涵蓋取消、離台重裝、單次碰鈴、掃掠、漏鈴、發射後地面訊號殘留及兩側朝向／抓包冷卻。

矩陣 iframe 的測試寬度不是手機驗收尺寸。視覺驗收另外以正式外框 1280×800、375×667、667×375 截圖，並檢查暫停、返回標示、觸控目標及文字遮擋。真實手機觸控仍需真人驗收。

單元測試另覆蓋：起跳資格跨物理步進、地面／死亡排除、入口與返回幾何、650ms 落牌邊界與掃掠碰撞、讀字最短時間、多指輸入清除、保存與結局資料隔離。
