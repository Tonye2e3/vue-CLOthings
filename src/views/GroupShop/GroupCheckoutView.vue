<script setup>

import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
// 已成立訂單累計件數 store：算團購價、以及訂單送出後要累加件數
import { useGroupCommittedStore } from '@/stores/groupCommitted'

const route = useRoute()
const router = useRouter()
const cartStore = useGroupCartStore()
const committedStore = useGroupCommittedStore()

const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')

// 商品目錄
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
// 依商品 id 從目錄中找出對應的商品資料
const productOf = (id) => catalog.find(p => p.id === id)

const cartItems = computed(() => cartStore.items)
const cartCount = computed(() => cartItems.value.length)

// 「基礎件數 + 已成立訂單件數 + 這筆購物車的件數」統一算出整批適用的團購價
// 這裡跟其他頁面計算方式的差別：多加了 committedStore.committedQtyOf，確保之前已經送出的訂單件數也算進去
const unitPriceOf = (item) => {
  const product = productOf(item.id)
  if (!product) return 0
  const totalQty = product.currentCount + committedStore.committedQtyOf(item.id) + item.qty
  let price = product.listPrice
  for (const t of product.tiers) {
    if (totalQty >= t.qty) price = t.price
  }
  return price
}

// 商品小計：每項「單價 x 數量」加總
const subtotal = computed(() =>
  cartItems.value.reduce((sum, i) => sum + unitPriceOf(i) * i.qty, 0)
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

// 把數字格式化成千分位顯示（例如 1234 -> 1,234）
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 訂單存放於 localStorage，與「我的團購訂單」頁共用同一份資料
const ORDERS_KEY = 'cloOrders'

// 讀取目前已存在的訂單清單，讀不到資料時回傳示範假資料（讓畫面一開始就有東西可以看）
const readOrders = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS_KEY) || 'null')
    if (Array.isArray(saved)) return saved
  } catch {
    // 讀取失敗則回退到示範假資料
  }
  // 與「我的團購訂單」頁的示範假資料
  return [
    {
      id: 'GO2026052001',
      productName: '時尚休閒連帽衛衣 (米白色)',
      status: '進行中 (組團中)',
      totalPrice: 1200,
      orderDate: '2026/05/20',
      shipName: '王小明'
    },
    {
      id: 'GO2026041208',
      productName: '復古格紋闊寬褲 (咖啡色)',
      status: '已成團 (備貨中)',
      totalPrice: 1485,
      orderDate: '2026/04/12',
      shipName: '王小明'
    },
    {
      id: 'GO2026030103',
      productName: '有機棉連帽衛衣 (墨綠)',
      status: '已完成',
      totalPrice: 1280,
      orderDate: '2026/03/01',
      shipName: '王小明'
    }
  ]
}

// 把 Date 物件格式化成「YYYY/MM/DD」字串
const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0') // padStart(2,'0')：不足兩位數前面補 0
  const d = String(date.getDate()).padStart(2, '0')      // 修好的地方：補回這一行，取出「日」的部分
  return `${y}/${m}/${d}`
}

// 按下「返回購物車」時，跳回購物車頁面
const backToCart = () => {
  router.push('/GroupShop/checkout')
}

// 按下「確認送出訂單」時執行的動作
const handleSubmit = () => {
  // 先檢查必填欄位有沒有填寫，沒填就跳出提示並中斷（return）
  if (!orderInfo.shipName || !orderInfo.shipPhone || !orderInfo.shipAddress) {
    alert('請完整填寫收件人姓名、電話與地址')
    return
  }
  // 購物車是空的也不能送出訂單
  if (cartItems.value.length === 0) {
    alert('購物車是空的，請先加入商品')
    return
  }

  // 組成一筆新的訂單資料
  const newOrder = {
    id: 'GO' + Date.now(), // 用目前時間戳記當作訂單編號的一部分，確保不會重複
    productName: cartItems.value.map(i => `${productOf(i.id)?.name ?? '商品'} x${i.qty}`).join('、'),
    status: '進行中 (組團中)',
    totalPrice: grandTotal.value,
    orderDate: formatDate(new Date()),
    shipName: orderInfo.shipName,
    // 記錄這筆訂單實際包含哪些商品與件數，取消訂單時才能把對應件數從團購進度扣回去
    items: cartItems.value.map(i => ({ id: i.id, qty: i.qty }))
  }

  // 把新訂單加到訂單清單「最前面」，並存回 localStorage
  const orders = readOrders()
  orders.unshift(newOrder)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))

  // 訂單成立後，這筆數量要永久累計進該商品的團購件數，即使購物車被清空也不會歸零
  committedStore.add(cartItems.value.map(i => ({ id: i.id, qty: i.qty })))

  alert('訂單已送出！即將轉至訂單列表頁面。')
  cartStore.clear() // 訂單送出後清空購物車（改叫 store 的方法，而不是自己動手清 localStorage）
  router.push('/GroupShop/orders')  // 跳轉到「我的團購訂單」頁面
}
</script>

