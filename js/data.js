/* ════════ 遊戲資料設定（純資料，可帶去 Expo） ════════ */
/* 麵包種類：e=emoji備援, n=名稱, coin=售價, img=圖片 */
const BREAD = {
  plain: { e:'🥖', n:'原味', coin:20, img:'pic/bread/bread-normal.png' },
  straw: { e:'🍓', n:'草莓', coin:60, img:'pic/bread/bread-berry.png' },
  choco: { e:'🍫', n:'巧克力', coin:60, img:'pic/bread/bread-cho.png' },
  cream: { e:'🥐', n:'牛奶', coin:55, img:'pic/bread/bread-milk.png' },   // 烏龜波羅
  curry: { e:'🍛', n:'咖哩', coin:60, img:'pic/bread/bread-curry.png' },
};
/* 食材種類 */
const INGR = {
  straw: { e:'🍓', n:'草莓', img:'pic/ingredient/ingre-berry.png' },
  choco: { e:'🍫', n:'巧克力', img:'pic/ingredient/ingre-cho.png' },
  cream: { e:'🥛', n:'鮮奶', img:'pic/ingredient/ingre-milk.png' },
  curry: { e:'🍛', n:'咖哩粉', img:'pic/ingredient/ingre-curry.png' },
};
// 每種麵包在架上的固定擺放位置（x=左右, y=上下，%）
const BREAD_POS = {
  plain: { x:'18%', y:'78%' },   // 法國麵包：左
  choco: { x:'49%', y:'72%' },   // 巧克力甜甜圈：中上
  straw: { x:'80%', y:'71%' },   // 草莓夾餡：右上
  curry: { x:'47%', y:'86%' },   // 咖哩：中下
  cream: { x:'80%', y:'86%' },   // 烏龜波羅：右下
};
// 食材在廚房木桌上的固定擺放位置
const INGR_POS = {
  plain: { x:'12%', y:'83%' },   // 原味包（放入base槽）
  straw: { x:'32%', y:'83%' },   // 草莓
  choco: { x:'52%', y:'83%' },   // 巧克力
  cream: { x:'72%', y:'83%' },   // 鮮奶
  curry: { x:'91%', y:'83%' },   // 咖哩粉
};
