<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 這一頁拿購物車數量顯示在 header
import { useGroupCartStore } from '@/stores/groupCart'
import { useAuthStore } from '@/stores/auth'
// 訂單相關 API：查詢、取消、編輯
import { getGroupOrders, getGroupOrderDetail, cancelGroupOrder, editGroupOrder, createCustomerService, getCustomerServiceByOrder } from '@/api/groupShop'

const route = useRoute()
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
// 購物車商品數量
const cartCount = computed(() => cartStore.items.length)

// 訂單清單：改成向後端拿真正的資料，不再存 localStorage
// 欄位對應後端 GroupOrderListDTO，這裡把 groupOrderId 轉成 id，template 才不用改
const myOrders = reactive([])

const loadOrders = async () => {
  // UserId 不用帶了，後端一律從 JWT 判斷是誰的訂單
  const rows = await getGroupOrders()
  const mapped = rows.map(r => ({
    id: r.groupOrderId,
    productName: r.productName,
    status: r.status,
    totalPrice: r.totalPrice,
    orderDate: r.orderDate,
    shipName: r.shipName
  }))
  myOrders.splice(0, myOrders.length, ...mapped)
}

onMounted(() => {
  // 管理員（Admin）沒有購物車權限，fetchCart 會回 403，補上 catch 避免出現未處理的 Promise 錯誤
  cartStore.fetchCart().catch(() => { })
  loadOrders()

  // 從 LINE Pay 付款完成導回來的話，網址上會帶 linepay=success，顯示一下提示
  if (route.query.linepay === 'success') {
    alert('LINE Pay 付款成功，訂單已建立！')
  }
})

// 依訂單狀態文字，回傳對應的徽章（badge）顏色 class，方便在畫面上用不同顏色標示不同狀態
const getBadgeClass = (status) => {
  if (status.includes('已完成')) return 'bg-success'
  if (status.includes('已成團')) return 'bg-primary'
  if (status.includes('進行中')) return 'bg-warning text-dark'
  if (status.includes('已取消')) return 'bg-secondary'
  return 'bg-secondary'
}

// 按下「取消」按鈕時執行的動作：改成呼叫後端取消 API
// 後端取消訂單後，商品頁的「已訂購件數」會依「非已取消」訂單重新加總，自動同步復原，
// 不用像以前那樣另外呼叫 committedStore.subtract
const cancelOrder = async (id) => {
  const order = myOrders.find(o => o.id === id)
  if (!order) return
  if (order.status.includes('已取消')) return // 避免重複取消

  await cancelGroupOrder(id)
  order.status = '已取消'
}

// ---- 以下是「編輯訂單」Modal 相關的狀態與方法 ----

const showEditModal = ref(false)
const editingOrderId = ref(null) // 記錄目前正在編輯的是哪一筆訂單

// 編輯表單的資料：收件人姓名 + 每個品項的數量
const editForm = reactive({
  shipName: '',
  items: []
})

// 按下「編輯」按鈕時執行的動作：跟後端要這筆訂單的詳細內容，帶進表單並打開 Modal
const openEditModal = async (id) => {
  const order = myOrders.find(o => o.id === id)
  if (!order) return
  if (order.status.includes('已取消')) return // 已取消的訂單不能再編輯

  const detail = await getGroupOrderDetail(id)

  editingOrderId.value = id
  editForm.shipName = detail.shipName
  editForm.items = detail.items.map(i => ({
    id: i.groupProductId,
    name: i.productName,
    qty: i.quantity
  }))
  showEditModal.value = true
}

// 關閉 Modal，不儲存任何變更
const closeEditModal = () => {
  showEditModal.value = false
}

// 按下 Modal 裡的「儲存」時執行的動作：改成呼叫後端編輯 API，
// 團購價、運費怎麼重算都交給後端處理，前端不用再自己算一次
const saveEdit = async () => {
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

  const updated = await editGroupOrder(editingOrderId.value, {
    shipName: editForm.shipName.trim(),
    items: editForm.items.map(i => ({ groupProductId: i.id, quantity: i.qty }))
  })

  // 把後端算好的結果寫回這筆訂單
  order.shipName = updated.shipName
  order.productName = updated.productName
  order.totalPrice = updated.totalPrice

  showEditModal.value = false
}

