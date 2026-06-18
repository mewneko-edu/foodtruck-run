  /* ════════ 音樂控制 ════════ */
  let musicOn = true;          // 使用者是否開啟音樂
  let started = false;         // 是否已通過首次互動解鎖
  const bgM = document.getElementById('bgMusic');
  const runM = document.getElementById('runMusic');
  bgM.volume = 0.45; runM.volume = 0.32;

  // mode: 'bg' | 'run'
  function musicPlay(mode) {
    if (!musicOn || !started) return;
    if (mode === 'run') { bgM.pause(); runM.play().catch(()=>{}); }
    else { runM.pause(); bgM.play().catch(()=>{}); }
  }
  function toggleMusic() {
    musicOn = !musicOn;
    document.getElementById('soundBtn').textContent = musicOn ? '🔊' : '🔇';
    document.getElementById('musicState').textContent = musicOn ? '開啟' : '靜音';
    const ms = document.getElementById('musicSwitch'); if (ms) ms.checked = musicOn;
    if (!musicOn) { bgM.pause(); runM.pause(); }
    else { started = true; musicPlay(document.getElementById('running').classList.contains('active') ? 'run' : 'bg'); }
  }
  // 距離單位切換（公里 / 英里）
  function setUnit(btn, unit) {
    btn.parentElement.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  // 瀏覽器擋自動播放：第一次點畫面才開始
  function unlockMusic() {
    if (started) return;
    started = true;
    if (musicOn) musicPlay(document.getElementById('running').classList.contains('active') ? 'run' : 'bg');
    document.removeEventListener('pointerdown', unlockMusic);
  }
  document.addEventListener('pointerdown', unlockMusic);

  /* ════════ 狀態 ════════ */
  /* 麵包/食材的資料設定（BREAD, INGR, BREAD_POS, INGR_POS）已移到 js/data.js */
  let coins = 120, steps = 3240;
  let basket = { plain:3, straw:1, choco:1, cream:1, curry:1 };   // 麵包籃
  let ingr   = { straw:2, choco:1, cream:1, curry:1 };    // 食材倉庫
  let cookSlot = { base:null, flavor:null };     // 合成台

  /* ════════ 房間橫滑 ════════ */
  let roomIndex = 1; // 預設餐廳（中間）
  function goRoom(i) {
    roomIndex = Math.max(0, Math.min(2, i));
    document.getElementById('roomsTrack').style.transform = `translateX(-${roomIndex*33.333}%)`;
    document.querySelectorAll('#roomDots .dot').forEach((d,idx)=>d.classList.toggle('active', idx===roomIndex));
    document.getElementById('arrowL').style.visibility = roomIndex===0 ? 'hidden':'visible';
    document.getElementById('arrowR').style.visibility = roomIndex===2 ? 'hidden':'visible';
  }

  /* ════════ HUD ════════ */
  function updateHUD() {
    document.getElementById('coinHud').textContent = coins;
    document.getElementById('coinShop').textContent = coins;
  }

  /* ════════ 麵包籃 / 食材渲染 ════════ */
  // 有圖就用圖、沒圖就用 emoji
  function iconHTML(o) {
    return o.img ? `<img class="e" src="${o.img}" alt="${o.n}">` : `<span class="e">${o.e}</span>`;
  }
  function renderBasket() {
    const row = document.getElementById('basketRow');
    row.innerHTML = '';
    let any = false;
    for (const k in basket) {
      const n = basket[k];
      if (n <= 0) continue; any = true;
      const b = BREAD[k];
      const pos = BREAD_POS[k] || { x:'50%', y:'80%' };
      const el = document.createElement('div');
      el.className = 'bread'; el.dataset.type = k; el.title = b.n;
      el.style.left = pos.x; el.style.top = pos.y;
      el.innerHTML = `${iconHTML(b)}<span class="cnt">${n}</span>`;
      el.addEventListener('pointerdown', startDrag);
      row.appendChild(el);
    }
    if (!any) row.innerHTML = '<div class="basket-empty">架上空了…去跑步烤點麵包吧！動物快餓扁了 🥲</div>';
  }
  function renderWarehouse() {
    const row = document.getElementById('ingrRow');
    row.innerHTML = '';
    // 原味麵包（base 槽）
    if (basket.plain > 0) {
      const pos = INGR_POS.plain;
      const el = document.createElement('div');
      el.className = 'ingr'; el.onclick = loadBase;
      el.style.left = pos.x; el.style.top = pos.y;
      el.innerHTML = `${iconHTML(BREAD.plain)}<span class="cnt" style="background:var(--choco)">${basket.plain}</span>`;
      row.appendChild(el);
    }
    // 調味料（flavor 槽）
    for (const k in ingr) {
      if (ingr[k] <= 0) continue;
      const g = INGR[k];
      const pos = INGR_POS[k] || { x:'50%', y:'83%' };
      const el = document.createElement('div');
      el.className = 'ingr'; el.onclick = () => loadFlavor(k);
      el.style.left = pos.x; el.style.top = pos.y;
      el.innerHTML = `${iconHTML(g)}<span class="cnt">${ingr[k]}</span>`;
      row.appendChild(el);
    }
  }

  /* ════════ 拖曳餵食 ════════ */
  let dragGhost = null, dragType = null;
  function startDrag(e) {
    dragType = e.currentTarget.dataset.type;
    dragGhost = document.createElement('div');
    dragGhost.className = 'drag-ghost';
    dragGhost.innerHTML = iconHTML(BREAD[dragType]);
    document.body.appendChild(dragGhost);
    moveGhost(e);
    window.addEventListener('pointermove', moveGhost);
    window.addEventListener('pointerup', endDrag);
  }
  function moveGhost(e) {
    if (!dragGhost) return;
    dragGhost.style.left = e.clientX + 'px';
    dragGhost.style.top = e.clientY + 'px';
  }
  function endDrag(e) {
    window.removeEventListener('pointermove', moveGhost);
    window.removeEventListener('pointerup', endDrag);
    if (dragGhost) dragGhost.remove();
    // 命中測試：找動物
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const cust = target ? target.closest('.customer') : null;
    if (cust && basket[dragType] > 0) feed(cust, dragType, e.clientX, e.clientY);
    dragGhost = null; dragType = null;
  }
  function feed(cust, type, x, y) {
    if (cust.classList.contains('fed')) return;
    const want = cust.dataset.want;
    const match = want === type;
    const gain = match ? (BREAD[type].coin) : 20;
    basket[type]--;
    coins += gain;
    cust.classList.add('fed');
    const fedImg = cust.dataset.fedImg;
    if (fedImg) cust.querySelector('.body').innerHTML = `<img src="${fedImg}" alt="">`;
    else cust.querySelector('.body').textContent = match ? '😻' : '😋';
    cust.querySelector('.bubble').innerHTML = match ? '❤️' : '👍';
    // 浮動金幣
    const screen = document.getElementById('screen');
    const rect = screen.getBoundingClientRect();
    const fc = document.createElement('div');
    fc.className = 'float-coin'; fc.textContent = '+' + gain + ' 🪙';
    fc.style.left = (x - rect.left - 20) + 'px';
    fc.style.top = (y - rect.top - 30) + 'px';
    screen.appendChild(fc);
    setTimeout(()=>fc.remove(), 1000);
    updateHUD(); renderBasket();
    // 完成顧客需求（口味相符）→ 故事／感謝彈窗
    if (match) setTimeout(()=> showReward(cust.dataset.id, gain), 650);
    // 吃飽 → 淡出離開，換新客人補位
    const seatIdx = +cust.dataset.seat;
    setTimeout(()=>{
      cust.classList.add('leaving');
      setTimeout(()=>{
        cust.remove();
        const newId = pickNewCustomer();
        seated[seatIdx] = newId;
        const box = document.getElementById('customers');
        if (box) box.appendChild(makeCustomerEl(newId, seatIdx));
      }, 600);
    }, 1400);
  }

  /* ════════ 客人渲染（座位輪替）════════ */
  // 固定座位
  const SEATS = [ {x:'17%',y:'31.5%'}, {x:'56%',y:'24%'}, {x:'40%',y:'46%'} ];
  // 顧客資料庫：限定角色(sharkboi/ting) + 一般角色(rabbit/bear/cat)
  const CUST_DB = {
    sharkboi: { img:'pic/customer/customer-sharkboi.png', imgFed:'pic/customer/customer-love-sharkboi.png', want:'choco' },
    ting:     { img:'pic/customer/customer-ting.png', imgFed:'pic/customer/customer-love-ting.png', want:'curry' },
    toto:     { img:'pic/customer/customer-toto.png', imgFed:'pic/customer/customer-love-toto.png', want:'cream' },
    rabbit:   { face:'🐰', want:'straw' },
    bear:     { face:'🐻', want:'choco' },
    cat:      { face:'🐱', want:'plain' },
  };
  // 候補池：滿足後會從這裡輪流補位
  const POOL = ['sharkboi','ting','toto','rabbit','bear','cat'];
  let seated = [];   // 每個座位目前的顧客 id

  // 角色臉：有圖用圖、沒圖用 emoji
  function faceHTML(c, fed) {
    const src = fed ? c.imgFed : c.img;
    return src ? `<img src="${src}" alt="">` : (fed ? '😻' : c.face);
  }
  function makeCustomerEl(id, seatIdx) {
    const c = CUST_DB[id], seat = SEATS[seatIdx];
    const el = document.createElement('div');
    el.className = 'customer enter';
    el.dataset.want = c.want; el.dataset.id = id; el.dataset.seat = seatIdx;
    el.dataset.fedImg = c.imgFed || '';
    el.style.left = seat.x; el.style.top = seat.y;
    el.onclick = () => talk(id);
    el.innerHTML = `<div class="bubble">${iconHTML(BREAD[c.want])}</div><div class="body">${faceHTML(c, false)}</div>`;
    return el;
  }
  // 挑一位目前不在場的新客人
  function pickNewCustomer() {
    const avail = POOL.filter(id => !seated.includes(id));
    const list = avail.length ? avail : POOL;
    return list[Math.floor(Math.random() * list.length)];
  }
  function renderCustomers() {
    const box = document.getElementById('customers');
    box.innerHTML = '';
    seated = ['toto','sharkboi','ting'];
    seated.forEach((id, i) => box.appendChild(makeCustomerEl(id, i)));
  }

  /* ════════ 動物對話 / 任務 ════════ */
  const TALK = {
    sharkboi: { img:'pic/customer/customer-sharkboi.png', name:'SHARK BOI（鯊魚）', text:'「我是世界上最拉風的鯊魚！會衝浪、超有錢，還是巧虎的頭號粉絲。給我一個巧克力甜甜圈，我就在森林裡造浪帶你衝一波！」', quest:'募集 5 個巧克力甜甜圈，解鎖 SHARK BOI 的衝浪明信片。' },
    rabbit:   { face:'🐰', name:'波波（兔子）', text:'「我在等一個草莓口味的早餐～跑得到草莓的話，記得留一個給我喔！」', quest:null },
    ting:     { img:'pic/customer/customer-ting.png', name:'小廷', text:'「哈哈不知道為什麼突然想買五個咖哩麵包欸！雖然我只吃得下一個 :D」', quest:'賣給小廷一個咖哩麵包，解鎖她的明信片。' },
    toto:     { img:'pic/customer/customer-toto.png', name:'托托（烏龜）', text:'「我~非常喜歡~吃~麵包…尤其是~長得像~烏龜的~菠蘿麵包。但我~太慢了~每次~都買不到…拜託~給我一個~好嗎~？」', quest:'送托托一個菠蘿麵包，解鎖他的明信片。' },
    bear:     { face:'🐻', name:'阿棕（小熊）', text:'「最近壓力好大…聞到巧克力的香味，整個人都暖起來了。可以給我一個巧克力麵包嗎？」', quest:null },
    cat:      { face:'🐱', name:'小花（貓客人）', text:'「原味的最療癒了。你今天跑步畫出了什麼形狀的麵包呀？」', quest:null },
  };
  function talk(id) {
    const t = TALK[id]; if (!t) return;
    const tf = document.getElementById('talkFace');
    if (t.img) tf.innerHTML = `<img src="${t.img}" alt="${t.name}" style="height:84px;width:auto;">`;
    else tf.textContent = t.face;
    document.getElementById('talkName').textContent = t.name;
    document.getElementById('talkText').textContent = t.text;
    const q = document.getElementById('talkQuest');
    if (t.quest) { q.style.display='block'; document.getElementById('talkQuestText').textContent = t.quest; }
    else q.style.display='none';
    showModal('talkModal');
  }

  /* ════════ 完成顧客需求・獎勵 ════════ */
  // limited:true 限定角色 → 拿明信片＋完整故事；limited:false 一般角色 → 感謝彈窗
  const REWARD = {
    sharkboi: {
      limited: true,
      postcard: 'pic/postcard/postcard-sharkboi.png',
      title: '衝浪鯊魚',
      story: 'SHARK BOI 收到巧克力甜甜圈，開心到直接在森林裡造浪、帥氣衝了一波！「謝啦～這是世界上最拉風的鯊魚親簽明信片，收好囉！」',
      fullStory: '從前從前，有隻鯊魚（喜歡吃巧克力甜甜圈，因為他是巧虎的粉絲）在森林裡走著。你可能會想，鯊魚怎麼會在森林裡走呢？\n\n因為他不是普通的鯊魚，他是 SHARK BOI！！！世界上最拉風的鯊魚！\n\n你看！！！他會衝浪誒 oh my god！！！但你可能也會想，在森林裡要怎麼衝浪呢？你不用知道，反正他有錢，他可以在森林裡造浪。\n\n你看！！！是衝浪鯊魚！！！',
    },
    ting: {
      limited: true,
      postcard: 'pic/postcard/postcard-ting.png',
      title: '咖哩危機',
      story: '「噢耶！咖哩麵包！剩下四個我要帶回去給小如吃 :DDD」',
      fullStory: '小廷不知道為什麼突然買了 5 個咖哩麵包，對麵包過敏的小如又送他 5 個咖哩麵包，吃掉一個之後還剩下 9 個咖哩麵包。\n\n怎麼辦！還有好多咖哩麵包！於是小如就叫上了他的好夥伴——小鳥胃小婕和印度人，順利的只剩下 5.9 個咖哩麵包的麵包了！（還有一袋印度人送小廷的肉）\n\n最後，小廷把麵包和肉包成水餃丟進湖裡，被卡比寶寶和小如吃掉了。\n\n今天又是成功度過的一天！可以回家了！',
    },
    toto: {
      limited: true,
      postcard: 'pic/postcard/postcard-toto.png',
      title: '終於吃到麵包哩！',
      story: '托托收到夢寐以求、長得像烏龜的菠蘿麵包，慢慢地笑了。「太慢的烏龜…也能輕鬆吃到麵包了😭⭐😭👍 這座森林有跑跑麵包店真是太好了～」',
      fullStory: '從前從前~~\n有一隻~烏龜\n他~非常喜歡~吃~麵包\n麵包~是~他的生命\n麵包裡~他~最~喜歡\n吃~長的像~烏龜的~菠蘿麵包\n但是~他~每次~都~買不到\n因為~他~太慢了~\n但是他遇到了⭐跑⭐跑⭐麵⭐包⭐店⭐\n跑跑麵包店照顧每一位顧客！🥰🍉\n太慢的烏龜也能輕鬆🉐麵包😭⭐😭👍\n這座~森林~有~跑跑~麵包~店~真的太~好了~~~',
    },
    rabbit: {
      limited: false,
      face: '🐰',
      title: '波波好滿足～',
      thanks: '波波吃到夢寐以求的草莓麵包，耳朵都開心地豎了起來！「這就是完美的早晨～謝謝你特地為我跑這一趟！」',
    },
    bear: {
      limited: false,
      face: '🐻',
      title: '阿棕暖呼呼～',
      thanks: '阿棕咬下巧克力麵包，緊繃的肩膀慢慢放鬆了下來。「呼～壓力都融化了，謝謝你！」',
    },
    cat: {
      limited: false,
      face: '🐱',
      title: '小花心滿意足',
      thanks: '小花瞇起眼睛細細品嚐原味麵包。「最樸實的最療癒了…謝謝你陪我跑步畫麵包。」',
    },
  };
  function showReward(id, gain) {
    const r = REWARD[id]; if (!r) return;
    if (r.limited) {
      document.getElementById('rewardCard').innerHTML = `<img src="${r.postcard}" alt="${r.title}">`;
      document.getElementById('rewardTitle').textContent = r.title;
      document.getElementById('rewardStory').textContent = r.story || '';
      document.getElementById('rewardCoin').textContent = '+' + (gain || 0);
      document.getElementById('rewardGoBtn').onclick = () => goPostcard(id);
      showModal('rewardModal');
    } else {
      document.getElementById('thanksFace').textContent = r.face || '💕';
      document.getElementById('thanksTitle').textContent = r.title || '謝謝你！';
      document.getElementById('thanksStory').textContent = r.thanks || '';
      document.getElementById('thanksCoin').textContent = '+' + (gain || 0);
      showModal('thanksModal');
    }
  }
  // 從獎勵彈窗 → 導到圖鑑明信片頁並打開完整故事
  function goPostcard(id) {
    hideModal('rewardModal');
    showOverlay('book');
    setBookTab('card');
    setTimeout(() => showPostcard(id), 200);
  }
  // 明信片完整故事彈窗
  function showPostcard(id) {
    const r = REWARD[id]; if (!r || !r.postcard) return;
    document.getElementById('pcImg').src = r.postcard;
    document.getElementById('pcTitle').textContent = r.title;
    document.getElementById('pcStory').textContent = r.fullStory;
    showModal('postcardModal');
  }

  /* ════════ 廚房合成 ════════ */
  function loadBase() {
    if (basket.plain <= 0) return;
    cookSlot.base = 'plain';
    const s = document.getElementById('slotBase');
    s.classList.add('filled'); s.innerHTML = iconHTML(BREAD.plain);
    refreshCookBtn();
  }
  function loadFlavor(k) {
    if (ingr[k] <= 0) return;
    cookSlot.flavor = k;
    const s = document.getElementById('slotFlavor');
    s.classList.add('filled'); s.innerHTML = iconHTML(INGR[k]);
    refreshCookBtn();
  }
  function clearSlot(which) {
    cookSlot[which] = null;
    const s = document.getElementById(which==='base'?'slotBase':'slotFlavor');
    s.classList.remove('filled');
    s.innerHTML = which==='base' ? '<small style="bottom:6px;color:var(--sub);">原味包</small>' : '<small style="bottom:6px;color:var(--sub);">調味料</small>';
    refreshCookBtn();
  }
  function refreshCookBtn() {
    document.getElementById('cookBtn').disabled = !(cookSlot.base && cookSlot.flavor);
  }
  function doCook() {
    if (!(cookSlot.base && cookSlot.flavor)) return;
    const flavor = cookSlot.flavor;
    basket.plain--; ingr[flavor]--;
    const product = flavor; // straw/choco/cream → 對應特殊麵包
    basket[product] = (basket[product]||0) + 1;
    // 烤箱旋轉動畫
    const oven = document.querySelector('.oven');
    oven.style.animation = 'pop .4s';
    setTimeout(()=>oven.style.animation='', 400);
    // 結果彈窗
    const prod = BREAD[product];
    document.getElementById('cookEmoji').innerHTML = prod.img
      ? `<img src="${prod.img}" alt="${prod.n}" style="width:96px;height:96px;object-fit:contain;">`
      : prod.e;
    document.getElementById('cookName').textContent = prod.n + '麵包';
    clearSlot('base'); clearSlot('flavor');
    renderWarehouse(); renderBasket();
    showModal('cookModal');
  }

  /* ════════ 跑步流程 ════════ */
  let runTimer = null, runSec = 0, runKm = 0;
  function startRun() {
    showOverlay('running');
    musicPlay('run');
    runSec = 0; runKm = 0;
    document.getElementById('runDist').textContent = '0.00';
    document.getElementById('runTime').textContent = '00:00';
    document.getElementById('runKcal').textContent = '0';
    // 軌跡線條動畫重置
    const p = document.getElementById('trailPath');
    p.style.transition = 'none'; p.style.strokeDashoffset = '600';
    requestAnimationFrame(()=>{ p.style.transition='stroke-dashoffset 18s linear'; p.style.strokeDashoffset='0'; });
    clearInterval(runTimer);
    runTimer = setInterval(()=>{
      runSec++; runKm += 0.012 + Math.random()*0.004;
      const m = String(Math.floor(runSec/60)).padStart(2,'0');
      const s = String(runSec%60).padStart(2,'0');
      document.getElementById('runTime').textContent = `${m}:${s}`;
      document.getElementById('runDist').textContent = runKm.toFixed(2);
      document.getElementById('runKcal').textContent = Math.round(runKm*48);
    }, 1000);
  }
  function openBake() { hideOverlay('running'); musicPlay('bg'); showModal('bakeModal'); }
  function endRun() {
    clearInterval(runTimer);
    const dist = runKm > 0.05 ? runKm : 2.03;
    document.getElementById('bakeDist').textContent = dist.toFixed(2) + ' km';
    document.getElementById('bakeKcal').textContent = Math.round(dist*48);
    steps += Math.round(dist*1300);
    openBake();
  }
  function collectBake() {
    // 領取獎勵：原味+3、草莓+2、巧克力+1、隨機1個咖哩或鮮奶
    basket.plain += 3; ingr.straw += 2; ingr.choco += 1;
    const bonus = Math.random() < 0.5 ? 'curry' : 'cream';
    ingr[bonus] += 1;
    coins += 0;
    hideModal('bakeModal');
    updateHUD(); renderBasket(); renderWarehouse();
    goRoom(1);
    // 香氣吸客特效
    const a = document.getElementById('aroma');
    a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  }

  /* ════════ Overlay / Modal ════════ */
  function showOverlay(id) {
    document.getElementById(id).classList.add('active');
    document.getElementById('hudTop').classList.add('hidden');
    document.getElementById('hudBottom').classList.add('hidden');
    if (id==='book') renderBook('bread');
    if (id==='shop') renderShop('out');
  }
  function hideOverlay(id) {
    document.getElementById(id).classList.remove('active');
    if (!document.querySelector('.overlay.active')) {
      document.getElementById('hudTop').classList.remove('hidden');
      document.getElementById('hudBottom').classList.remove('hidden');
    }
  }
  function showModal(id){ document.getElementById(id).classList.add('active'); }
  function hideModal(id){ document.getElementById(id).classList.remove('active'); }

  /* ════════ 圖鑑 ════════ */
  const BOOK = {
    bread: [['pic/bread/bread-normal.png','原味軌跡',1],['pic/bread/bread-berry.png','草莓',1],['pic/bread/bread-cho.png','巧克力',1],['pic/bread/bread-milk.png','烏龜波羅',1],['pic/bread/bread-curry.png','咖哩',1],['🍞','蜂蜜吐司',0]],
    ingr:  [['pic/ingredient/ingre-berry.png','草莓',1],['pic/ingredient/ingre-cho.png','巧克力',1],['pic/ingredient/ingre-milk.png','鮮奶',1],['🌰','栗子',0],['🍯','蜂蜜',0],['🫐','藍莓',0]],
    card:  [['pic/postcard/postcard-sharkboi.png','衝浪鯊魚',1,'sharkboi'],['pic/postcard/postcard-ting.png','咖哩危機',1,'ting'],['pic/postcard/postcard-toto.png','慢吞吞托托',1,'toto'],['💌','滿月麵包節',0]],
    guest: [['pic/customer/customer-sharkboi.png','SHARK BOI',1],['pic/customer/customer-ting.png','小廷',1],['pic/customer/customer-toto.png','托托',1],['🐰','波波',1],['🐻','阿棕',1],['🐱','小花',1]],
  };
  // 切換圖鑑分頁（可程式呼叫）
  function setBookTab(k){
    document.querySelectorAll('#book .chip').forEach(c=> c.classList.toggle('active', c.dataset.tab===k));
    renderBook(k);
  }
  function switchBook(el,k){ setBookTab(k); }
  function renderBook(k){
    const g = document.getElementById('bookGrid'); g.innerHTML='';
    BOOK[k].forEach(([e,n,owned,storyId])=>{
      const c = document.createElement('div'); c.className = 'cell ' + (owned?'owned':'locked');
      const icon = owned
        ? (e.endsWith('.png') ? `<img class="big-img" src="${e}" alt="${n}">` : `<span class="big">${e}</span>`)
        : '<span class="big">❔</span>';
      c.innerHTML = `${icon}<span>${owned?n:'未解鎖'}</span>`;
      if (owned && storyId) { c.style.cursor='pointer'; c.title='點看完整故事'; c.onclick=()=>showPostcard(storyId); }
      g.appendChild(c);
    });
  }

  /* ════════ 商城 ════════ */
  const SHOP = {
    out: [['🎨','彩繪車身',80],['🌸','櫻花棚架',120],['🏮','森林燈籠',60],['🪟','圓窗戶',90],['🚩','店招旗幟',40],['⭐','星空車頂',200]],
    in:  [['🪑','藤編桌椅',70],['🕯️','暖光吊燈',90],['🖼️','掛畫',50],['🪴','盆栽',45],['🧸','娃娃角落',110],['📻','復古收音機',130]],
    kit: [['🔥','雙層烤箱',150],['🫙','調味料架',80],['🥣','大攪拌機',120],['🧊','保鮮櫃',100],['⚖️','電子秤',40],['🔪','烘焙工具組',60]],
  };
  function switchShop(el,k){ document.querySelectorAll('#shop .chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); renderShop(k); }
  function renderShop(k){
    const g = document.getElementById('shopGrid'); g.innerHTML='';
    SHOP[k].forEach(([e,n,p])=>{
      const c = document.createElement('div'); c.className='cell';
      c.innerHTML = `<span class="big">${e}</span><span>${n}</span><span class="price">🪙 ${p}</span>`;
      c.onclick = () => buyDeco(c, p, n);
      g.appendChild(c);
    });
  }
  function buyDeco(cell, price, name){
    if (cell.classList.contains('owned')) return;
    if (coins < price) { cell.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:200}); return; }
    coins -= price; updateHUD();
    cell.classList.add('owned');
    cell.querySelector('.price').textContent = '✓ 已擁有';
  }

  /* ════════ 簡報系統 ════════ */
  let currentSlide = 0; const totalSlides = 7;
  function toggleIntro(){
    const p = document.getElementById('introPanel');
    const hidden = p.style.display==='none' || p.style.display==='';
    if (hidden){ p.style.display='flex'; currentSlide=0; renderSlide(0); } else p.style.display='none';
  }
  function buildDots(){
    const d = document.getElementById('slideDots'); d.innerHTML='';
    for (let i=0;i<totalSlides;i++){ const o=document.createElement('div'); o.style.cssText=`width:8px;height:8px;border-radius:50%;background:${i===currentSlide?'#fff':'rgba(255,255,255,.3)'};cursor:pointer;`; o.onclick=()=>changeSlide(i-currentSlide); d.appendChild(o); }
    document.getElementById('slideCounter').textContent = `${currentSlide+1} / ${totalSlides}`;
  }
  function renderSlide(dir){
    const slides = document.querySelectorAll('.slide'); const inner = document.getElementById('slideInner');
    slides.forEach(s=>s.style.display='none'); slides[currentSlide].style.display='block';
    inner.style.opacity='0'; inner.style.transform=`translateX(${dir>0?'40px':dir<0?'-40px':'0'})`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ inner.style.opacity='1'; inner.style.transform='translateX(0)'; }));
    buildDots();
    document.getElementById('prevBtn').style.opacity = currentSlide===0?'.25':'1';
    document.getElementById('nextBtn').style.opacity = currentSlide===totalSlides-1?'.25':'1';
  }
  function changeSlide(dir){ const n=currentSlide+dir; if(n<0||n>=totalSlides) return; currentSlide=n; renderSlide(dir); }
  document.addEventListener('keydown', e=>{
    if (document.getElementById('introPanel').style.display!=='flex') return;
    if (e.key==='ArrowRight') changeSlide(1);
    if (e.key==='ArrowLeft') changeSlide(-1);
    if (e.key==='Escape') toggleIntro();
  });

  /* ════════ Touch swipe 切換房間 ════════ */
  (function(){
    const track = document.getElementById('roomsTrack');
    let sx = 0, dragging = false;
    track.addEventListener('pointerdown', e => {
      // 任何可點擊元件不觸發換房間
      if (e.target.closest('button,a,.bread,.ingr,.oven-area,.customer,.icon-btn,.swipe-arrow,.hud-bottom,.hud-top')) return;
      sx = e.clientX; dragging = true;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointerup', e => {
      if (!dragging) return; dragging = false;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 40) goRoom(roomIndex + (dx < 0 ? 1 : -1));
    });
    track.addEventListener('pointercancel', () => { dragging = false; });
  })();

  /* ════════ 初始化 ════════ */
  updateHUD(); renderBasket(); renderWarehouse(); renderCustomers(); goRoom(1);
