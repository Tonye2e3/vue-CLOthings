<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 這一頁拿購物車數量顯示在 header
import { useGroupCartStore } from '@/stores/groupCart'
import { useAuthStore } from '@/stores/auth'
// 訂單相關 API：查詢、取消、編輯
import { getGroupOrders, getGroupOrderDetail, cancelGroupOrder, editGroupOrder } from '@/api/groupShop'

const route = useRoute()
const cartStore = useGroupCartStore()
const authStore = useAuthStore()

// 一般管理員（Admin）前台只能看不能操作，SuperAdmin 不受限
const isReadOnly = computed(() => authStore.role === 'Admin')

// 購物車商品數量
const cartCount = computed(() => cartStore.items.length)

// 訂單清單：改成向後端拿真正的資料，不再存 localStorage
// 欄位對應後端 GroupOrderListDTO，這裡把 groupOrderId 轉成 id，template 才不用改
const myOrders = reactive([])
// 訂單是否還在讀取中，讀取期間顯示骨架屏（go-skeleton）
const isLoading = ref(true)

const loadOrders = async () => {
  isLoading.value = true
  try {
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
  } finally {
    isLoading.value = false
  }
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

// 儲存中狀態：儲存按鈕顯示 loading 動畫、避免重複送出
const isSaving = ref(false)

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

  isSaving.value = true
  try {
    const updated = await editGroupOrder(editingOrderId.value, {
      shipName: editForm.shipName.trim(),
      items: editForm.items.map(i => ({ groupProductId: i.id, quantity: i.qty }))
    })

    // 把後端算好的結果寫回這筆訂單
    order.shipName = updated.shipName
    order.productName = updated.productName
    order.totalPrice = updated.totalPrice

    showEditModal.value = false
  } finally {
    isSaving.value = false
  }
}

// 把數字格式化成千分位顯示（例如 1234 -> 1,234）
const formatCurrency = (amount) => new Intl.NumberFormat('zh-TW').format(amount)
</script>

<template>
  <div class="clo-shell">
    <!-- 購物車圖示改為右下角浮動按鈕，見頁面最下方 -->
    <div class="clo-body">
      <!-- ============ 主要內容區：訂單列表 ============ -->
      <main class="clo-main">
        <div class="page-header mb-4">
          <h2 class="fw-bold mb-1">我的團購訂單</h2>
          <p class="text-muted small mb-0">追蹤您參與的所有團購專案與運送進度</p>
        </div>

        <div class="card shadow-sm border-0 rounded-3 overflow-hidden go-fade-in-up">
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
              <!-- 載入中：顯示 3 列骨架屏 -->
              <tbody v-if="isLoading">
                <tr v-for="n in 3" :key="n">
                  <td colspan="7">
                    <div class="go-skeleton" style="height: 18px; width: 100%;"></div>
                  </td>
                </tr>
              </tbody>
              <!-- v-for 把 myOrders 陣列裡每一筆訂單，重複產生一列表格資料；TransitionGroup 讓列表淡入更自然 -->
              <TransitionGroup v-else tag="tbody" name="go-fade">
                <tr v-for="order in myOrders" :key="order.id" class="go-row-hover">
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
                      <button class="edit-btn go-btn-tap" :disabled="order.status.includes('已取消') || isReadOnly"
                        @click="openEditModal(order.id)">編輯</button>
                      <button class="cancel-btn go-btn-tap" :disabled="order.status.includes('已取消') || isReadOnly"
                        @click="cancelOrder(order.id)">取消</button>
                    </div>
                  </td>
                </tr>
              </TransitionGroup>
            </table>
          </div>
        </div>

        <!-- ============ 編輯訂單 Modal ============ -->
        <!-- 背景遮罩：showEditModal 為 true 時顯示，讓後面的內容變暗、不能點擊 -->
        <Transition name="go-fade">
          <div v-if="showEditModal" class="modal-backdrop fade show"></div>
        </Transition>
        <Transition name="go-pop">
          <div v-if="showEditModal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title fw-bold mb-0">編輯訂單</h5>
                  <button type="button" class="btn-close go-icon-tap" aria-label="Close"
                    @click="closeEditModal"></button>
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
                  <button type="button" class="btn btn-outline-secondary go-btn-tap" @click="closeEditModal">取消</button>
                  <button type="button" class="btn btn-primary go-btn-tap" :disabled="isSaving" @click="saveEdit">
                    <span v-if="isSaving" class="go-spinner me-2"></span>
                    儲存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </main>
    </div>

    <!-- ============ 浮動購物車按鈕（右下角，點擊直接跳到購物車畫面） ============ -->
    <router-link to="/GroupShop/checkout" class="floating-cart go-btn-tap" aria-label="前往購物車">
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

/* 兩個按鈕外觀骨架一樣（底色、字級、字重、padding、圓角、游標），只有邊框色/文字色不同 */
.cancel-btn,
.edit-btn {
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

.edit-btn {
  border: 1px solid var(--color-border-input);
  color: var(--color-text);
}

.edit-btn:hover {
  background-color: var(--color-hover-bg);
}

/* disabled 狀態 edit-btn / cancel-btn 完全一樣，合併成一組 */
.edit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn:disabled:hover,
.cancel-btn:disabled:hover {
  background-color: #fff;
}

.edit-item-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-hover-bg);
}

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

.clo-main {
  flex: 1;
  padding: 28px 32px;
  min-width: 0;
}



/* ============ 本頁用到的特效樣式（進場動畫／懸停／按鈕微動效／載入動畫），class 一律以 go- 開頭 ============ */
@keyframes goFadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.go-fade-in-up {
  animation: goFadeInUp 0.5s ease both;
}

/* <Transition name="go-fade"> 用：淡入淡出 */
.go-fade-enter-active,
.go-fade-leave-active {
  transition: opacity 0.25s ease;
}

.go-fade-enter-from,
.go-fade-leave-to {
  opacity: 0;
}

/* <Transition name="go-pop"> 用：彈出效果（Modal） */
.go-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.go-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.go-pop-enter-from,
.go-pop-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.go-row-hover {
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.go-row-hover:hover {
  background-color: var(--color-hover-bg, #f1e7de);
}

.go-btn-tap {
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}

.go-btn-tap:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 6px 14px rgba(74, 62, 61, 0.18);
}

.go-btn-tap:active:not(:disabled) {
  transform: scale(0.94);
  filter: brightness(0.97);
}

.go-icon-tap {
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.go-icon-tap:hover {
  transform: scale(1.08);
}

.go-icon-tap:active {
  transform: scale(0.9);
}

@keyframes goShimmer {
  0% {
    background-position: -300px 0;
  }

  100% {
    background-position: 300px 0;
  }
}

.go-skeleton {
  position: relative;
  background: linear-gradient(90deg, #ece3d8 25%, #f6f0e8 37%, #ece3d8 63%);
  background-size: 600px 100%;
  animation: goShimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
  color: transparent !important;
}

@keyframes goSpin {
  to {
    transform: rotate(360deg);
  }
}

.go-spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  vertical-align: -2px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: goSpin 0.7s linear infinite;
}

@media (prefers-reduced-motion: reduce) {

  .go-fade-in-up,
  .go-btn-tap,
  .go-icon-tap,
  .go-skeleton,
  .go-spinner {
    animation-duration: 0.001s !important;
    transition-duration: 0.001s !important;
  }
}
</style>