// 把數字格式化成千分位顯示（例如 1234 -> 1,234）
const formatCurrency = (amount) => new Intl.NumberFormat('zh-TW').format(amount)

// ---- 以下是「聯絡客服」Modal 相關的狀態與方法 ----

const showServiceModal = ref(false)
const activeServiceOrderId = ref(null)
const serviceRecords = ref([]) // 這筆訂單之前送過的客服紀錄

const serviceForm = reactive({
  name: authStore.name || '',
  email: '',
  phone: '',
  title: '',
  content: ''
})

// 按下「聯絡客服」時執行的動作：打開 Modal 並帶出這筆訂單過去的客服紀錄
const openServiceModal = async (id) => {
  activeServiceOrderId.value = id
  serviceForm.title = ''
  serviceForm.content = ''
  serviceRecords.value = await getCustomerServiceByOrder(id)
  showServiceModal.value = true
}

const closeServiceModal = () => {
  showServiceModal.value = false
}

// 按下「送出」時執行的動作：呼叫後端新增一筆客服紀錄，成功後加進畫面上的清單
const submitService = async () => {
  if (!serviceForm.title.trim() || !serviceForm.content.trim()) {
    alert('請填寫標題與內容')
    return
  }

  const saved = await createCustomerService(activeServiceOrderId.value, {
    name: serviceForm.name,
    email: serviceForm.email,
    phone: serviceForm.phone,
    title: serviceForm.title.trim(),
    content: serviceForm.content.trim()
  })

  serviceRecords.value.push(saved)
  serviceForm.title = ''
  serviceForm.content = ''
}
</script>

<template>
  <div class="clo-shell">
    <!-- 購物車圖示改為右下角浮動按鈕，見頁面最下方 -->
    <div class="clo-body">
      <!-- ============ 左側選單 ============ -->


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
                      <button class="edit-btn" :disabled="order.status.includes('已取消') || isReadOnly"
                        @click="openEditModal(order.id)">編輯</button>
                      <button class="cancel-btn" :disabled="order.status.includes('已取消') || isReadOnly"
                        @click="cancelOrder(order.id)">取消</button>
                      <button class="service-btn" :disabled="isReadOnly"
                        @click="openServiceModal(order.id)">聯絡客服</button>
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
        <div v-if="showEditModal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
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
                <div v-for="item in editForm.items" :key="item.id"
                  class="d-flex align-items-center justify-content-between edit-item-row">
                  <span class="small">{{ item.name }}</span>
                  <input type="number" min="1" class="form-control edit-qty-input" v-model.number="item.qty" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="closeEditModal">取消</button>
                <button type="button" class="btn btn-primary" @click="saveEdit">儲存</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ 聯絡客服 Modal ============ -->
        <div v-if="showServiceModal" class="modal-backdrop fade show"></div>
        <div v-if="showServiceModal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title fw-bold mb-0">聯絡客服 #{{ activeServiceOrderId }}</h5>
                <button type="button" class="btn-close" aria-label="Close" @click="closeServiceModal"></button>
              </div>
              <div class="modal-body">
                <div class="row g-2 mb-2">
                  <div class="col">
                    <label class="form-label small">姓名</label>
                    <input type="text" class="form-control form-control-sm" v-model="serviceForm.name" />
                  </div>
                  <div class="col">
                    <label class="form-label small">Email</label>
                    <input type="email" class="form-control form-control-sm" v-model="serviceForm.email" />
                  </div>
                  <div class="col">
                    <label class="form-label small">電話</label>
                    <input type="tel" class="form-control form-control-sm" v-model="serviceForm.phone" />
                  </div>
                </div>
                <div class="mb-2">
                  <label class="form-label small">標題</label>
                  <input type="text" class="form-control" v-model="serviceForm.title" placeholder="請簡短描述問題" />
                </div>
                <div class="mb-3">
                  <label class="form-label small">內容</label>
                  <textarea class="form-control" rows="3" v-model="serviceForm.content"
                    placeholder="請詳細描述您的問題"></textarea>
                </div>
                <button type="button" class="btn btn-primary btn-sm mb-3" @click="submitService">送出</button>

                <hr />
                <p class="small fw-bold mb-2">過去的客服紀錄</p>
                <p v-if="serviceRecords.length === 0" class="small text-muted">目前沒有客服紀錄</p>
                <div v-for="r in serviceRecords" :key="r.groupCustomerServiceId" class="service-record-row">
                  <p class="small fw-bold mb-1">{{ r.title }}</p>
                  <p class="small text-muted mb-1">{{ r.content }}</p>
                  <p v-if="r.replyContent" class="small text-success mb-0">
                    客服回覆：{{ r.replyContent }}（{{ r.repliedAt }}）
                  </p>
                  <p v-else class="small text-muted mb-0">尚未回覆</p>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="closeServiceModal">關閉</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ============ 浮動購物車按鈕（右下角，點擊直接跳到購物車畫面） ============ -->
    <router-link to="/GroupShop/checkout" class="floating-cart" aria-label="前往購物車">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
    </router-link>
  </div>
