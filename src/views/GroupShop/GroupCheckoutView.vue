<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()

const searchKeyword = ref('')
const navItems = [
  { label: '專案瀏覽', icon: '👤', to: '/GroupShop' },
  { label: '團購紀錄', icon: '↺', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
const router = useRouter()

// 購物車存放於 localStorage，與商品詳情頁的「加入此團購」共用同一份資料
const CART_KEY = 'cloCart'

const readCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    if (Array.isArray(saved)) return saved
  } catch {
    // 讀取失敗則視為空購物車
  }
  return []
}

const cartItems = reactive(readCart())

// 品項增減、數量調整時同步寫回 localStorage
watch(cartItems, () => {
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems))
}, { deep: true })

// 團購加購專區（可為空陣列，無加購商品時不顯示此區塊）
const addonItems = reactive([])

const removeItem = (id) => {
  const idx = cartItems.findIndex(i => i.id === id)
  if (idx !== -1) cartItems.splice(idx, 1)
}

const unitPriceOf = (item) => item.unlockedPrice ?? item.listPrice

const allItems = computed(() => [...cartItems, ...addonItems])

const subtotal = computed(() =>
  allItems.value.reduce((sum, i) => sum + unitPriceOf(i) * i.qty, 0)
)

// 滿 $1,000 免運，未滿則加收運費 $60
const freight = computed(() => (subtotal.value >= 1000 ? 0 : 60))

const grandTotal = computed(() => subtotal.value + freight.value)

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

const continueShopping = () => {
  router.push('/GroupShop')
}

const handleCheckout = () => {
  router.push('/GroupShop/checkout/confirm')
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
          <span class="cart-badge">{{ allItems.length }}</span>
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
    <div class="row g-4">
      <!-- 左側：購物車內容 -->
      <div class="col-lg-8">
        <h4 class="fw-bold mb-3">購物車 ({{ cartItems.length }})</h4>

        <div class="cart-list-card mb-4">
          <div v-if="cartItems.length === 0" class="empty-cart">
            購物車目前是空的，快去挑選喜歡的商品加入團購吧！
          </div>
          <div v-for="item in cartItems" :key="item.id" class="cart-row">
            <img :src="item.imageUrl" class="cart-img" :alt="item.name" />
            <div class="cart-item-info">
              <h6 class="fw-bold mb-1">{{ item.name }}</h6>
              <div class="d-flex align-items-center gap-2 mb-1">
                <label class="small text-muted mb-0">數量</label>
                <input type="number" min="1" v-model.number="item.qty" class="qty-input" />
              </div>
              <p class="small text-muted mb-0">
                團購價 ${{ formatCurrency(unitPriceOf(item)) }}
              </p>
            </div>
            <div class="cart-item-price">
              <span class="fw-bold">$ {{ formatCurrency(unitPriceOf(item) * item.qty) }}</span>
              <button class="remove-btn" @click="removeItem(item.id)">🗑 移除</button>
            </div>
          </div>
        </div>

        <div v-if="addonItems.length > 0" class="addon-card">
          <div class="addon-header">團購加購專區</div>
          <div v-for="item in addonItems" :key="item.id" class="addon-row">
            <img :src="item.imageUrl" class="cart-img" :alt="item.name" />
            <div class="cart-item-info">
              <h6 class="fw-bold mb-1">{{ item.name }}</h6>
              <div class="d-flex align-items-center gap-2 mb-1">
                <label class="small text-muted mb-0">數量</label>
                <input type="number" min="1" v-model.number="item.qty" class="qty-input" />
              </div>
              <p class="small text-muted mb-0">
                團購價 ${{ formatCurrency(unitPriceOf(item)) }}
              </p>
            </div>
            <div class="cart-item-price">
              <span class="fw-bold">小計 ${{ formatCurrency(unitPriceOf(item) * item.qty) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：購物車摘要 -->
      <div class="col-lg-4">
        <div class="summary-panel">
          <h6 class="fw-bold summary-title">購物車摘要</h6>
          <div class="summary-body">
            <div class="d-flex justify-content-between mb-2">
              <span>商品小計</span>
              <span class="fw-bold">${{ formatCurrency(subtotal) }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2">
              <span>運費</span>
              <span class="fw-bold">
                <template v-if="freight === 0">團購免運</template>
                <template v-else>${{ formatCurrency(freight) }}</template>
              </span>
            </div>
            <p class="small text-muted shipping-hint mb-0">
              {{ freight === 0 ? '已滿 $1,000，享免運優惠' : `未滿 $1,000，加收運費 $60（還差 $${formatCurrency(1000 - subtotal)} 即可免運）` }}
            </p>

            <hr />

            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-bold fs-6">最終應付金額</span>
              <span class="fw-bold fs-4 text-accent">${{ formatCurrency(grandTotal) }}</span>
            </div>

            <button class="btn btn-outline w-100 mb-2" @click="continueShopping">繼續購物</button>
            <button
              class="btn btn-main w-100"
              :disabled="allItems.length === 0"
              @click="handleCheckout"
            >
              前往結帳
            </button>
          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.text-accent { color: #b87352; }

.cart-list-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
  overflow: hidden;
}

.cart-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1e7de;
}
.cart-row:last-child { border-bottom: none; }

.cart-img {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.cart-item-info { flex: 1; min-width: 0; }

.qty-input {
  width: 56px;
  padding: 2px 6px;
  border: 1px solid #d8c3b5;
  border-radius: 6px;
  text-align: center;
}


.cart-item-price {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.remove-btn {
  border: none;
  background: none;
  color: #a9998e;
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
}
.remove-btn:hover { color: #b8524f; }

.addon-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}
.addon-header {
  background-color: #3d3332;
  color: #fff;
  font-weight: 700;
  padding: 10px 20px;
}
.addon-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

.summary-panel {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(74, 62, 61, 0.12);
  position: sticky;
  top: 20px;
}
.summary-title {
  background-color: #3d3332;
  color: #fff;
  margin: 0;
  padding: 14px 20px;
}
.summary-body {
  padding: 18px 20px;
  color: #4a3e3d;
}

.shipping-hint {
  font-size: 0.78rem;
}

.empty-cart {
  padding: 40px 20px;
  text-align: center;
  color: #a9998e;
  font-size: 0.9rem;
}

.btn-main {
  background-color: #4a3e3d;
  color: #fff;
  border: none;
  padding: 12px 14px;
  border-radius: 6px;
  font-weight: 700;
}
.btn-main:hover {
  background-color: #362d2c;
  color: #fff;
}
.btn-main:disabled {
  background-color: #d8c3b5;
  color: #fff;
  cursor: not-allowed;
}
.btn-main:disabled:hover {
  background-color: #d8c3b5;
}
.btn-outline {
  background-color: #fff;
  color: #4a3e3d;
  border: 1px solid #d8c3b5;
  padding: 12px 14px;
  border-radius: 6px;
  font-weight: 700;
}
.btn-outline:hover {
  background-color: #f1e7de;
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