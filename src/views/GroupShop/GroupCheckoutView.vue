<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
import { useAuthStore } from '@/stores/auth'
// 改成呼叫「建立付款」，不再直接呼叫 checkout（要先付款成功才會真的建立訂單）
import { createPayment } from '@/api/groupShop'

const route = useRoute()
const router = useRouter()
const cartStore = useGroupCartStore()
const authStore = useAuthStore()

// 一般管理員（Admin）前台只能看不能操作，SuperAdmin 不受限
const isReadOnly = computed(() => authStore.role === 'Admin')

// 左側選單：一般會員只看得到「專案瀏覽」「團購紀錄」，
// Admin / SuperAdmin 登入時，「團購紀錄」下面會多出後台管理的兩個項目
const navItems = computed(() => {
  const items = [
    { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
    { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
  ]
  if (authStore.isAdmin) {
    items.push(
      { label: '團購商品管理', icon: 'box', to: '/GroupShop/admin/products' },
      { label: '團購訂單管理', icon: 'clipboard', to: '/GroupShop/admin/orders' }
    )
  }
  return items
})
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：登入狀態統一用 useAuthStore()，尚未登入則顯示預設值
const memberName = computed(() => authStore.name || '會員')

onMounted(() => {
  // 管理員（Admin）沒有購物車權限，fetchCart 會回 403，補上 catch 避免出現未處理的 Promise 錯誤
  cartStore.fetchCart().catch(() => {})
})

const cartItems = computed(() => cartStore.items)
const cartCount = computed(() => cartItems.value.length)

// 單價後端已經算好了，購物車裡的每一項本身就帶著 unitPrice，不用再自己查商品目錄算一次
const unitPriceOf = (item) => item.unitPrice

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

// 按下「返回購物車」時，跳回購物車頁面
const backToCart = () => {
  router.push('/GroupShop/checkout')
}

// 按下「確認送出訂單」時執行的動作：改成先建立一筆「待付款」，再導去模擬付款頁，
// 使用者在那邊按下「付款成功」之後，訂單才會真的被建立（後端 GroupPaymentController 負責）
const handleSubmit = async () => {
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

  try {
    // UserId 不用帶了，後端一律從 JWT 判斷是誰的訂單
    const result = await createPayment({
      shipName: orderInfo.shipName,
      shipPhone: orderInfo.shipPhone,
      shipAddress: orderInfo.shipAddress,
      pickupMethod: orderInfo.pickupMethod,
      paymentMethod: orderInfo.paymentMethod
    })

    // 導去模擬付款頁，付款結果確認後才會真的建立訂單
    router.push(`/GroupShop/pay/${result.paymentId}`)
  } catch (err) {
    // 後端檢查沒過（例如購物車是空的）會回傳錯誤訊息，直接顯示出來
    alert(err.response?.data || '建立付款失敗，請稍後再試')
  }
}
</script>

<template>
  <div class="clo-shell">
    <!-- 購物車圖示改為右下角浮動按鈕，見頁面最下方 -->
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
                <svg v-else-if="item.icon === 'box'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <polyline points="3.29 7 12 12 20.71 7"></polyline>
                  <line x1="12" y1="22" x2="12" y2="12"></line>
                </svg>
                <svg v-else-if="item.icon === 'clipboard'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <line x1="9" y1="12" x2="15" y2="12"></line>
                  <line x1="9" y1="16" x2="15" y2="16"></line>
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
                <svg v-else-if="item.icon === 'box'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <polyline points="3.29 7 12 12 20.71 7"></polyline>
                  <line x1="12" y1="22" x2="12" y2="12"></line>
                </svg>
                <svg v-else-if="item.icon === 'clipboard'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <line x1="9" y1="12" x2="15" y2="12"></line>
                  <line x1="9" y1="16" x2="15" y2="16"></line>
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
                    <option value="線上支付">線上支付</option>
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
                  <span>{{ item.name }} x {{ item.qty }}</span>
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

                <!-- 購物車是空的時候，或目前是唯讀身分（Admin），按鈕會被禁用 -->
                <button
                  class="btn btn-main w-100"
                  :disabled="cartItems.length === 0 || isReadOnly"
                  :title="isReadOnly ? '管理員帳號僅供瀏覽，無法送出訂單' : ''"
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