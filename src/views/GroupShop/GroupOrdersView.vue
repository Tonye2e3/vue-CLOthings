<script setup>
// ====================================================================
// 這是「我的團購訂單」頁：列出使用者過去下的所有訂單，
// 可以查看進度、用 Modal 編輯收件人姓名與商品數量，或取消訂單。
// ====================================================================

import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

// 團購購物車 store：這一頁只需要拿購物車數量顯示在 header，不會修改購物車內容
import { useGroupCartStore } from '@/stores/groupCart'
// 已成立訂單累計件數 store：取消訂單、編輯數量時都要跟這裡同步調整
import { useGroupCommittedStore } from '@/stores/groupCommitted'

const route = useRoute()
const cartStore = useGroupCartStore()
const committedStore = useGroupCommittedStore()

const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
// 購物車商品數量：直接從 store 拿，跨頁面即時反映實際品項數
const cartCount = computed(() => cartStore.items.length)

// 商品目錄：編輯訂單、調整數量時要對照商品名稱與團購階層價格，需與其他頁面資料一致
const catalog = [
  { id: 1, name: '團購短T', listPrice: 340, tiers: [{ qty: 5, price: 306 }, { qty: 10, price: 221 }], currentCount: 12 },
  { id: 2, name: '團購牛仔褲', listPrice: 430, tiers: [{ qty: 10, price: 387 }, { qty: 20, price: 310 }], currentCount: 22 },
  { id: 3, name: '團購洋裝', listPrice: 520, tiers: [{ qty: 10, price: 468 }, { qty: 15, price: 374 }], currentCount: 15 },
  { id: 4, name: '團購針織外套', listPrice: 700, tiers: [{ qty: 10, price: 630 }, { qty: 15, price: 610 }], currentCount: 8 },
  { id: 5, name: '團購百褶裙', listPrice: 700, tiers: [{ qty: 10, price: 630 }, { qty: 15, price: 467 }], currentCount: 12 },
  { id: 6, name: '團購托特包', listPrice: 880, tiers: [{ qty: 15, price: 792 }, { qty: 25, price: 711 }], currentCount: 25 },
  { id: 7, name: '團購後背包', listPrice: 1060, tiers: [{ qty: 10, price: 954 }, { qty: 20, price: 727 }], currentCount: 5 },
  { id: 8, name: '團購遮陽帽', listPrice: 1060, tiers: [{ qty: 10, price: 954 }, { qty: 20, price: 727 }], currentCount: 14 },
  { id: 9, name: '團購針織帽', listPrice: 1150, tiers: [{ qty: 10, price: 1035 }, { qty: 30, price: 909 }], currentCount: 9 }
]
// 依商品 id 從目錄中找出對應的商品資料
const productOf = (id) => catalog.find(p => p.id === id)

// 訂單存放於 localStorage，結帳頁送出訂單後會寫入這裡，第一次載入沒有資料時先放示範假資料
const ORDERS_KEY = 'cloOrders'

// 示範用的假訂單資料，只有在使用者「完全還沒有下過任何訂單」時才會顯示
const defaultOrders = [
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

// 讀取訂單清單：讀不到資料（例如第一次使用）時，就把示範假資料存進 localStorage 並回傳
const readOrders = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS_KEY) || 'null')
    if (Array.isArray(saved)) return saved
  } catch {
    // 讀取失敗則回退到示範假資料
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(defaultOrders))
  return defaultOrders
}

// 用 reactive 讓訂單清單變成響應式資料，這樣「編輯」「取消」後畫面才會即時更新
const myOrders = reactive(readOrders())

// 任何訂單狀態變更（取消／編輯）都同步寫回 localStorage
watch(myOrders, () => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(myOrders))
}, { deep: true })

// 依訂單狀態文字，回傳對應的徽章（badge）顏色 class，方便在畫面上用不同顏色標示不同狀態
const getBadgeClass = (status) => {
  if (status.includes('已完成')) return 'bg-success'
  if (status.includes('已成團')) return 'bg-primary'
  if (status.includes('進行中')) return 'bg-warning text-dark'
  if (status.includes('已取消')) return 'bg-secondary'
  return 'bg-secondary'
}

