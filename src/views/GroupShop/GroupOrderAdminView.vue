<template>
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h3 class="fw-bold mb-0">團購訂單管理</h3>
    <RouterLink :to="{ name: 'GroupProducts' }" class="back-link">
      ← 返回商品列表
    </RouterLink>
  </div>

  <div class="mb-3 d-flex gap-2">
    <button type="button" class="btn btn-outline-secondary" @click="openShipperManageModal">
      物流商管理
    </button>
    <button type="button" class="btn btn-outline-secondary" @click="openServiceListModal">
      客服紀錄查詢
    </button>
  </div>

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
      <!-- 響應式：外層包 table-responsive，欄位太多時窄螢幕可以左右滑動，不會直接爆版 -->
      <div class="table-responsive">
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

  <!-- ============ 物流商管理 Modal ============ -->
  <div v-if="showShipperManageModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showShipperManageModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">物流商管理</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showShipperManageModal = false"></button>
        </div>
        <div class="modal-body">
          <ul class="list-group mb-2">
            <li
              v-for="s in shippers"
              :key="s.groupShipperId"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <template v-if="editingShipperId === s.groupShipperId">
                <div class="flex-grow-1 me-2">
                  <input type="text" class="form-control form-control-sm mb-1" placeholder="物流商名稱" v-model="shipperEditForm.shipperName" />
                  <input type="text" class="form-control form-control-sm mb-1" placeholder="Email" v-model="shipperEditForm.email" />
                  <input type="text" class="form-control form-control-sm" placeholder="地址" v-model="shipperEditForm.address" />
                </div>
                <div class="d-flex flex-column gap-1">
                  <button type="button" class="btn btn-sm btn-primary" @click="saveShipperEdit(s)">存</button>
                  <button type="button" class="btn btn-sm btn-secondary" @click="editingShipperId = null">取消</button>
                </div>
              </template>
              <template v-else>
                <div>
                  <div class="fw-semibold">{{ s.shipperName }}</div>
                  <div class="text-muted small">{{ s.email }}｜{{ s.address }}</div>
                </div>
                <div class="d-flex gap-1">
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="startEditShipper(s)">編輯</button>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="handleDeleteShipper(s)">刪除</button>
                </div>
              </template>
            </li>
            <li v-if="shippers.length === 0" class="list-group-item text-muted text-center">
              尚未建立任何物流商
            </li>
          </ul>

          <hr />
          <h6 class="fw-bold">新增物流商</h6>
          <div class="row g-2">
            <div class="col-md-4">
              <input type="text" class="form-control form-control-sm" placeholder="物流商名稱" v-model="newShipperForm.shipperName" />
            </div>
            <div class="col-md-4">
              <input type="text" class="form-control form-control-sm" placeholder="Email" v-model="newShipperForm.email" />
            </div>
            <div class="col-md-4">
              <input type="text" class="form-control form-control-sm" placeholder="地址" v-model="newShipperForm.address" />
            </div>
          </div>
          <button type="button" class="btn btn-outline-primary btn-sm mt-2" @click="handleCreateShipper">新增</button>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showShipperManageModal = false">關閉</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ 客服紀錄查詢 Modal ============ -->
  <div v-if="showServiceListModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showServiceListModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">客服紀錄查詢</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showServiceListModal = false"></button>
        </div>
        <div class="modal-body">
          <!-- 響應式：外層包 table-responsive，窄螢幕可以左右滑動 -->
          <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>訂單編號</th>
                <th>姓名</th>
                <th>聯絡方式</th>
                <th>標題</th>
                <th>內容</th>
                <th>回覆</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in allServiceRecords" :key="r.groupCustomerServiceId">
                <td>#{{ r.groupOrderId }}</td>
                <td>{{ r.name }}</td>
                <td>{{ r.email }}｜{{ r.phone }}</td>
                <td>{{ r.title }}</td>
                <td>{{ r.content }}</td>
                <td>
                  <span v-if="r.replyContent" class="text-success small">
                    {{ r.replyContent }}
                    <div class="text-muted">({{ r.repliedAt }})</div>
                  </span>
                  <span v-else class="text-muted small">尚未回覆</span>
                </td>
                <td>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="openReplyModal(r)">
                    {{ r.replyContent ? '編輯回覆' : '回覆' }}
                  </button>
                </td>
              </tr>
              <tr v-if="allServiceRecords.length === 0">
                <td colspan="7" class="text-center text-muted py-4">目前沒有任何客服紀錄</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showServiceListModal = false">關閉</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ 回覆客服 Modal ============ -->
  <div v-if="showReplyModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showReplyModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">回覆客服：{{ replyTarget?.title }}</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showReplyModal = false"></button>
        </div>
        <div class="modal-body">
          <p class="text-muted small mb-2">買家提問：{{ replyTarget?.content }}</p>
          <div class="mb-3">
            <label class="form-label">回覆內容</label>
            <textarea class="form-control" rows="4" v-model="replyContent"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showReplyModal = false">取消</button>
          <button type="button" class="btn btn-primary" @click="handleSendReply">送出回覆</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  getAllOrders,
  updateOrderStatus,
  assignShipper,
  getShippers,
  createShipper,
  updateShipper,
  deleteShipper,
  getAllCustomerService,
  replyCustomerService
} from '@/api/groupShopAdmin'

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

