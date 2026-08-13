<template>
  <h3 class="fw-bold mb-4">團購訂單管理</h3>

  <div class="mb-3 d-flex align-items-center flex-wrap gap-2">
    <label class="form-label mb-0">篩選狀態：</label>
    <select class="form-select w-auto" v-model="statusFilter" @change="loadOrders">
      <option value="">全部</option>
      <option value="進行中 (組團中)">進行中 (組團中)</option>
      <option value="已成團 (備貨中)">已成團 (備貨中)</option>
      <option value="已完成">已完成</option>
      <option value="已取消">已取消</option>
    </select>
    <input
      type="text"
      class="form-control w-auto"
      style="min-width: 220px"
      placeholder="搜尋商品名稱或訂單編號..."
      v-model="searchQuery"
    />
  </div>

  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span class="fw-semibold">訂單列表</span>
      <span>共 {{ filteredOrders.length }} 筆</span>
    </div>
    <div class="card-body p-0">
      <table class="table mb-0 align-middle">
        <thead class="table-light">
          <tr>
            <th role="button" class="user-select-none" @click="toggleSort('groupOrderId')">
              訂單編號 <span class="text-muted small">{{ sortIndicator('groupOrderId') }}</span>
            </th>
            <th>會員編號</th>
            <th role="button" class="user-select-none" @click="toggleSort('productName')">
              訂購產品 <span class="text-muted small">{{ sortIndicator('productName') }}</span>
            </th>
            <th>狀態</th>
            <th class="text-end" role="button" @click="toggleSort('totalPrice')">
              總金額 <span class="text-muted small">{{ sortIndicator('totalPrice') }}</span>
            </th>
            <th role="button" class="user-select-none" @click="toggleSort('orderDate')">
              訂單日期 <span class="text-muted small">{{ sortIndicator('orderDate') }}</span>
            </th>
            <th>收件人</th>
            <th>物流</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedOrders.length === 0">
            <td colspan="9" class="text-center text-muted py-4">
              {{ searchQuery ? '找不到符合搜尋條件的訂單' : '目前尚無訂單資料' }}
            </td>
          </tr>
          <tr v-for="o in pagedOrders" :key="o.groupOrderId">
            <td class="fw-bold">#{{ o.groupOrderId }}</td>
            <td>{{ o.userId }}</td>
            <td>{{ o.productName }}</td>
            <td>
              <span class="badge" :class="getBadgeClass(o.status)">{{ o.status }}</span>
            </td>
            <td class="text-end">NT$ {{ formatCurrency(o.totalPrice) }}</td>
            <td>{{ o.orderDate }}</td>
            <td>{{ o.shipName }}</td>
            <td>{{ o.shipperName || '未指派' }}</td>
            <td class="text-end">
              <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="openStatusModal(o)">
                改狀態
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="openShipperModal(o)">
                指派物流
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="totalPages > 1" class="card-footer d-flex justify-content-between align-items-center">
      <span class="text-muted small">第 {{ currentPage }} / {{ totalPages }} 頁</span>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button type="button" class="page-link" @click="goToPage(currentPage - 1)">上一頁</button>
          </li>
          <li
            v-for="n in totalPages"
            :key="n"
            class="page-item"
            :class="{ active: n === currentPage }"
          >
            <button type="button" class="page-link" @click="goToPage(n)">{{ n }}</button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button type="button" class="page-link" @click="goToPage(currentPage + 1)">下一頁</button>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!-- 更新狀態 Modal（直接寫死的 Bootstrap Modal，不依賴額外元件） -->
  <div v-if="showStatusModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showStatusModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">更新訂單狀態 #{{ activeOrder?.groupOrderId }}</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showStatusModal = false"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">狀態</label>
            <select class="form-select" v-model="statusForm.status">
              <option value="進行中 (組團中)">進行中 (組團中)</option>
              <option value="已成團 (備貨中)">已成團 (備貨中)</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showStatusModal = false">取消</button>
          <button type="button" class="btn btn-primary" @click="handleSaveStatus">儲存</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 指派物流 Modal（直接寫死的 Bootstrap Modal，不依賴額外元件） -->
  <div v-if="showShipperModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showShipperModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">指派物流 #{{ activeOrder?.groupOrderId }}</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showShipperModal = false"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">物流商</label>
            <select class="form-select" v-model.number="shipperForm.groupShipperId">
              <option value="">請選擇物流商</option>
              <option v-for="s in shippers" :key="s.groupShipperId" :value="s.groupShipperId">
                {{ s.shipperName }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showShipperModal = false">取消</button>
          <button type="button" class="btn btn-primary" @click="handleSaveShipper">儲存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getAllOrders, updateOrderStatus, assignShipper, getShippers } from '@/api/groupShopAdmin'

