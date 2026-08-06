<script setup>
import { reactive, ref, computed } from 'vue'
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

// 商品目錄：需與商品列表頁、商品詳情頁、購物車頁資料一致，用來對照當下總訂購件數算出正確團購價
const catalog = [
  { id: 1, name: '團購短T', imageUrl: 'https://picsum.photos/seed/clo-shortT/400/300', listPrice: 340, tiers: [{ qty: 5, price: 306 }, { qty: 10, price: 221 }], currentCount: 12 },
  { id: 2, name: '團購牛仔褲', imageUrl: 'https://picsum.photos/seed/clo-jeans/400/300', listPrice: 430, tiers: [{ qty: 10, price: 387 }, { qty: 20, price: 310 }], currentCount: 22 },
  { id: 3, name: '團購洋裝', imageUrl: 'https://picsum.photos/seed/clo-dress/400/300', listPrice: 520, tiers: [{ qty: 10, price: 468 }, { qty: 15, price: 374 }], currentCount: 15 },
  { id: 4, name: '團購針織外套', imageUrl: 'https://picsum.photos/seed/clo-knit-jacket/400/300', listPrice: 700, tiers: [{ qty: 10, price: 630 }, { qty: 15, price: 610 }], currentCount: 8 },
  { id: 5, name: '團購百褶裙', imageUrl: 'https://picsum.photos/seed/clo-skirt/400/300', listPrice: 700, tiers: [{ qty: 10, price: 630 }, { qty: 15, price: 467 }], currentCount: 12 },
  { id: 6, name: '團購托特包', imageUrl: 'https://picsum.photos/seed/clo-totebag/400/300', listPrice: 880, tiers: [{ qty: 15, price: 792 }, { qty: 25, price: 711 }], currentCount: 25 },
  { id: 7, name: '團購後背包', imageUrl: 'https://picsum.photos/seed/clo-backpack/400/300', listPrice: 1060, tiers: [{ qty: 10, price: 954 }, { qty: 20, price: 727 }], currentCount: 5 },
  { id: 8, name: '團購遮陽帽', imageUrl: 'https://picsum.photos/seed/clo-sunhat/400/300', listPrice: 1060, tiers: [{ qty: 10, price: 954 }, { qty: 20, price: 727 }], currentCount: 14 },
  { id: 9, name: '團購針織帽', imageUrl: 'https://picsum.photos/seed/clo-beanie/400/300', listPrice: 1150, tiers: [{ qty: 10, price: 1035 }, { qty: 30, price: 909 }], currentCount: 9 }
]
const productOf = (id) => catalog.find(p => p.id === id)

// 已成立訂單、永久累計進團購件數的數量
const COMMITTED_KEY = 'cloCommitted'
const committedQtyOf = (id) => {
  try {
    const saved = JSON.parse(localStorage.getItem(COMMITTED_KEY) || '{}')
    return saved && typeof saved === 'object' ? (saved[id] || 0) : 0
  } catch {
    return 0
  }
}

// 購物車存放於 localStorage，與購物車頁、商品詳情頁共用同一份資料
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
const cartCount = computed(() => cartItems.length)

// 依「基礎件數 + 已成立訂單件數 + 這筆購物車的件數」統一算出整批適用的團購價
const unitPriceOf = (item) => {
  const product = productOf(item.id)
  if (!product) return 0
  const totalQty = product.currentCount + committedQtyOf(item.id) + item.qty
  let price = product.listPrice
  for (const t of product.tiers) {
    if (totalQty >= t.qty) price = t.price
  }
  return price
}

const subtotal = computed(() =>
  cartItems.reduce((sum, i) => sum + unitPriceOf(i) * i.qty, 0)
)

// 滿 $1,000 免運，未滿則加收運費 $60
const freight = computed(() => (subtotal.value >= 1000 ? 0 : 60))
const grandTotal = computed(() => subtotal.value + freight.value)

// 收件人資訊
const orderInfo = reactive({
  shipName: '',
  shipPhone: '',
  shipAddress: '',
  pickupMethod: '宅配到府',
  paymentMethod: '信用卡付款'
})

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 訂單存放於 localStorage，與「我的團購訂單」頁共用同一份資料
const ORDERS_KEY = 'cloOrders'

const readOrders = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS_KEY) || 'null')
    if (Array.isArray(saved)) return saved
  } catch {
    // 讀取失敗則回退到示範假資料
  }
  // 與「我的團購訂單」頁的示範假資料保持一致
  return [
    {
      id: 'GO2026052001',
      productName: '時尚休閒連帽衛衣 (米白色 / 早鳥專案)',
      status: '進行中 (組團中)',
      totalPrice: 1200,
      orderDate: '2026/05/20',
      shipName: '王小明'
    },
    {
      id: 'GO2026041208',
      productName: '復古格紋闊寬褲 (咖啡色 / 經典專案)',
      status: '已成團 (備貨中)',
      totalPrice: 1485,
      orderDate: '2026/04/12',
      shipName: '王小明'
    },
    {
      id: 'GO2026030103',
      productName: '有機棉連帽衛衣 (墨綠 / 經典專案)',
      status: '已完成',
      totalPrice: 1280,
      orderDate: '2026/03/01',
      shipName: '王小明'
    }
  ]
}

