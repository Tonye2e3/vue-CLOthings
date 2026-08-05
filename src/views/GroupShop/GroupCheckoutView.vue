<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
const router = useRouter()

// 主購物車項目：第一筆帶入從 Product 頁面傳來的選擇，其餘為模擬假資料
const cartItems = reactive([
  {
    id: 1,
    name: route.query.productName || '時尚休閒連帽衛衣',
    spec: route.query.specName || '米白色 (早鳥專案)',
    qty: parseInt(route.query.qty) || 2,
    listPrice: 1280,
    unlockedPrice: parseInt(route.query.unitPrice) || 1200,
    imageUrl: 'https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=200&auto=format&fit=crop'
  },
  {
    id: 2,
    name: '復古格紋寬褲',
    spec: '咖啡色 (經典專案)',
    qty: 1,
    listPrice: 1580,
    unlockedPrice: 1485,
    imageUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=200&auto=format&fit=crop'
  },
  {
    id: 3,
    name: '有機棉圓領 T-shirt',
    spec: '純白',
    qty: 1,
    listPrice: 980,
    unlockedPrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&auto=format&fit=crop'
  }
])

// 團購加購專區（可為空陣列，無加購商品時不顯示此區塊）
const addonItems = reactive([])

const shippingOption = ref('group') // group: 團購免運 / standard: 一般運費

const removeItem = (id) => {
  const idx = cartItems.findIndex(i => i.id === id)
  if (idx !== -1) cartItems.splice(idx, 1)
}

const unitPriceOf = (item) => item.unlockedPrice ?? item.listPrice

const allItems = computed(() => [...cartItems, ...addonItems])

const subtotal = computed(() =>
  allItems.value.reduce((sum, i) => sum + unitPriceOf(i) * i.qty, 0)
)

const freight = computed(() => (shippingOption.value === 'group' ? 0 : 60))

// 團購價與原價的差額總和，即折扣金額
const discountAmount = computed(() => {
  return allItems.value.reduce((sum, i) => {
    if (!i.unlockedPrice) return sum
    return sum + (i.listPrice - i.unlockedPrice) * i.qty
  }, 0)
})

const estimatedTotal = computed(() => subtotal.value + freight.value)
const grandTotal = computed(() => estimatedTotal.value)

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

const continueShopping = () => {
  router.push('/GroupShop')
}

const handleCheckout = () => {
  alert('🎉 模擬結帳成功！即將轉導至訂單列表頁面。')
  router.push('/GroupShop/orders')
}
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
          <div v-for="item in cartItems" :key="item.id" class="cart-row">
            <img :src="item.imageUrl" class="cart-img" :alt="item.name" />
            <div class="cart-item-info">
              <h6 class="fw-bold mb-1">{{ item.name }} - {{ item.spec }}</h6>
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
              <h6 class="fw-bold mb-1">{{ item.name }} {{ item.spec }}</h6>
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

            <div class="mb-2">
              <span class="d-block mb-1">運費</span>
              <label class="radio-line">
                <input type="radio" value="group" v-model="shippingOption" />
                團購免運
              </label>
              <label class="radio-line">
                <input type="radio" value="standard" v-model="shippingOption" />
                一般運費 ($60)
              </label>
            </div>

            <hr />

            <div class="d-flex justify-content-between mb-2">
              <span>預估總計</span>
              <span class="fw-bold">${{ formatCurrency(estimatedTotal) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>折扣金額</span>
              <span class="fw-bold text-accent">${{ formatCurrency(discountAmount) }}</span>
            </div>

            <hr />

            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-bold fs-6">最終應付金額</span>
              <span class="fw-bold fs-4 text-accent">${{ formatCurrency(grandTotal) }}</span>
            </div>

            <button class="btn btn-outline w-100 mb-2" @click="continueShopping">繼續購物</button>
            <button class="btn btn-main w-100" @click="handleCheckout">前往結帳</button>
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

.radio-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  margin-bottom: 4px;
  cursor: pointer;
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