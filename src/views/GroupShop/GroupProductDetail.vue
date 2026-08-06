<script setup>
// ====================================================================
// 這是「商品詳情頁」：顯示單一團購商品的詳細資訊、目前累積訂購件數、
// 團購價格階層，以及「加入此團購」的按鈕。
// ====================================================================

// 從 vue 套件匯入兩個常用工具：
// ref      -> 用來建立「會變動的資料」（響應式資料），資料一變畫面就跟著更新
// computed -> 用來建立「根據其他資料自動算出來的值」，來源資料一變它就自動重算
import { ref, computed } from 'vue'

// vue-router 提供的工具：
// useRoute  -> 可以讀到目前網址的資訊（例如網址列的 :id 參數）
// useRouter -> 可以用程式的方式切換頁面（例如按下按鈕後跳轉到別的網址）
import { useRoute, useRouter } from 'vue-router'

// 團購購物車 store：之前分散在各頁面自己讀寫 localStorage 的購物車邏輯，
// 現在統一由這個 store 管理，這裡只要「用」它提供的資料跟方法就好
import { useGroupCartStore } from '@/stores/groupCart'
// 已成立訂單累計件數 store：讓「已訂購件數」把已送出的訂單也算進去
import { useGroupCommittedStore } from '@/stores/groupCommitted'

const route = useRoute()   // 目前這一頁的路由資訊（網址、參數等）
const router = useRouter() // 用來做「跳轉頁面」的工具
const cartStore = useGroupCartStore() // 購物車 store 的實體
const committedStore = useGroupCommittedStore() // 已成立訂單累計件數 store 的實體

// 搜尋欄位輸入的文字，透過 v-model 跟畫面上的 <input> 綁在一起

// 左側選單要顯示的項目清單（純資料，不是響應式也沒關係，因為內容不會變動）
const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]

// 判斷某個選單項目是不是「目前所在的頁面」，是的話會加上 active 樣式（醒目提示）
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
// localStorage 是瀏覽器提供的「本機儲存空間」，資料存在使用者的電腦裡，重新整理網頁也不會消失
const memberName = ref(localStorage.getItem('memberName') || '會員')

// 購物車商品數量：直接從 store 拿，購物車頁、詳情頁看到的都是同一份資料，
// 只要 store 裡的內容一變，這裡就會自動跟著更新，不用再自己解析 localStorage
const cartCount = computed(() => cartStore.items.length)