const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

const backToCart = () => {
  router.push('/GroupShop/checkout')
}

const handleSubmit = () => {
  if (!orderInfo.shipName || !orderInfo.shipPhone || !orderInfo.shipAddress) {
    alert('請完整填寫收件人姓名、電話與地址')
    return
  }
  if (cartItems.length === 0) {
    alert('購物車是空的，請先加入商品')
    return
  }

  const newOrder = {
    id: 'GO' + Date.now(),
    productName: cartItems.map(i => `${productOf(i.id)?.name ?? '商品'} x${i.qty}`).join('、'),
    status: '進行中 (組團中)',
    totalPrice: grandTotal.value,
    orderDate: formatDate(new Date()),
    shipName: orderInfo.shipName,
    // 記錄這筆訂單實際包含哪些商品與件數，取消訂單時才能把對應件數從團購進度扣回去
    items: cartItems.map(i => ({ id: i.id, qty: i.qty }))
  }

  const orders = readOrders()
  orders.unshift(newOrder)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))

  // 訂單成立後，這筆數量要永久累計進該商品的團購件數，即使購物車被清空也不會歸零
  try {
    const committed = JSON.parse(localStorage.getItem(COMMITTED_KEY) || '{}')
    cartItems.forEach(i => {
      committed[i.id] = (committed[i.id] || 0) + i.qty
    })
    localStorage.setItem(COMMITTED_KEY, JSON.stringify(committed))
  } catch {
    // 寫入失敗則略過，不影響訂單本身送出
  }

  alert('🎉 訂單已送出！即將轉導至訂單列表頁面。')
  localStorage.removeItem(CART_KEY)
  router.push('/GroupShop/orders')
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
        <button class="back-link mb-3" type="button" @click="backToCart">
          ← 返回購物車
        </button>

        <div class="row g-4">
          <!-- 左側：收件人資訊 + 付款方式 -->
          <div class="col-lg-8">
            <h4 class="fw-bold mb-3">結帳資訊</h4>

            <form class="form-card mb-4" @submit.prevent="handleSubmit">
              <h6 class="fw-bold form-section-title">收件人資訊</h6>

              <div class="mb-3">
                <label class="form-label">收件人姓名</label>
                <input v-model="orderInfo.shipName" type="text" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label">聯絡電話</label>
                <input v-model="orderInfo.shipPhone" type="tel" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label">配送地址</label>
                <input v-model="orderInfo.shipAddress" type="text" class="form-control" required />
              </div>

              <h6 class="fw-bold form-section-title mt-4">配送與付款</h6>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">取貨方式</label>
                  <select v-model="orderInfo.pickupMethod" class="form-select">
                    <option value="宅配到府">宅配到府</option>
                    <option value="超商取貨">超商取貨</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">付款方式</label>
                  <select v-model="orderInfo.paymentMethod" class="form-select">
                    <option value="信用卡付款">信用卡付款</option>
                    <option value="貨到付款">貨到付款</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <!-- 右側：金額摘要 -->
          <div class="col-lg-4">
            <div class="summary-panel">
              <h6 class="fw-bold summary-title">訂單摘要</h6>
              <div class="summary-body">
                <div v-for="item in cartItems" :key="item.id" class="d-flex justify-content-between small mb-2 summary-line">
                  <span>{{ productOf(item.id)?.name }} x {{ item.qty }}</span>
                  <span>${{ formatCurrency(unitPriceOf(item) * item.qty) }}</span>
                </div>

                <hr />

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

                <hr />

                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="fw-bold fs-6">最終應付金額</span>
                  <span class="fw-bold fs-4 text-accent">${{ formatCurrency(grandTotal) }}</span>
                </div>

                <button
                  class="btn btn-main w-100"
                  :disabled="cartItems.length === 0"
                  @click="handleSubmit"
                >
                  確認送出訂單
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

.back-link {
  display: inline-block;
  font-size: 0.88rem;
  color: #6e5f5c;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.back-link:hover {
  color: #4a3e3d;
  text-decoration: underline;
}

.form-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}
.form-section-title {
  border-bottom: 0.5px solid #e6dccf;
  padding-bottom: 8px;
  margin-bottom: 14px;
}
.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
  display: block;
}
.form-control,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d8c3b5;
  border-radius: 6px;
  background-color: #fff;
  font-size: 0.9rem;
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
.summary-line {
  color: #6e5f5c;
}

.btn-main {
  background-color: #4a3e3d;
  color: #fff;
  border: none;
  padding: 12px 14px;
  border-radius: 6px;
  font-weight: 700;
  width: 100%;
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