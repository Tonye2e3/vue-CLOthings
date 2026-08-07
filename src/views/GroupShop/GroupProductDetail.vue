<script setup>

import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
// 已成立訂單累計件數 store：讓「已訂購件數」把已送出的訂單也算進去
import { useGroupCommittedStore } from '@/stores/groupCommitted'

const route = useRoute()  
const router = useRouter() 
const cartStore = useGroupCartStore() 
const committedStore = useGroupCommittedStore() 

// 左側選單要顯示的項目清單
const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]

// 判斷某個選單項目是不是「目前所在的頁面」，是的話會加上 active 樣式（醒目提示）
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')

// 購物車商品數量：直接從 store 拿，購物車頁、詳情頁看到的都是同一份資料，
// 只要 store 裡的內容一變，這裡就會自動跟著更新，不用再自己解析 localStorage
const cartCount = computed(() => cartStore.items.length)

// 商品目錄：原價 + 兩階層團購折扣（滿N件即可享該階層折扣，實際團購價 = 原價 × 折扣），需與商品列表頁資料一致
// 這裡先用寫死的假資料模擬「後端資料庫」
const catalog = ref([
  {
    id: 1,
    name: '團購短T',
    imageUrl: 'https://picsum.photos/seed/clo-shortT/900/500',
    listPrice: 340,        // 原價（沒有達到任何團購階層時的價格）
    tiers: [                // 團購階層：件數(qty) 達標後，單價 = listPrice × discount
      { qty: 5, discount: 0.9 },
      { qty: 10, discount: 0.65 }
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
      { qty: 10, discount: 0.9 },
      { qty: 20, discount: 0.72 }
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
      { qty: 10, discount: 0.9 },
      { qty: 15, discount: 0.72 }
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
      { qty: 10, discount: 0.9 },
      { qty: 15, discount: 0.87 }
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
      { qty: 10, discount: 0.9 },
      { qty: 15, discount: 0.67 }
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
      { qty: 15, discount: 0.9 },
      { qty: 25, discount: 0.81 }
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
      { qty: 10, discount: 0.9 },
      { qty: 20, discount: 0.69 }
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
      { qty: 10, discount: 0.9 },
      { qty: 20, discount: 0.69 }
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
      { qty: 10, discount: 0.9 },
      { qty: 30, discount: 0.79 }
    ],
    currentCount: 9,
    intro: '柔軟針織毛帽，保暖百搭，秋冬穿搭必備單品。'
  }
])

// 依網址上的商品 id 取得對應商品，找不到則預設第一筆
const product = computed(() => {
  const id = Number(route.params.id) // 網址參數是文字，要轉成數字才能跟 catalog 裡的 id 比對
  return catalog.value.find(p => p.id === id) || catalog.value[0]
})

// 讀取購物車裡此商品目前的數量
const cartQtyOf = (id) => {
  const item = cartStore.items.find(i => i.id === id)
  return item ? item.qty : 0
}

// 目前已訂購件數 = 基礎件數 + 已成立訂單累計件數 + 購物車裡實際加入的數量
const orderedQty = computed(() => product.value.currentCount + committedStore.committedQtyOf(product.value.id) + cartQtyOf(product.value.id))

// 目前已解鎖的階層（尚未達第一階層則回傳 null）
const currentTier = computed(() => {
  let tier = null
  for (const t of product.value.tiers) {
    if (orderedQty.value >= t.qty) tier = t
  }
  return tier
})

// 依「原價 × 折扣」算出該階層的團購價（四捨五入到整數元）
const tierPriceOf = (tier) => Math.round(product.value.listPrice * tier.discount)

// 目前應該顯示的單價：有解鎖階層就用階層價，否則用原價
const currentUnitPrice = computed(() => currentTier.value ? tierPriceOf(currentTier.value) : product.value.listPrice)

// 第二階層
const finalTier = computed(() => product.value.tiers[product.value.tiers.length - 1])

// 第一階層
const nextTier = computed(() =>
  product.value.tiers.find(t => t.qty > orderedQty.value)
)

// 進度條百分比：目前件數 / 最終階層件數，最多顯示到 100%
const progressPercent = computed(() =>
  Math.min(100, Math.round((orderedQty.value / finalTier.value.qty) * 100))
)

// 圓形進度條的幾何參數：半徑固定，周長依半徑算出，再依百分比算出要留白的長度
const ringRadius = 46
const ringCircumference = 2 * Math.PI * ringRadius
const ringDashOffset = computed(() => ringCircumference * (1 - progressPercent.value / 100))

// 判斷某個階層是否已經解鎖
const isTierUnlocked = (tier) => orderedQty.value >= tier.qty

// 把數字格式化成「千分位」顯示，例如 1234 會變成 1,234，方便閱讀價格
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 按下「加入此團購」時執行的動作
const handleJoin = () => {
  // 把「目前是否已解鎖團購價」的計算結果，購物車裡有沒有這個商品、要新增還是把數量+1
  cartStore.addItem({
    id: product.value.id,
    name: product.value.name,
    imageUrl: product.value.imageUrl,
    listPrice: product.value.listPrice,
    unlockedPrice: currentTier.value ? currentUnitPrice.value : null
  })
  router.push('/GroupShop/checkout') // 加入後直接到購物車頁面
}
</script>