// 商品目錄：原價 + 兩階層團購價（滿N件即可享該階層價格），需與商品列表頁資料一致
// 這裡先用寫死的假資料模擬「後端資料庫」，之後接真正的 API 時可以整段替換掉
const catalog = ref([
  {
    id: 1,
    name: '團購短T',
    imageUrl: 'https://picsum.photos/seed/clo-shortT/900/500',
    listPrice: 340,        // 原價（沒有達到任何團購階層時的價格）
    tiers: [                // 團購階層：件數(qty) 達標後，單價就變成 price
      { qty: 5, price: 306 },
      { qty: 10, price: 221 }
    ],
    currentCount: 12,       // 目前系統紀錄「已經有多少人訂購」的基礎件數
    intro: '團購短T選用親膚純棉布料，透氣不悶熱，簡約百搭款式適合日常穿搭。訂購件數越多，單價越低，滿額即可解鎖團購價。'
  },
  {
    id: 2,
    name: '團購牛仔褲',
    imageUrl: 'https://picsum.photos/seed/clo-jeans/900/500',
    listPrice: 430,
    tiers: [
      { qty: 10, price: 387 },
      { qty: 20, price: 310 }
    ],
    currentCount: 22,
    intro: '合身直筒版型，耐磨丹寧布料，百搭日常單品，訂購件數越多單價越低。'
  },
  {
    id: 3,
    name: '團購洋裝',
    imageUrl: 'https://picsum.photos/seed/clo-dress/900/500',
    listPrice: 520,
    tiers: [
      { qty: 10, price: 468 },
      { qty: 15, price: 374 }
    ],
    currentCount: 15,
    intro: '輕柔垂墜布料，修飾版型好穿易搭，適合上班或約會多種場合。'
  },
  {
    id: 4,
    name: '團購針織外套',
    imageUrl: 'https://picsum.photos/seed/clo-knit-jacket/900/500',
    listPrice: 700,
    tiers: [
      { qty: 10, price: 630 },
      { qty: 15, price: 610 }
    ],
    currentCount: 8,
    intro: '柔軟針織布料，保暖不厚重，簡約百搭適合四季疊穿。'
  },
  {
    id: 5,
    name: '團購百褶裙',
    imageUrl: 'https://picsum.photos/seed/clo-skirt/900/500',
    listPrice: 700,
    tiers: [
      { qty: 10, price: 630 },
      { qty: 15, price: 467 }
    ],
    currentCount: 12,
    intro: '細緻百褶剪裁，走動間自然垂墜，甜美與正式感兼具。'
  },
  {
    id: 6,
    name: '團購托特包',
    imageUrl: 'https://picsum.photos/seed/clo-totebag/900/500',
    listPrice: 880,
    tiers: [
      { qty: 15, price: 792 },
      { qty: 25, price: 711 }
    ],
    currentCount: 25,
    intro: '大容量托特包，耐用帆布材質，通勤上課都好用。'
  },
  {
    id: 7,
    name: '團購後背包',
    imageUrl: 'https://picsum.photos/seed/clo-backpack/900/500',
    listPrice: 1060,
    tiers: [
      { qty: 10, price: 954 },
      { qty: 20, price: 727 }
    ],
    currentCount: 5,
    intro: '多夾層設計，減壓背帶，通勤旅行都好背。'
  },
  {
    id: 8,
    name: '團購遮陽帽',
    imageUrl: 'https://picsum.photos/seed/clo-sunhat/900/500',
    listPrice: 1060,
    tiers: [
      { qty: 10, price: 954 },
      { qty: 20, price: 727 }
    ],
    currentCount: 14,
    intro: '寬帽緣有效遮陽，透氣布料久戴不悶熱。'
  },
  {
    id: 9,
    name: '團購針織帽',
    imageUrl: 'https://picsum.photos/seed/clo-beanie/900/500',
    listPrice: 1150,
    tiers: [
      { qty: 10, price: 1035 },
      { qty: 30, price: 909 }
    ],
    currentCount: 9,
    intro: '柔軟針織毛帽，保暖百搭，秋冬穿搭必備單品。'
  }
])

// 依網址上的商品 id 取得對應商品，找不到則預設第一筆
// 例如網址是 /GroupShop/product/3，route.params.id 拿到的就是字串 "3"
const product = computed(() => {
  const id = Number(route.params.id) // 網址參數是文字，要轉成數字才能跟 catalog 裡的 id 比對
  return catalog.value.find(p => p.id === id) || catalog.value[0]
})

// 讀取購物車裡此商品目前的數量：直接從 store 裡的 items 陣列找
const cartQtyOf = (id) => {
  const item = cartStore.items.find(i => i.id === id)
  return item ? item.qty : 0
}

// 目前已訂購件數 = 基礎件數 + 已成立訂單累計件數 + 購物車裡實際加入的數量
// 這樣使用者把商品加進購物車、或送出訂單後，畫面上的「已訂購件數」跟「解鎖階層」才能正確反映
const orderedQty = computed(() => product.value.currentCount + committedStore.committedQtyOf(product.value.id) + cartQtyOf(product.value.id))

// 目前已解鎖的階層（尚未達第一階層則回傳 null）
// 做法：把每個階層都檢查一次，只要件數有達到，就把 tier 更新成該階層（陣列後面的階層件數較多，所以會覆蓋成最新解鎖的那個）
const currentTier = computed(() => {
  let tier = null
  for (const t of product.value.tiers) {
    if (orderedQty.value >= t.qty) tier = t
  }
  return tier
})

// 目前應該顯示的單價：有解鎖階層就用階層價，否則用原價
const currentUnitPrice = computed(() => currentTier.value ? currentTier.value.price : product.value.listPrice)

// 最終階層（陣列最後一個，也就是件數門檻最高、價格最低的那個階層）
const finalTier = computed(() => product.value.tiers[product.value.tiers.length - 1])

// 尚未解鎖的下一階層（找第一個「件數門檻」比目前已訂購件數還高的階層）
const nextTier = computed(() =>
  product.value.tiers.find(t => t.qty > orderedQty.value)
)

// 進度條百分比：目前件數 / 最終階層件數，最多顯示到 100%
const progressPercent = computed(() =>
  Math.min(100, Math.round((orderedQty.value / finalTier.value.qty) * 100))
)

