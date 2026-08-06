<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const navItems = [
  { label: '專案瀏覽', icon: '👤', to: '/GroupShop' },
  { label: '團購紀錄', icon: '↺', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
// 購物車商品數量：讀取與購物車頁共用的 localStorage 資料，跨頁面即時反映實際品項數
const cartCount = computed(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('cloCart') || '[]')
    return Array.isArray(saved) ? saved.length : 0
  } catch {
    return 0
  }
})

// 商品目錄：原價 + 兩階層團購價（滿N件即可享該階層價格），需與商品列表頁資料一致
const catalog = ref([
  {
    id: 1,
    name: '團購短T',
    imageUrl: 'https://picsum.photos/seed/clo-shortT/900/500',
    listPrice: 340,
    tiers: [
      { qty: 5, price: 306 },
      { qty: 10, price: 221 }
    ],
    currentCount: 12,
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
const product = computed(() => {
  const id = Number(route.params.id)
  return catalog.value.find(p => p.id === id) || catalog.value[0]
})

// 購物車存放於 localStorage，跨頁面共用同一份資料
const CART_KEY = 'cloCart'
const readCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}
const writeCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items))

// 讀取購物車裡此商品目前的數量
const cartQtyOf = (id) => {
  const item = readCart().find(i => i.id === id)
  return item ? item.qty : 0
}

// 目前已訂購件數 = 基礎件數 + 購物車裡實際加入的數量
const orderedQty = computed(() => product.value.currentCount + cartQtyOf(product.value.id))

// 目前已解鎖的階層（尚未達第一階層則回傳 null）
const currentTier = computed(() => {
  let tier = null
  for (const t of product.value.tiers) {
    if (orderedQty.value >= t.qty) tier = t
  }
  return tier
})

const currentUnitPrice = computed(() => currentTier.value ? currentTier.value.price : product.value.listPrice)

// 最終階層（滿最多件數的那個階層）
const finalTier = computed(() => product.value.tiers[product.value.tiers.length - 1])

// 尚未解鎖的下一階層
const nextTier = computed(() =>
  product.value.tiers.find(t => t.qty > orderedQty.value)
)

const progressPercent = computed(() =>
  Math.min(100, Math.round((orderedQty.value / finalTier.value.qty) * 100))
)

const isTierUnlocked = (tier) => orderedQty.value >= tier.qty

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

const handleJoin = () => {
  const cart = readCart()
  const existing = cart.find(i => i.id === product.value.id)
  if (existing) {
    existing.qty += 1
    existing.unlockedPrice = currentTier.value ? currentUnitPrice.value : null
  } else {
    cart.push({
      id: product.value.id,
      name: product.value.name,
      imageUrl: product.value.imageUrl,
      listPrice: product.value.listPrice,
      unlockedPrice: currentTier.value ? currentUnitPrice.value : null,
      qty: 1
    })
  }
  writeCart(cart)
  router.push('/GroupShop/checkout')
}
</script>

<template>
  <div class="clo-shell">
    <header class="clo-header">
      <div class="clo-search">
        <input v-model="searchKeyword" type="text" placeholder="搜尋項目" />
        <button class="search-btn" type="button" aria-label="搜尋">🔍</button>
      </div>

      <div class="clo-user">
        <span class="user-greet">你好，{{ memberName }}</span>
        <router-link to="/GroupShop/checkout" class="cart-link">
          <span class="cart-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </span>
          <span class="cart-badge">{{ cartCount }}</span>
        </router-link>
      </div>
    </header>

    <div class="clo-body">
      <aside class="clo-sidebar">
        <nav class="sidebar-nav">
          <template v-for="item in navItems" :key="item.label">
            <router-link
              v-if="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ active: isActive(item.to) }"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </router-link>
            <div v-else class="nav-item">
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </div>
          </template>
        </nav>

      </aside>

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
                <span v-if="currentTier" class="unlocked-tag">已解鎖</span>
              </span>
            </div>
            <div v-if="nextTier" class="d-flex justify-content-between small text-muted">
              <span>滿 {{ nextTier.qty }} 件可享團購價</span>
              <span>還差 {{ nextTier.qty - orderedQty }} 件，下階至 $ {{ formatCurrency(nextTier.price) }}</span>
            </div>
            <div v-else class="d-flex justify-content-between small text-muted">
              <span>已滿 {{ finalTier.qty }} 件，享最低團購價</span>
            </div>
          </div>
        </div>

        <div class="panel-card mt-4">
          <h6 class="fw-bold mb-3">團購目標與階層價格</h6>
          <div class="progress-track mb-1">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-3">
            <span>目前 {{ orderedQty }} 件 / 滿 {{ finalTier.qty }} 件成團</span>
            <span class="fw-bold text-main">原價 ${{ formatCurrency(product.listPrice) }}</span>
          </div>

          <ul class="tier-list mb-0">
            <li v-for="t in product.tiers" :key="t.qty" :class="{ locked: !isTierUnlocked(t) }">
              <span class="tier-icon">{{ isTierUnlocked(t) ? '✔' : '🔒' }}</span>
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

          <button class="btn btn-main w-100 mt-3" @click="handleJoin">加入此團購</button>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
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
  display: inline-block;
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


.clo-search {
  flex: 1;
  max-width: 480px;
  display: flex;
  align-items: center;
  background-color: #f1e7de;
  border-radius: 999px;
  padding: 6px 8px 6px 18px;
}
.clo-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: #4a3e3d;
}
.clo-search input::placeholder {
  color: #a9998e;
}
.search-btn {
  border: none;
  background-color: #4a3e3d;
  color: #fff;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
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
  width: 18px;
  text-align: center;
}


.clo-main {
  flex: 1;
  padding: 28px 32px;
  min-width: 0;
}

@media (max-width: 900px) {
  .clo-search { display: none; }
  .clo-sidebar { width: 72px; }
  .nav-item span:last-child { display: none; }
}
</style>