// ---- 物流商管理 Modal ----
const showShipperManageModal = ref(false)
const openShipperManageModal = () => {
  showShipperManageModal.value = true
}

const newShipperForm = reactive({ shipperName: '', email: '', address: '' })
const handleCreateShipper = async () => {
  if (!newShipperForm.shipperName.trim()) return
  await createShipper({ ...newShipperForm })
  newShipperForm.shipperName = ''
  newShipperForm.email = ''
  newShipperForm.address = ''
  shippers.value = await getShippers()
}

const editingShipperId = ref(null)
const shipperEditForm = reactive({ shipperName: '', email: '', address: '' })
const startEditShipper = (s) => {
  editingShipperId.value = s.groupShipperId
  shipperEditForm.shipperName = s.shipperName
  shipperEditForm.email = s.email
  shipperEditForm.address = s.address
}
const saveShipperEdit = async (s) => {
  if (!shipperEditForm.shipperName.trim()) return
  await updateShipper(s.groupShipperId, { ...shipperEditForm })
  editingShipperId.value = null
  shippers.value = await getShippers()
}
const handleDeleteShipper = async (s) => {
  if (!confirm(`確定要刪除物流商「${s.shipperName}」嗎？`)) return
  try {
    await deleteShipper(s.groupShipperId)
    shippers.value = await getShippers()
  } catch (err) {
    alert(err.response?.data || '這個物流商已經有訂單在使用，不能刪除')
  }
}

// ---- 客服紀錄查詢 Modal ----
const showServiceListModal = ref(false)
const allServiceRecords = ref([])
const openServiceListModal = async () => {
  allServiceRecords.value = await getAllCustomerService()
  showServiceListModal.value = true
}

// ---- 回覆客服 Modal ----
const showReplyModal = ref(false)
const replyTarget = ref(null)
const replyContent = ref('')

const openReplyModal = (record) => {
  replyTarget.value = record
  replyContent.value = record.replyContent || ''
  showReplyModal.value = true
}

const handleSendReply = async () => {
  if (!replyContent.value.trim()) {
    alert('請填寫回覆內容')
    return
  }
  const updated = await replyCustomerService(replyTarget.value.groupCustomerServiceId, replyContent.value)
  const idx = allServiceRecords.value.findIndex(r => r.groupCustomerServiceId === updated.groupCustomerServiceId)
  if (idx !== -1) {
    allServiceRecords.value[idx] = updated
  }
  showReplyModal.value = false
}

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
<style scoped>
.back-link {
  display: inline-block;
  font-size: 0.88rem;
  color: #6c757d;
  text-decoration: none;
}
.back-link:hover {
  color: #212529;
  text-decoration: underline;
}
</style>