<template>
  <div class="clo-shell">
    <!-- ============ 頁面最上方：會員名稱 + 購物車圖示 ============ -->
    <header class="clo-header">
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
      <!-- ============ 左側選單 ============ -->
      <aside class="clo-sidebar">
        <nav class="sidebar-nav">
          <template v-for="item in navItems" :key="item.label">
            <router-link
              v-if="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ active: isActive(item.to) }"
            >
              <span class="nav-icon">
                <!-- 顯示對應的嵌入式 SVG 圖示-->
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

      <!-- ============ 主要內容區：結帳表單 ============ -->
      <main class="clo-main">
        <button class="back-link mb-3" type="button" @click="backToCart">
          ← 返回購物車
        </button>

        <div class="row g-4">
          <!-- 左側：收件人資訊 + 付款方式 -->
          <div class="col-lg-8">
            <h4 class="fw-bold mb-3">結帳資訊</h4>

            <!-- @submit.prevent：表單送出時先阻止瀏覽器預設的整頁重新整理，改成執行 handleSubmit -->
            <form class="form-card mb-4" @submit.prevent="handleSubmit">
              <h6 class="fw-bold form-section-title">收件人資訊</h6>

              <div class="mb-3">
                <label class="form-label">收件人姓名</label>
                <!-- v-model 讓輸入框內容跟 orderInfo.shipName 自動雙向同步 -->
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
                <!-- 逐一列出購物車裡每項商品的名稱、數量與小計金額 -->
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

                <!-- 購物車是空的時候，按鈕會被禁用，避免送出空訂單 -->
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
/* 以下都是外觀樣式（顏色、間距、排版），跟商品邏輯無關，可以先不用管 */

/* 把重複用到的顏色集中定義成變數，之後要改主題色只要改這裡，不用每個地方都找一次 */
.clo-shell {
  --color-text: #4a3e3d;       /* 主要文字色（深咖啡） */
  --color-text-muted: #6e5f5c; /* 次要文字色（淺咖啡） */
  --color-accent: #b87352;     /* 強調色（按鈕、標籤） */
  --color-bg-page: #f8f5f0;    /* 頁面底色 */
  --color-border: #e6dccf;     /* 淺邊框線 */
  --color-border-input: #d8c3b5; /* 輸入框邊框 */
  --color-hover-bg: #f1e7de;   /* 滑鼠移過去的底色 */
  --color-active-bg: #ebdcd0;  /* 選單被選中的底色 */
  --color-dark: #3d3332;       /* 深色底（結帳摘要標題列） */
  --color-dark-hover: #362d2c; /* 深色按鈕的 hover 狀態 */

  min-height: 100vh;
  background-color: var(--color-bg-page);
  color: var(--color-text);
}

.text-accent { color: var(--color-accent); }

.back-link {
  display: inline-block;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.back-link:hover {
  color: var(--color-text);
  text-decoration: underline;
}

.form-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}
.form-section-title {
  border-bottom: 0.5px solid var(--color-border);
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
  border: 1px solid var(--color-border-input);
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
  background-color: var(--color-dark);
  color: #fff;
  margin: 0;
  padding: 14px 20px;
}
.summary-body {
  padding: 18px 20px;
  color: var(--color-text);
}
.summary-line {
  color: var(--color-text-muted);
}

.btn-main {
  background-color: var(--color-text);
  color: #fff;
  border: none;
  padding: 12px 14px;
  border-radius: 6px;
  font-weight: 700;
  width: 100%;
}
.btn-main:hover {
  background-color: var(--color-dark-hover);
  color: #fff;
}
.btn-main:disabled {
  background-color: var(--color-border-input);
  color: #fff;
  cursor: not-allowed;
}
.btn-main:disabled:hover {
  background-color: var(--color-border-input);
}

.clo-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 28px;
  background-color: #fff;
  border-bottom: 1px solid var(--color-border);
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
  color: var(--color-text);
  text-decoration: none;
}
.cart-badge {
  position: absolute;
  top: -6px;
  right: -10px;
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