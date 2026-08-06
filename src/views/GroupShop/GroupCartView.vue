<script setup>
// ====================================================================
// 這是「購物車頁」：顯示使用者已加入的團購商品、可調整數量、
// 計算小計與運費，並可以前往「結帳頁」。
//
// 【這一版的改動】購物車資料改成從 Pinia store（groupCart）拿，
// 不再自己用 localStorage 讀寫、也不用 watch 監看變化再存檔——
// 這些事情 store 都幫我們處理好了，元件只需要「用」資料就好。
// ====================================================================

import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'

const route = useRoute()

const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
const router = useRouter()

// 呼叫 useGroupCartStore() 拿到購物車 store 的實體，
// 之後畫面上就用 cartStore.items、cartStore.removeItem(...) 這樣去讀寫
const cartStore = useGroupCartStore()

// 團購加購專區（可為空陣列，無加購商品時不顯示此區塊）
// 目前程式裡沒有塞資料進去，所以畫面上這區塊預設不會出現
const addonItems = reactive([])

// 從購物車中移除某個商品，直接呼叫 store 裡定義好的 removeItem 方法
const removeItem = (id) => {
  cartStore.removeItem(id)
}

// 取得某個購物車項目目前應該用的單價：有解鎖團購價就用團購價，沒有就用原價
// 這個計算方式跟 store 裡的 unitPriceOf 是一樣的，這裡直接呼叫 store 的版本，避免同樣的邏輯寫兩次
const unitPriceOf = (item) => cartStore.unitPriceOf(item)

// 把「購物車商品」和「加購商品」合併成同一個陣列，方便一起計算總金額
const allItems = computed(() => [...cartStore.items, ...addonItems])

// 商品小計：把每一項的「單價 x 數量」加總起來
const subtotal = computed(() =>
  allItems.value.reduce((sum, i) => sum + unitPriceOf(i) * i.qty, 0)
)

// 滿 $1,000 免運，未滿則加收運費 $60
const freight = computed(() => (subtotal.value >= 1000 ? 0 : 60))

// 最終應付金額 = 商品小計 + 運費
const grandTotal = computed(() => subtotal.value + freight.value)

// 把數字格式化成千分位顯示（例如 1234 -> 1,234）
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 按下「繼續購物」時，跳回商品列表頁
const continueShopping = () => {
  router.push('/GroupShop')
}

// 按下「前往結帳」時，跳到結帳確認頁
const handleCheckout = () => {
  router.push('/GroupShop/checkout/confirm')
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
          <span class="cart-badge">{{ allItems.length }}</span>
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

      <!-- ============ 主要內容區：購物車 ============ -->
      <main class="clo-main">
    <div class="row g-4">
      <!-- 左側：購物車內容 -->
      <div class="col-lg-8">
        <h4 class="fw-bold mb-3">購物車 ({{ cartStore.items.length }})</h4>

        <div class="cart-list-card mb-4">
          <!-- 購物車是空的時候顯示提示文字 -->
          <div v-if="cartStore.items.length === 0" class="empty-cart">
            購物車目前是空的，快去挑選喜歡的商品加入團購吧！
          </div>
          <!-- v-for 把購物車裡每一項商品都顯示成一列 -->
          <div v-for="item in cartStore.items" :key="item.id" class="cart-row">
            <img :src="item.imageUrl" class="cart-img" :alt="item.name" />
            <div class="cart-item-info">
              <h6 class="fw-bold mb-1">{{ item.name }}</h6>
              <div class="d-flex align-items-center gap-2 mb-1">
                <label class="small text-muted mb-0">數量</label>
                <!-- v-model.number：把輸入框內容自動同步到 item.qty，並轉成數字型別。
                     注意：item 是從 cartStore.items 拿出來的，這裡等於直接修改 store 裡的資料，
                     Pinia 允許這樣做，但比較嚴謹的寫法會是呼叫 store 裡另外寫一個 updateQty(id, qty) 的
                     action 來改，之後如果想練習，可以試著加這個 action -->
                <input type="number" min="1" v-model.number="item.qty" class="qty-input" />
              </div>
              <p class="small text-muted mb-0">
                團購價 ${{ formatCurrency(unitPriceOf(item)) }}
              </p>
            </div>
            <div class="cart-item-price">
              <span class="fw-bold">$ {{ formatCurrency(unitPriceOf(item) * item.qty) }}</span>
              <button class="remove-btn" @click="removeItem(item.id)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              移除
            </button>
            </div>
          </div>
        </div>

        <!-- 只有加購商品陣列不是空的時候才顯示這個區塊 -->
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
            <!-- :disabled 是動態綁定：購物車完全空的時候，按鈕會被禁用，避免結帳空訂單 -->
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
/* 以下都是外觀樣式（顏色、間距、排版），跟商品邏輯無關，可以先不用管 */
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
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