// 按下「取消」按鈕時執行的動作
const cancelOrder = (id) => {
  const order = myOrders.find(o => o.id === id)
  if (!order) return
  if (order.status.includes('已取消')) return // 避免重複取消，重複扣減件數

  order.status = '已取消'

  // 把這筆訂單當初累計進去的件數扣回來，商品頁的「已訂購件數」與團購價才會同步復原
  // 直接呼叫 store 的 subtract 方法，裡面已經處理好「不會扣成負數」跟存回 localStorage
  if (Array.isArray(order.items) && order.items.length) {
    committedStore.subtract(order.items)
  }
}

// ---- 以下是「編輯訂單」Modal 相關的狀態與方法 ----

const showEditModal = ref(false)  // 控制編輯 Modal 是否顯示
const editingOrderId = ref('')    // 記錄目前正在編輯的是哪一筆訂單

// 編輯表單的資料：收件人姓名 + 每個品項的數量
// items 裡多存一個 name，只是方便畫面顯示，實際存回訂單時只會用到 id、qty
const editForm = reactive({
  shipName: '',
  items: []
})

// 按下「編輯」按鈕時執行的動作：把該筆訂單的資料帶進表單，並打開 Modal
const openEditModal = (id) => {
  const order = myOrders.find(o => o.id === id)
  if (!order) return
  if (order.status.includes('已取消')) return // 已取消的訂單不能再編輯

  editingOrderId.value = order.id
  editForm.shipName = order.shipName
  editForm.items = (order.items || []).map(i => ({
    id: i.id,
    name: productOf(i.id)?.name ?? '商品',
    qty: i.qty
  }))
  showEditModal.value = true
}

// 關閉 Modal，不儲存任何變更
const closeEditModal = () => {
  showEditModal.value = false
}

// 按下 Modal 裡的「儲存」時執行的動作
const saveEdit = () => {
  const order = myOrders.find(o => o.id === editingOrderId.value)
  if (!order) return

  if (!editForm.shipName.trim()) {
    alert('收件人姓名不能空白')
    return
  }
  if (editForm.items.some(i => !i.qty || i.qty < 1)) {
    alert('數量至少要 1 件')
    return
  }

  // 先算出每個品項「新數量 - 舊數量」的差，套用到已成立件數 store，
  // 這樣接下來算團購價時，store 裡的數字就已經是「改完之後」最新的總數
  editForm.items.forEach(newItem => {
    const oldItem = (order.items || []).find(i => i.id === newItem.id)
    const oldQty = oldItem ? oldItem.qty : 0
    const delta = newItem.qty - oldQty
    if (delta > 0) committedStore.add([{ id: newItem.id, qty: delta }])
    else if (delta < 0) committedStore.subtract([{ id: newItem.id, qty: -delta }])
  })

  // 用更新後的已成立件數，比照結帳頁的算法，重新算每個品項現在應該套用的團購價
  let subtotal = 0
  editForm.items.forEach(newItem => {
    const product = productOf(newItem.id)
    if (!product) return
    const totalQty = product.currentCount + committedStore.committedQtyOf(newItem.id)
    let price = product.listPrice
    for (const t of product.tiers) {
      if (totalQty >= t.qty) price = t.price
    }
    subtotal += price * newItem.qty
  })
  // 滿 $1,000 免運，未滿則加收運費 $60，跟結帳頁的規則一致
  const freight = subtotal >= 1000 ? 0 : 60

  // 把算好的結果寫回這筆訂單
  order.shipName = editForm.shipName.trim()
  order.items = editForm.items.map(i => ({ id: i.id, qty: i.qty }))
  order.productName = editForm.items.map(i => `${i.name} x${i.qty}`).join('、')
  order.totalPrice = subtotal + freight

  showEditModal.value = false
}

