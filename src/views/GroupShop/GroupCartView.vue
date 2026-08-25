<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
import { useAuthStore } from '@/stores/auth'
// 圖片網址工具：後端上傳圖片回傳的是相對路徑（例如 /images/group-products/xxx.jpg），
// 舊示範資料則是完整網址（例如 https://picsum.photos/...），這裡統一組成完整網址
// 圖片是靜態檔案，走的不是 /api 這條路徑，不能直接用 baseURL（那個多了 /api），
// 這裡把 VITE_API_URL 尾巴的 /api 拿掉，變成純網域，圖片網址才會跟著 .env 換環境，不會在正式環境還打 localhost
const API_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
const resolveImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path}`
}


const router = useRouter()
const authStore = useAuthStore()

// 一般管理員（Admin）前台只能看不能操作，SuperAdmin 不受限
const isReadOnly = computed(() => authStore.role === 'Admin')

// 呼叫 useGroupCartStore()
const cartStore = useGroupCartStore()

// 進到購物車頁時，跟後端同步一次目前的購物車內容
onMounted(() => {
  // 管理員（Admin）沒有購物車權限，fetchCart 會回 403，補上 catch 避免出現未處理的 Promise 錯誤
  cartStore.fetchCart().catch(() => {})
})

// 團購加購專區
// 目前程式裡沒有塞資料進去，所以畫面上這區塊預設不會出現
const addonItems = reactive([])

// 從購物車中移除某個商品
const removeItem = (id) => {
  cartStore.removeItem(id)
}

// 修改購物車某一項的數量：呼叫 store 的 updateQty，會同步存回後端
const updateQty = (id, qty) => {
  cartStore.updateQty(id, qty)
}

// 取得某個購物車項目目前應該用的單價：後端已經算好放在 item.unitPrice
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
    <div class="clo-body">
      <!-- ============ 主要內容區：購物車 ============ -->
      <main class="clo-main clo-main-full">
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
            <img :src="resolveImageUrl(item.imageUrl)" class="cart-img" :alt="item.name" />
            <div class="cart-item-info">
              <h6 class="fw-bold mb-1">{{ item.name }}</h6>
              <div class="d-flex align-items-center gap-2 mb-1">
                <label class="small text-muted mb-0">數量</label>
                <input
                  type="number"
                  min="1"
                  :value="item.qty"
                  :disabled="isReadOnly"
                  @change="updateQty(item.id, Number($event.target.value))"
                  class="qty-input"
                />
              </div>
              <p class="small text-muted mb-0">
                團購價 ${{ formatCurrency(unitPriceOf(item)) }}
              </p>
            </div>
            <div class="cart-item-price">
              <span class="fw-bold">$ {{ formatCurrency(unitPriceOf(item) * item.qty) }}</span>
              <button class="remove-btn" :disabled="isReadOnly" @click="removeItem(item.id)">
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

        <!-- 當加購商品陣列不是空的時候才顯示這個區塊 -->
        <div v-if="addonItems.length > 0" class="addon-card">
          <div class="addon-header">團購加購專區</div>
          <div v-for="item in addonItems" :key="item.id" class="addon-row">
            <img :src="resolveImageUrl(item.imageUrl)" class="cart-img" :alt="item.name" />
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
            <!-- 購物車完全空的時候，或目前是唯讀身分（Admin），按鈕會被禁用 -->
            <button
              class="btn btn-main w-100"
              :disabled="allItems.length === 0 || isReadOnly"
              :title="isReadOnly ? '管理員帳號僅供瀏覽，無法結帳' : ''"
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

.clo-shell {
  --color-text: #4a3e3d;
  --color-text-muted: #6e5f5c;
  --color-muted: #a9998e;
  --color-accent: #b87352;
  --color-danger: #b8524f;
  --color-bg-page: #f8f5f0;
  --color-border: #e6dccf;
  --color-border-input: #d8c3b5;
  --color-hover-bg: #f1e7de;
  --color-active-bg: #ebdcd0;
  --color-dark: #3d3332;
  --color-dark-hover: #362d2c;

  /* 新增：把重複出現的陰影 / 圓角也抽成變數，卡片類元件共用 */
  --shadow-card: 0 1px 4px rgba(74, 62, 61, 0.08);
  --shadow-panel: 0 2px 10px rgba(74, 62, 61, 0.12);
  --radius-card: 12px;

  min-height: 100vh;
  background-color: var(--color-bg-page);
  color: var(--color-text);
}

.text-accent { color: var(--color-accent); }

/* 三個卡片外觀完全一樣（白底、圓角、陰影、裁切溢出），合併成一組選擇器 */
.cart-list-card,
.addon-card,
.summary-panel {
  background-color: #fff;
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
/* summary-panel 額外需要更重的陰影 + 吸頂，寫在後面覆蓋掉上面的 box-shadow 即可 */
.summary-panel {
  box-shadow: var(--shadow-panel);
  position: sticky;
  top: 20px;
}

.cart-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-hover-bg);
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
  border: 1px solid var(--color-border-input);
  border-radius: 6px;
  text-align: center;
}
.qty-input:disabled,
.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  color: var(--color-muted);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
}
.remove-btn:hover { color: var(--color-danger); }

.addon-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

/* addon-header 跟 summary-title 都是深底白字，共用底色/文字色 */
.addon-header,
.summary-title {
  background-color: var(--color-dark);
  color: #fff;
}
.addon-header { font-weight: 700; padding: 10px 20px; }
.summary-title { margin: 0; padding: 14px 20px; }

.summary-body {
  padding: 18px 20px;
  color: var(--color-text);
}

.shipping-hint {
  font-size: 0.78rem;
}

.empty-cart {
  padding: 40px 20px;
  text-align: center;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.btn-main {
  background-color: var(--color-text);
  color: #fff;
  border: none;
  padding: 12px 14px;
  border-radius: 6px;
  font-weight: 700;
}
.btn-main:hover {
  background-color: var(--color-dark-hover);
  color: #fff;
}
/* disabled 跟 disabled:hover 原本背景/文字色是重複的，合併成一條，游標另外寫一行就好 */
.btn-main:disabled,
.btn-main:disabled:hover {
  background-color: var(--color-border-input);
  color: #fff;
}
.btn-main:disabled { cursor: not-allowed; }

.btn-outline {
  background-color: #fff;
  color: var(--color-text);
  border: 1px solid var(--color-border-input);
  padding: 12px 14px;
  border-radius: 6px;
  font-weight: 700;
}
.btn-outline:hover {
  background-color: var(--color-hover-bg);
}

.clo-body {
  display: flex;
  align-items: flex-start;
}

.clo-main {
  flex: 1;
  padding: 28px 32px;
  min-width: 0;
}

/* 拿掉左側導覽列後，內容區改成置中、限制最大寬度，版面才不會在寬螢幕上被拉得過開 */
.clo-main-full {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}
</style>