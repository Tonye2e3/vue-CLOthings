<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

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

// 訂單存放於 localStorage，結帳頁送出訂單後會寫入這裡，第一次載入沒有資料時先放示範假資料
const ORDERS_KEY = 'cloOrders'

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

const myOrders = reactive(readOrders())

// 任何訂單狀態變更（取消／編輯）都同步寫回 localStorage
watch(myOrders, () => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(myOrders))
}, { deep: true })

const getBadgeClass = (status) => {
  if (status.includes('已完成')) return 'bg-success'
  if (status.includes('已成團')) return 'bg-primary'
  if (status.includes('進行中')) return 'bg-warning text-dark'
  if (status.includes('已取消')) return 'bg-secondary'
  return 'bg-secondary'
}

// 已成立訂單、永久累計進團購件數的數量（結帳送出時寫入，取消訂單時要對應扣回）
const COMMITTED_KEY = 'cloCommitted'

const cancelOrder = (id) => {
  const order = myOrders.find(o => o.id === id)
  if (!order) return
  if (order.status.includes('已取消')) return // 避免重複取消，重複扣減件數

  order.status = '已取消'

  // 把這筆訂單當初累計進去的件數扣回來，商品頁的「已訂購件數」與團購價才會同步復原
  if (Array.isArray(order.items) && order.items.length) {
    try {
      const committed = JSON.parse(localStorage.getItem(COMMITTED_KEY) || '{}')
      order.items.forEach(i => {
        committed[i.id] = Math.max(0, (committed[i.id] || 0) - i.qty)
      })
      localStorage.setItem(COMMITTED_KEY, JSON.stringify(committed))
    } catch {
      // 寫入失敗則略過，不影響取消狀態本身
    }
  }
}

const editOrder = (id) => {
  const order = myOrders.find(o => o.id === id)
  if (!order) return
  const newName = prompt('修改收件人姓名', order.shipName)
  if (newName && newName.trim()) order.shipName = newName.trim()
}

const formatCurrency = (amount) => new Intl.NumberFormat('zh-TW').format(amount)
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
            <tr v-for="order in myOrders" :key="order.id">
              <td class="fw-bold text-main">#{{ order.id }}</td>
              <td class="fw-bold">{{ order.productName }}</td>
              <td>
                <span :class="['badge', getBadgeClass(order.status), 'px-3', 'py-2']">
                  {{ order.status }}
                </span>
              </td>
              <td class="fw-bold text-accent">$ {{ formatCurrency(order.totalPrice) }}</td>
              <td>{{ order.orderDate }}</td>
              <td>{{ order.shipName }}</td>
              <td>
                <div class="action-buttons">
                  <button class="edit-btn" @click="editOrder(order.id)">編輯</button>
                  <button class="cancel-btn" @click="cancelOrder(order.id)">取消</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
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