<template>
  <div class="clo-shell">
    <!-- 購物車圖示改為右下角浮動按鈕，見頁面最下方 -->
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
                <!-- 顯示對應的嵌入式 SVG 圖示 -->
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
                <!-- 已經解鎖團購價的時候，才會顯示「已解鎖」-->
                <span v-if="currentTier" class="unlocked-tag">已解鎖</span>
              </span>
            </div>
            <!-- 還有下一階層可以解鎖時，顯示「還差幾件」的提示 -->
            <div v-if="nextTier" class="d-flex justify-content-between small text-muted">
              <span>滿 {{ nextTier.qty }} 件可享團購價</span>
              <span>還差 {{ nextTier.qty - orderedQty }} 件，下階至 $ {{ formatCurrency(tierPriceOf(nextTier)) }}</span>
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
              滿 {{ t.qty }} 件：團購價 ${{ formatCurrency(tierPriceOf(t)) }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 右側：專案詳情 -->
      <div class="col-lg-4">
        <div class="side-card dark-card p-3">
          <!-- 圓圈進度條：顯示目前募資進度百分比 -->
          <div class="ring-wrap">
            <svg viewBox="0 0 120 120" class="progress-ring" width="120" height="120">
              <circle class="ring-track" cx="60" cy="60" r="46" fill="none" stroke-width="10" />
              <circle
                class="ring-fill"
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke-width="10"
                :stroke-dasharray="ringCircumference"
                :stroke-dashoffset="ringDashOffset"
              />
            </svg>
            <span class="ring-label">{{ progressPercent }}%</span>
          </div>

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

    <!-- ============ 浮動購物車按鈕（右下角，點擊直接跳到購物車畫面） ============ -->
    <router-link to="/GroupShop/checkout" class="floating-cart" aria-label="前往購物車">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
    </router-link>
  </div>
</template>

<style scoped>
/* 以下都是外觀樣式（顏色、間距、排版），跟商品邏輯無關，可以先不用管 */

/* 把重複用到的顏色集中定義成變數，之後要改主題色只要改這裡，不用每個地方都找一次 */
.clo-shell {
  --color-text: #4a3e3d;         /* 主要文字色（深咖啡） */
  --color-text-muted: #6e5f5c;   /* 次要文字色（淺咖啡） */
  --color-muted: #a9998e;        /* 更淡的灰咖啡（未解鎖階層） */
  --color-accent: #b87352;       /* 強調色（按鈕、進度條、標籤） */
  --color-success: #4a7c59;      /* 成功色（已解鎖標籤） */
  --color-bg-page: #f8f5f0;      /* 頁面底色 */
  --color-border: #e6dccf;       /* 淺邊框線 */
  --color-hover-bg: #f1e7de;     /* 滑鼠移過去的底色（也用在深色卡片文字） */
  --color-active-bg: #ebdcd0;    /* 選單被選中的底色（也用在進度條底色） */
  --color-dark: #3d3332;         /* 深色卡片底（團購專案詳情） */
  --color-dark-hover: #362d2c;   /* 深色按鈕的 hover 狀態 */
  --color-desc-text: #cbb9ac;    /* 深色卡片裡的說明文字 */

  min-height: 100vh;
  background-color: var(--color-bg-page);
  color: var(--color-text);
}

.text-main { color: var(--color-text); }
.text-accent { color: var(--color-accent); }

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
  color: var(--color-success);
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
  background-color: var(--color-active-bg);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
}

.tier-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tier-list li {
  padding: 6px 0;
  font-size: 0.88rem;
  color: var(--color-text);
  border-bottom: 1px dashed var(--color-border);
}
.tier-list li:last-child { border-bottom: none; }
.tier-list li.locked {
  color: var(--color-muted);
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
  background-color: var(--color-dark);
  color: var(--color-hover-bg);
}
.label-title {
  font-weight: 700;
  color: #fff;
}
.desc-text {
  color: var(--color-desc-text);
}

.ring-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 4px auto 16px;
}
.progress-ring {
  transform: rotate(-90deg);
}
.ring-track {
  stroke: rgba(255, 255, 255, 0.18);
}
.ring-fill {
  stroke: var(--color-success);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease;
}
.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
}

.back-link {
  display: inline-block;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  text-decoration: none;
}
.back-link:hover {
  color: var(--color-text);
  text-decoration: underline;
}

.btn-main {
  background-color: var(--color-text);
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
}
.btn-main:hover {
  background-color: var(--color-dark-hover);
  color: #fff;
}

.floating-cart {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background-color: var(--color-text);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(74, 62, 61, 0.3);
  text-decoration: none;
  z-index: 100;
}
.floating-cart:hover {
  background-color: var(--color-dark-hover);
}
.cart-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background-color: var(--color-accent);
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
  background-color: var(--color-bg-page);
  border-right: 1px solid var(--color-border);
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
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.92rem;
  border-left: 3px solid transparent;
  cursor: pointer;
}
.nav-item:hover {
  background-color: var(--color-hover-bg);
}
.nav-item.active {
  color: var(--color-text);
  font-weight: 700;
  background-color: var(--color-active-bg);
  border-left-color: var(--color-accent);
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