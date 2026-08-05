<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const searchKeyword = ref('')
const navItems = [
  { label: '專案瀏覽', icon: '👤', to: '/GroupShop' },
  { label: '團購紀錄', icon: '↺', to: '/GroupShop/orders' },
  { label: '會員專區', icon: '🎖' },
  { label: '設定', icon: '⚙' },
  { label: '登出', icon: '⏻' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
// 購物車商品數量：目前為假資料，之後請改接實際購物車狀態（如 Pinia store）
const cartCount = ref(3)

// 商品目錄：原價 + 兩階層團購價（滿N人即可享該階層價格）
const products = ref([
  {
    id: 1,
    name: '團購短T',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop',
    listPrice: 340,
    tiers: [
      { qty: 5, price: 306 },
      { qty: 10, price: 221 }
    ],
    currentCount: 12
  },
  {
    id: 2,
    name: '團購牛仔褲',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop',
    listPrice: 430,
    tiers: [
      { qty: 10, price: 387 },
      { qty: 20, price: 310 }
    ],
    currentCount: 22
  },
  {
    id: 3,
    name: '團購洋裝',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop',
    listPrice: 520,
    tiers: [
      { qty: 10, price: 468 },
      { qty: 15, price: 374 }
    ],
    currentCount: 15
  },
  {
    id: 4,
    name: '團購針織外套',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&auto=format&fit=crop',
    listPrice: 700,
    tiers: [
      { qty: 10, price: 630 },
      { qty: 15, price: 610 }
    ],
    currentCount: 8
  },
  {
    id: 5,
    name: '團購百褶裙',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=400&auto=format&fit=crop',
    listPrice: 700,
    tiers: [
      { qty: 10, price: 630 },
      { qty: 15, price: 467 }
    ],
    currentCount: 12
  },
  {
    id: 6,
    name: '團購托特包',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop',
    listPrice: 880,
    tiers: [
      { qty: 15, price: 792 },
      { qty: 25, price: 711 }
    ],
    currentCount: 25
  },
  {
    id: 7,
    name: '團購後背包',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop',
    listPrice: 1060,
    tiers: [
      { qty: 10, price: 954 },
      { qty: 20, price: 727 }
    ],
    currentCount: 5
  },
  {
    id: 8,
    name: '團購遮陽帽',
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&auto=format&fit=crop',
    listPrice: 1060,
    tiers: [
      { qty: 10, price: 954 },
      { qty: 20, price: 727 }
    ],
    currentCount: 14
  },
  {
    id: 9,
    name: '團購針織帽',
    imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&auto=format&fit=crop',
    listPrice: 1150,
    tiers: [
      { qty: 10, price: 1035 },
      { qty: 30, price: 909 }
    ],
    currentCount: 9
  }
])

// 目前已解鎖的階層（尚未達第一階層則回傳 null）
const currentTierOf = (p) => {
  let tier = null
  for (const t of p.tiers) {
    if (p.currentCount >= t.qty) tier = t
  }
  return tier
}

// 目前可享團購價（尚未解鎖任何階層則顯示原價）
const currentPriceOf = (p) => currentTierOf(p)?.price ?? p.listPrice

// 最終階層（滿最多人數的那個階層）
const finalTierOf = (p) => p.tiers[p.tiers.length - 1]

const isCompleted = (p) => p.currentCount >= finalTierOf(p).qty

const completedProducts = computed(() => products.value.filter(p => isCompleted(p)))
const ongoingProducts = computed(() => products.value.filter(p => !isCompleted(p)))

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)
</script>

<template>
  <div class="clo-shell">
    <header class="clo-header">
      <router-link to="/GroupShop" class="clo-brand">
        <span class="brand-main">CLO</span>
        <span class="brand-sub">CLO.things</span>
      </router-link>

      <div class="clo-search">
        <input v-model="searchKeyword" type="text" placeholder="搜尋項目" />
        <button class="search-btn" type="button" aria-label="搜尋">🔍</button>
      </div>

      <div class="clo-user">
        <span class="user-greet">你好，{{ memberName }}</span>
        <router-link to="/GroupShop/checkout" class="cart-link">
          <span class="cart-icon">🛒</span>
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
    <div class="page-header mb-4">
      <h2 class="fw-bold mb-1">團購專案首頁</h2>
      <p class="text-muted small mb-0">瀏覽所有進行中與完成的團購專案</p>
    </div>

    <section class="mb-4">
      <div class="section-title bg-done">
        <span>✅</span> 已達團購數量 (完成)
      </div>
      <div class="product-grid">
        <div v-for="p in completedProducts" :key="p.id" class="product-card">
          <router-link :to="`/GroupShop/product/${p.id}`" class="card-img-wrap">
            <img :src="p.imageUrl" class="card-img" :alt="p.name" />
          </router-link>
          <div class="card-info">
            <h6 class="fw-bold mb-1">{{ p.name }}</h6>
            <div class="d-flex justify-content-between small text-muted">
              <span>已有 {{ p.currentCount }} 人參加</span>
              <span class="text-success fw-bold">滿{{ finalTierOf(p).qty }}人已成團</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fw-bold">團購價 ${{ formatCurrency(currentPriceOf(p)) }}</span>
              <span class="badge-status badge-done">已成團</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="section-title bg-ongoing">
        <span>⏰</span> 未達團購數量 (進行中)
      </div>
      <div class="product-grid">
        <div v-for="p in ongoingProducts" :key="p.id" class="product-card">
          <router-link :to="`/GroupShop/product/${p.id}`" class="card-img-wrap">
            <img :src="p.imageUrl" class="card-img" :alt="p.name" />
          </router-link>
          <div class="card-info">
            <h6 class="fw-bold mb-1">{{ p.name }}</h6>
            <div class="d-flex justify-content-between small text-muted">
              <span>已有 {{ p.currentCount }} 人參加</span>
              <span class="text-accent fw-bold">滿{{ finalTierOf(p).qty }}人享最低團購價</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fw-bold">團購價 ${{ formatCurrency(currentPriceOf(p)) }}</span>
              <router-link :to="`/GroupShop/product/${p.id}`" class="btn btn-main btn-sm">
                加入此團購
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page-header h2 { color: #4a3e3d; }

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.bg-done { background-color: #4a7c59; }
.bg-ongoing { background-color: #b8524f; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.product-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
  display: flex;
  flex-direction: column;
}

.card-img-wrap {
  position: relative;
  display: block;
}
.card-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.card-info {
  padding: 12px 14px 14px;
  color: #4a3e3d;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.text-accent { color: #b87352; }

.badge-status {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
}
.badge-done {
  background-color: #e4efe8;
  color: #4a7c59;
}

.btn-main {
  background-color: #4a3e3d;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.8rem;
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

.clo-brand {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-decoration: none;
  color: #4a3e3d;
  flex-shrink: 0;
}
.brand-main {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 2px;
}
.brand-sub {
  font-size: 0.65rem;
  letter-spacing: 1px;
  color: #b87352;
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
  color: #4a3e3d;
  text-decoration: none;
  font-size: 1.3rem;
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