const orders = ref([])
const shippers = ref([])
const statusFilter = ref('')

const loadOrders = async () => {
  orders.value = await getAllOrders(statusFilter.value)
}

onMounted(async () => {
  await loadOrders()
  shippers.value = await getShippers()
})

// ---- 搜尋（商品名稱 或 訂單編號） ----
const searchQuery = ref('')

const filteredOrders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return orders.value
  return orders.value.filter(o =>
    o.productName?.toLowerCase().includes(q) ||
    String(o.groupOrderId).includes(q)
  )
})

// ---- 排序 ----
const sortKey = ref(null)
const sortOrder = ref('asc') // 'asc' | 'desc'

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortIndicator = (key) => {
  if (sortKey.value !== key) return ''
  return sortOrder.value === 'asc' ? '▲' : '▼'
}

const sortedOrders = computed(() => {
  if (!sortKey.value) return filteredOrders.value
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1
  return [...filteredOrders.value].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (typeof va === 'string') return va.localeCompare(vb) * order
    return (va - vb) * order
  })
})

// ---- 分頁 ----
const currentPage = ref(1)
const pageSize = 5

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedOrders.value.length / pageSize))
)

const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedOrders.value.slice(start, start + pageSize)
})

const goToPage = (n) => {
  if (n < 1 || n > totalPages.value) return
  currentPage.value = n
}

// 搜尋、排序或狀態篩選改變時，跳回第一頁
watch([searchQuery, sortKey, sortOrder, statusFilter], () => {
  currentPage.value = 1
})

// 資料筆數變少時，避免停在不存在的頁碼
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

// 依訂單狀態文字，回傳對應的徽章顏色 class（跟買家端 GroupOrdersView.vue 用同一套邏輯）
const getBadgeClass = (status) => {
  if (status.includes('已完成')) return 'bg-success'
  if (status.includes('已成團')) return 'bg-primary'
  if (status.includes('進行中')) return 'bg-warning text-dark'
  if (status.includes('已取消')) return 'bg-secondary'
  return 'bg-secondary'
}

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// ---- 更新狀態 ----
const showStatusModal = ref(false)
const activeOrder = ref(null)
const statusForm = reactive({ status: '' })

const openStatusModal = (o) => {
  activeOrder.value = o
  statusForm.status = o.status
  showStatusModal.value = true
}

const handleSaveStatus = async () => {
  await updateOrderStatus(activeOrder.value.groupOrderId, statusForm.status)
  activeOrder.value.status = statusForm.status
  showStatusModal.value = false
}

// ---- 指派物流 ----
const showShipperModal = ref(false)
const shipperForm = reactive({ groupShipperId: '' })

const openShipperModal = (o) => {
  activeOrder.value = o
  shipperForm.groupShipperId = o.groupShipperId || ''
  showShipperModal.value = true
}

const handleSaveShipper = async () => {
  if (!shipperForm.groupShipperId) {
    alert('請選擇物流商')
    return
  }
  await assignShipper(activeOrder.value.groupOrderId, { groupShipperId: shipperForm.groupShipperId })
  const shipper = shippers.value.find(s => s.groupShipperId === shipperForm.groupShipperId)
  activeOrder.value.shipperName = shipper?.shipperName
  showShipperModal.value = false
}
</script>