// 把數字格式化成千分位顯示（例如 1234 -> 1,234）
const formatCurrency = (amount) => new Intl.NumberFormat('zh-TW').format(amount)
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

      <!-- ============ 主要內容區：訂單列表 ============ -->
      <main class="clo-main">
    <div class="page-header mb-4">
      <h2 class="fw-bold mb-1">我的團購訂單</h2>
      <p class="text-muted small mb-0">追蹤您參與的所有團購專案與運送進度</p>
    </div>

    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>團購商品</th>
              <th>進度</th>
              <th>總金額</th>
              <th>訂購日期</th>
              <th>收件人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <!-- v-for 把 myOrders 陣列裡每一筆訂單，重複產生一列表格資料 -->
            <tr v-for="order in myOrders" :key="order.id">
              <td class="fw-bold text-main">#{{ order.id }}</td>
              <td class="fw-bold">{{ order.productName }}</td>
              <td>
                <!-- :class 用陣列動態組合出多個 class，其中 getBadgeClass 會依狀態回傳不同顏色 -->
                <span :class="['badge', getBadgeClass(order.status), 'px-3', 'py-2']">
                  {{ order.status }}
                </span>
              </td>
              <td class="fw-bold text-accent">$ {{ formatCurrency(order.totalPrice) }}</td>
              <td>{{ order.orderDate }}</td>
              <td>{{ order.shipName }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    class="edit-btn"
                    :disabled="order.status.includes('已取消')"
                    @click="openEditModal(order.id)"
                  >編輯</button>
                  <button
                    class="cancel-btn"
                    :disabled="order.status.includes('已取消')"
                    @click="cancelOrder(order.id)"
                  >取消</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============ 編輯訂單 Modal ============ -->
    <!-- 背景遮罩：showEditModal 為 true 時顯示，讓後面的內容變暗、不能點擊 -->
    <div v-if="showEditModal" class="modal-backdrop fade show"></div>
    <div
      v-if="showEditModal"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold mb-0">編輯訂單</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">收件人姓名</label>
              <!-- v-model 把輸入框內容同步到 editForm.shipName -->
              <input type="text" class="form-control" v-model="editForm.shipName" />
            </div>

            <label class="form-label">商品數量</label>
            <!-- 逐一列出這筆訂單裡的每個商品，各自可以調整數量 -->
            <div
              v-for="item in editForm.items"
              :key="item.id"
              class="d-flex align-items-center justify-content-between edit-item-row"
            >
              <span class="small">{{ item.name }}</span>
              <input
                type="number"
                min="1"
                class="form-control edit-qty-input"
                v-model.number="item.qty"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="closeEditModal">取消</button>
            <button type="button" class="btn btn-primary" @click="saveEdit">儲存</button>
          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 以下都是外觀樣式（顏色、間距、排版），跟訂單邏輯無關，可以先不用管 */
.text-main { color: #4a3e3d; }
.text-accent { color: #b87352; }

table thead {
  background-color: #ebdcd0;
  color: #4a3e3d;
}
table thead th {
  padding: 14px 16px;
  font-weight: 600;
  border: none;
}
table tbody td {
  padding: 14px 16px;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.cancel-btn {
  border: 1px solid #d8887f;
  background-color: #fff;
  color: #b8524f;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.cancel-btn:hover {
  background-color: #fbeceb;
}

.edit-btn {
  border: 1px solid #d8c3b5;
  background-color: #fff;
  color: #4a3e3d;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.edit-btn:hover {
  background-color: #f1e7de;
}
.edit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.edit-btn:disabled:hover {
  background-color: #fff;
}
.cancel-btn:disabled:hover {
  background-color: #fff;
}

/* 編輯訂單 Modal 內，每個商品品項一列 */
.edit-item-row {
  padding: 8px 0;
  border-bottom: 1px solid #f1e7de;
}
.edit-item-row:last-child {
  border-bottom: none;
}
.edit-qty-input {
  width: 80px;
  text-align: center;
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