</template>

<style scoped>
/* 以下都是外觀樣式（顏色、間距、排版），跟訂單邏輯無關，可以先不用管 */

.clo-shell {
  --color-text: #4a3e3d;
  --color-text-muted: #6e5f5c;
  --color-accent: #b87352;
  --color-danger: #b8524f;
  --color-danger-border: #d8887f;
  --color-danger-bg: #fbeceb;
  --color-bg-page: #f8f5f0;
  --color-border: #e6dccf;
  --color-border-input: #d8c3b5;
  --color-hover-bg: #f1e7de;
  --color-active-bg: #ebdcd0;
  --color-dark-hover: #362d2c;
  /* 補回：.floating-cart:hover 有用到，原本沒定義會失效 */

  --shadow-float: 0 4px 12px rgba(74, 62, 61, 0.3);
  --radius-full: 999px;

  min-height: 100vh;
  background-color: var(--color-bg-page);
  color: var(--color-text);
}

.text-main {
  color: var(--color-text);
}

.text-accent {
  color: var(--color-accent);
}

table thead {
  background-color: var(--color-active-bg);
  color: var(--color-text);
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

/* 三個按鈕外觀骨架一樣（底色、字級、字重、padding、圓角、游標），只有邊框色/文字色不同 */
.cancel-btn,
.edit-btn,
.service-btn {
  background-color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn {
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
}

.cancel-btn:hover {
  background-color: var(--color-danger-bg);
}

/* edit-btn 跟 service-btn 邊框色、hover 底色都一樣，只有文字色不同 */
.edit-btn,
.service-btn {
  border: 1px solid var(--color-border-input);
}

.edit-btn:hover,
.service-btn:hover {
  background-color: var(--color-hover-bg);
}

.edit-btn {
  color: var(--color-text);
}

.service-btn {
  color: var(--color-text-muted);
}

/* disabled 狀態 edit-btn / cancel-btn / service-btn 完全一樣，合併成一組 */
.edit-btn:disabled,
.cancel-btn:disabled,
.service-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn:disabled:hover,
.cancel-btn:disabled:hover,
.service-btn:disabled:hover {
  background-color: #fff;
}

/* 服務紀錄列跟編輯品項列樣式相同，合併 */
.service-record-row,
.edit-item-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-hover-bg);
}

.service-record-row:last-child,
.edit-item-row:last-child {
  border-bottom: none;
}

.edit-qty-input {
  width: 80px;
  text-align: center;
}

.floating-cart {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  background-color: var(--color-text);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-float);
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
  border-radius: var(--radius-full);
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
  .clo-sidebar {
    width: 72px;
  }

  .nav-item span:last-child {
    display: none;
  }
}
</style>