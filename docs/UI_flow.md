# 森林跑跑餐車 (Bake & Run) — UI Flow

## 一、整體導航流程

採「一體化三房間橫向滑動」結構：餐車外部 ← 餐廳內部（首頁） → 廚房內部。
頂部 HUD（設定 / 圖鑑 / 金幣 / 步數）與底部裝潢鈕**固定不隨滑動改變**。

```mermaid
flowchart TD
    Start([啟動 app]) --> RoomB

    %% 三房間橫滑
    RoomA["**A · 餐車外部**
    貓咪麵包車全景
    GO 麵包鈕"]
    RoomB["**B · 餐廳內部（首頁）**
    動物排隊 + 需求泡泡
    麵包籃（拖曳餵食）"]
    RoomC["**C · 廚房內部**
    食材倉庫 + 合成台"]

    RoomA <-->|左右滑動| RoomB
    RoomB <-->|左右滑動| RoomC

    %% 全局 HUD
    RoomB -->|⚙️ 設定| Settings["設定頁"]
    RoomB -->|📖 圖鑑| Book["收藏圖鑑
    麵包/食材/明信片/客人"]
    RoomB -->|🛠️ 底部裝潢鈕| Shop["裝潢商城
    外裝/內飾/廚房"]
    Settings -->|返回| RoomB
    Book -->|返回| RoomB
    Shop -->|花金幣購買| Shop
    Shop -->|返回| RoomB

    %% 跑步主流程
    RoomA ==>|按下 GO| Running["**跑步中**
    配速 / 時間 / 卡路里
    軌跡線條即時生成
    暫停鈕"]
    Running -.->|暫停| PausePopup[/"暫停 popup
    繼續 / 結束"/]
    PausePopup -->|繼續| Running
    PausePopup -->|結束| Bake
    Running ==>|結束·出爐| Bake

    Bake["**烘焙完成結算**
    專屬軌跡麵包
    +原味麵包 +隨機食材"]
    Bake ==>|進店上架（香氣特效）| RoomB

    %% 餐廳互動
    RoomB -.->|拖曳麵包到動物| Feed{"口味相符？"}
    Feed -->|是| BigCoin["+60 🪙 動物超開心"]
    Feed -->|否| SmallCoin["+20 🪙 動物吃飽"]
    BigCoin --> RoomB
    SmallCoin --> RoomB
    RoomB -.->|點動物| Talk[/"動物對話 popup
    療癒對話 / 發布任務"/]
    Talk -->|關閉| RoomB

    %% 廚房合成
    RoomC -.->|放入原味包＋調味料| Cook["按下烘焙合成"]
    Cook --> CookResult[/"合成結果 popup
    獲得特殊麵包"/]
    CookResult -->|去餐廳擺攤| RoomB
    CookResult -->|繼續合成| RoomC

    %% 樣式
    classDef popup fill:#FBEFD9,stroke:#C08E63,stroke-dasharray: 5 5
    classDef main fill:#FBE9CC,stroke:#E87E96,stroke-width:3px
    classDef shop fill:#E8F0DC,stroke:#94BE73
    classDef book fill:#FDEEF2,stroke:#E87E96

    class PausePopup,Talk,CookResult popup
    class RoomA,RoomB,RoomC,Running,Bake main
    class Shop shop
    class Book book
```

---

## 二、核心循環（跑步 → 資源 → 經營 → 動機）

```mermaid
flowchart LR
    Run["🏃‍♀️ 現實跑步"] -->|里程·配速·GPS| Res["🥖 獲得資源
    軌跡麵包＋食材"]
    Res -->|融合| Cook["🔥 廚房合成
    特殊麵包"]
    Cook -->|擺攤| Shop["🍽️ 餐廳經營
    餵食動物賺金幣"]
    Run -.->|直接上架原味包| Shop
    Shop -->|金幣| Deco["🛠️ 裝潢擴建"]
    Deco -->|想要新裝潢| Run
    Shop -->|想餵飽更多動物| Run
    Cook -->|想合成稀有麵包| Run

    classDef action fill:#BCD9A0,stroke:#94BE73
    classDef reward fill:#FBD792,stroke:#F2C45E
    classDef goal fill:#F4A6B8,stroke:#E87E96,color:#fff

    class Run action
    class Res,Cook reward
    class Shop,Deco goal
```

整個循環的設計核心是**白帽動機**：
- **同理心**：「動物餓了想被照顧」取代「我得去運動」的壓力
- **創造力**：GPS 路線 → 獨一無二的軌跡麵包形狀，數據變創作
- **擁有感**：稀有調味料合成、解鎖圖鑑與餐車裝潢

---

## 三、所有畫面清單

| # | 畫面 | 類型 | 入口 |
|---|---|---|---|
| 1 | A · 餐車外部 | 房間（橫滑） | 左滑 / 圓點 |
| 2 | B · 餐廳內部（首頁） | 房間（橫滑） | App 啟動預設 |
| 3 | C · 廚房內部 | 房間（橫滑） | 右滑 / 圓點 |
| 4 | 跑步中 | 全頁 overlay | 餐車外部 GO 鈕 |
| 5 | 烘焙完成結算 | 全頁 overlay | 跑步結束 |
| 6 | 收藏圖鑑 | 全頁 overlay | HUD 📖 |
| 7 | 裝潢商城 | 全頁 overlay | 底部 🛠️ |
| 8 | 設定 | 全頁 overlay | HUD ⚙️ |
| 9 | 暫停 | Popup | 跑步中暫停鈕 |
| 10 | 動物對話 / 任務 | Popup | 餐廳點動物 |
| 11 | 合成結果 | Popup | 廚房烘焙合成 |

3 個房間 + 5 個全頁 + 3 個 popup，互動畫面共 11 種。

---

## 四、值得注意的設計細節

**1. 一體化三房間橫滑**
不用底部 tab bar，三個餐車空間左右連通；HUD 與裝潢鈕固定，視覺上始終待在「同一輛餐車裡」，沉浸感更強。

**2. 軌跡麵包是核心亮點**
跑步時下方線條會「即時畫出」，結束時這條路線就變成當次專屬的麵包形狀——把枯燥的距離數據轉成獨一無二的收集物。

**3. 拖曳餵食 + 口味配對**
從麵包籃把麵包拖到動物身上即可餵食。口味符合需求泡泡 → 大量金幣（特殊麵包）；不符 → 基礎金幣。直覺、有即時正向回饋。

**4. 香氣防空店機制**
店內沒麵包動物會離開；跑步結束「進店上架」時冒出香氣特效，重新吸引動物——把「跑步」和「店裡熱鬧起來」直接接上。

**5. 兩段式音樂**
主畫面播背景音樂，進入跑步模式自動切換成跑步音樂，出爐後切回。HUD 與設定頁都能開關。

**6. 經濟循環收束在裝潢**
餵食賺的金幣用於裝潢商城，改變三個房間的視覺場景，強化長期留存與成就感。