// 判斷某個階層是否已經解鎖（用來在畫面上顯示打勾或鎖頭的 SVG 圖示）
const isTierUnlocked = (tier) => orderedQty.value >= tier.qty

// 把數字格式化成「千分位」顯示，例如 1234 會變成 1,234，方便閱讀價格
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 按下「加入此團購」時執行的動作
const handleJoin = () => {
  // 把「目前是否已解鎖團購價」的計算結果，跟商品基本資料一起交給 store，
  // 至於「購物車裡有沒有這個商品、要新增還是把數量+1」，store 的 addItem 裡都處理好了
  cartStore.addItem({
    id: product.value.id,
    name: product.value.name,
    imageUrl: product.value.imageUrl,
    listPrice: product.value.listPrice,
    unlockedPrice: currentTier.value ? currentUnitPrice.value : null
  })
  router.push('/GroupShop/checkout') // 加入後直接跳轉到購物車頁面
}
</script>

<template>
  <div class="clo-shell">
    <!-- ============ 頁面最上方：會員名稱 + 購物車圖示 ============ -->
    <header class="clo-header">
      <div class="clo-user">
        <span class="user-greet">你好，{{ memberName }}</span>
        <!-- router-link 是 vue-router 提供的「頁面內連結」，點下去不會整頁重新整理，只切換內容 -->
        <router-link to="/GroupShop/checkout" class="cart-link">
          <span class="cart-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </span>
          <!-- 購物車數量小紅點，數字來自上面的 cartCount -->
          <span class="cart-badge">{{ cartCount }}</span>
        </router-link>
      </div>
    </header>

    <div class="clo-body">
      <!-- ============ 左側選單 ============ -->
      <aside class="clo-sidebar">
        <nav class="sidebar-nav">
          <!-- v-for 用來把 navItems 陣列裡的每一筆資料，重複產生一個對應的選單項目 -->
          <!-- :key 是給 Vue 用來辨識每個項目的獨一無二標籤，通常會用不會重複的欄位 -->
          <template v-for="item in navItems" :key="item.label">
            <router-link
              v-if="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ active: isActive(item.to) }"
            >
              <span class="nav-icon">
                <!-- 依 item.icon 的值，顯示對應的嵌入式 SVG 圖示（v-if / v-else-if 只會顯示符合條件的那一個） -->
                <svg v-if="item.icon === 'user'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <svg v-else-if="item.icon === 'history'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              </span>
              <span>{{ item.label }}</span>
            </router-link>
            <div v-else class="nav-item">
              <span class="nav-icon">
                <!-- 依 item.icon 的值，顯示對應的嵌入式 SVG 圖示（v-if / v-else-if 只會顯示符合條件的那一個） -->
                <svg v-if="item.icon === 'user'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <svg v-else-if="item.icon === 'history'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              </span>
              <span>{{ item.label }}</span>
            </div>
          </template>
        </nav>

      </aside>

      <!-- ============ 主要內容區：商品詳情 ============ -->
      <main class="clo-main">
    <router-link to="/GroupShop" class="back-link mb-3">
      ← 返回商品列表
    </router-link>
    <div class="row g-4">
      <!-- 左側：主商品 -->
      <div class="col-lg-8">
        <div class="hero-card">
          <img :src="product.imageUrl" class="hero-img" :alt="product.name" />
          <div class="hero-info">
            <h4 class="fw-bold mb-2">{{ product.name }}</h4>
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>已訂購 {{ orderedQty }} 件</span>
              <span>
                <span class="fw-bold text-accent">$ {{ formatCurrency(currentUnitPrice) }}</span>
                <!-- v-if：只有已經解鎖團購價的時候，才會顯示「已解鎖」標籤 -->
                <span v-if="currentTier" class="unlocked-tag">已解鎖</span>
              </span>
            </div>
            <!-- 還有下一階層可以解鎖時，顯示「還差幾件」的提示 -->
            <div v-if="nextTier" class="d-flex justify-content-between small text-muted">
              <span>滿 {{ nextTier.qty }} 件可享團購價</span>
              <span>還差 {{ nextTier.qty - orderedQty }} 件，下階至 $ {{ formatCurrency(nextTier.price) }}</span>
            </div>
            <!-- 已經到最高階層（沒有 nextTier）時，顯示已達最低團購價 -->
            <div v-else class="d-flex justify-content-between small text-muted">
              <span>已滿 {{ finalTier.qty }} 件，享最低團購價</span>
            </div>
          </div>
        </div>

        <div class="panel-card mt-4">
          <h6 class="fw-bold mb-3">團購目標與階層價格</h6>
          <!-- 進度條：用 style 動態綁定寬度，寬度百分比來自 progressPercent -->
          <div class="progress-track mb-1">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-3">
            <span>目前 {{ orderedQty }} 件 / 滿 {{ finalTier.qty }} 件成團</span>
            <span class="fw-bold text-main">原價 ${{ formatCurrency(product.listPrice) }}</span>
          </div>

          <!-- 把每個團購階層都列出來，並依是否解鎖顯示不同圖示與樣式 -->
          <ul class="tier-list mb-0">
            <li v-for="t in product.tiers" :key="t.qty" :class="{ locked: !isTierUnlocked(t) }">
              <span class="tier-icon">
                <!-- 已解鎖顯示打勾圖示，未解鎖顯示鎖頭圖示 -->
                <svg v-if="isTierUnlocked(t)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              滿 {{ t.qty }} 件：團購價 ${{ formatCurrency(t.price) }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 右側：專案詳情 -->
      <div class="col-lg-4">
        <div class="side-card dark-card p-3">
          <h6 class="fw-bold mb-2">團購專案詳情 (募資中)</h6>
          <p class="small mb-2 label-title">商品介紹</p>
          <p class="small mb-3 desc-text">{{ product.intro }}</p>

          <!-- @click 綁定按鈕點擊事件，按下去就會執行上面 script 裡定義的 handleJoin -->
          <button class="btn btn-main w-100 mt-3" @click="handleJoin">加入此團購</button>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 以下都是外觀樣式（顏色、間距、排版），跟商品邏輯無關，可以先不用管 */
.text-main { color: #4a3e3d; }
.text-accent { color: #b87352; }

.hero-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}
.hero-img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
}
.hero-info {
  padding: 16px 20px;
}
.unlocked-tag {
  font-size: 0.7rem;
  color: #4a7c59;
  margin-left: 4px;
}

.panel-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}

.progress-track {
  height: 10px;
  background-color: #ebdcd0;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background-color: #b87352;
}

.tier-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tier-list li {
  padding: 6px 0;
  font-size: 0.88rem;
  color: #4a3e3d;
  border-bottom: 1px dashed #e6dccf;
}
.tier-list li:last-child { border-bottom: none; }
.tier-list li.locked {
  color: #a9998e;
}
.tier-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
}

.side-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}

.dark-card {
  background-color: #3d3332;
  color: #f1e7de;
}
.label-title {
  font-weight: 700;
  color: #fff;
}
.desc-text {
  color: #cbb9ac;
}

.back-link {
  display: inline-block;
  font-size: 0.88rem;
  color: #6e5f5c;
  text-decoration: none;
}
.back-link:hover {
  color: #4a3e3d;
  text-decoration: underline;
}

.btn-main {
  background-color: #4a3e3d;
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
}
.btn-main:hover {
  background-color: #362d2c;
  color: #fff;
}

.clo-shell {
  min-height: 100vh;
  background-color: #f8f5f0;
  color: #4a3e3d;
}

.clo-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 28px;
  background-color: #fff;
  border-bottom: 1px solid #e6dccf;
}


.clo-user {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-left: auto;
  flex-shrink: 0;
}
.user-greet {
  font-size: 0.9rem;
  white-space: nowrap;
}
.cart-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  color: #4a3e3d;
  text-decoration: none;
}
.cart-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background-color: #b87352;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.clo-body {
  display: flex;
  align-items: flex-start;
}

.clo-sidebar {
  width: 220px;
  flex-shrink: 0;
  min-height: calc(100vh - 65px);
  background-color: #f8f5f0;
  border-right: 1px solid #e6dccf;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: #6e5f5c;
  text-decoration: none;
  font-size: 0.92rem;
  border-left: 3px solid transparent;
  cursor: pointer;
}
.nav-item:hover {
  background-color: #f1e7de;
}
.nav-item.active {
  color: #4a3e3d;
  font-weight: 700;
  background-color: #ebdcd0;
  border-left-color: #b87352;
}
.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
}


.clo-main {
  flex: 1;
  padding: 28px 32px;
  min-width: 0;
}

@media (max-width: 900px) {
  .clo-sidebar { width: 72px; }
  .nav-item span:last-child { display: none; }
}
</style>