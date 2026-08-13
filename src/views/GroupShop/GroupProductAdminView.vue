<template>
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h3 class="fw-bold mb-0">團購商品管理</h3>
    <RouterLink :to="{ name: 'GroupProducts' }" class="back-link">
      ← 返回商品列表
    </RouterLink>
  </div>

  <div class="mb-4 d-flex gap-2">
    <button type="button" class="btn btn-success" @click="openCreateModal">
      新增團購商品
    </button>
    <button type="button" class="btn btn-outline-secondary" @click="openLookupModal">
      分類 / 供應商管理
    </button>
  </div>

  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <span class="fw-semibold">商品列表</span>
      <div class="d-flex align-items-center gap-2">
        <input
          type="text"
          class="form-control form-control-sm"
          style="width: 220px"
          placeholder="搜尋商品名稱..."
          v-model="searchQuery"
        />
        <span>共 {{ filteredProducts.length }} 筆</span>
      </div>
    </div>
    <div class="card-body p-0">
      <table class="table mb-0 align-middle">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>圖</th>
            <th role="button" class="user-select-none" @click="toggleSort('name')">
              商品名稱 <span class="text-muted small">{{ sortIndicator('name') }}</span>
            </th>
            <th>狀態</th>
            <th class="text-end" role="button" @click="toggleSort('listPrice')">
              售價 <span class="text-muted small">{{ sortIndicator('listPrice') }}</span>
            </th>
            <th class="text-center" role="button" @click="toggleSort('orderedQty')">
              已訂購件數 <span class="text-muted small">{{ sortIndicator('orderedQty') }}</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedProducts.length === 0">
            <td colspan="7" class="text-center text-muted py-4">
              {{ searchQuery ? '找不到符合搜尋條件的商品' : '目前尚無商品資料' }}
            </td>
          </tr>
          <tr v-for="p in pagedProducts" :key="p.id">
            <td class="text-body-secondary small">{{ p.id }}</td>
            <td><img :src="resolveImageUrl(p.imageUrl)" class="img-thumbnail" style="width: 60px" /></td>
            <td class="fw-semibold">{{ p.name }}</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(p.status)">{{ p.status }}</span>
            </td>
            <td class="text-end">NT$ {{ formatCurrency(p.listPrice) }}</td>
            <td class="text-center">{{ p.orderedQty }}</td>
            <td class="text-end">
              <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(p)">
                編輯
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" @click="handleDelete(p)">
                刪除
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

  <!-- 新增/編輯商品 Modal（直接寫死的 Bootstrap Modal，不依賴額外元件） -->
  <div v-if="showModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">{{ editingId ? '編輯商品' : '新增商品' }}</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showModal = false"></button>
        </div>

        <div class="modal-body">
          <!-- 從產品選擇：只有新增商品時顯示，帶入名稱與圖片後仍可手動修改 -->
          <div v-if="!editingId" class="mb-3">
            <button type="button" class="btn btn-outline-primary btn-sm" @click="openPickProductModal">
              從產品選擇
            </button>
            <span v-if="pickedProductName" class="text-muted small ms-2">
              已帶入：{{ pickedProductName }}
            </span>
          </div>

          <div class="mb-3">
            <label class="form-label">商品名稱</label>
            <input type="text" class="form-control" v-model="form.productName" />
          </div>
          <div class="mb-3">
            <label class="form-label">商品圖片</label>
            <input type="file" accept="image/*" class="form-control" @change="handleImageSelect" />
            <div class="form-text" v-if="uploadingImage">圖片上傳中...</div>
            <img
              v-if="form.productImg"
              :src="resolveImageUrl(form.productImg)"
              class="img-thumbnail mt-2"
              style="width: 80px"
            />
          </div>
          <div class="row g-2 mb-3">
            <div class="col">
              <label class="form-label">供應商</label>
              <select class="form-select" v-model.number="form.groupSupplierId">
                <option value="">請選擇供應商</option>
                <option v-for="s in suppliers" :key="s.groupSupplierId" :value="s.groupSupplierId">
                  {{ s.supplierName }}
                </option>
              </select>
            </div>
            <div class="col">
              <label class="form-label">分類</label>
              <select class="form-select" v-model.number="form.groupProductCategoryId">
                <option value="">請選擇分類</option>
                <option v-for="c in categories" :key="c.groupProductCategoryId" :value="c.groupProductCategoryId">
                  {{ c.categoryName }}
                </option>
              </select>
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col">
              <label class="form-label">售價（NT$）</label>
              <input type="number" class="form-control" v-model.number="form.price" min="0" />
            </div>
            <div class="col">
              <label class="form-label">狀態</label>
              <select class="form-select" v-model="form.status">
                <option value="上架中">上架中</option>
                <option value="已下架">已下架</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label">商品描述</label>
            <textarea class="form-control" rows="3" v-model="form.description"></textarea>
          </div>

          <!-- 團購階層管理：只有編輯已存在的商品時才能設定（新增商品要先存檔拿到 id） -->
          <div v-if="editingId" class="mb-3">
            <label class="form-label fw-semibold">團購階層</label>
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>階層名稱</th>
                  <th>門檻件數</th>
                  <th>折扣（0~1）</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in tiers" :key="t.groupDiscountStandardId">
                  <td>{{ t.tierLevel }}</td>
                  <td>{{ t.thresholdCount }}</td>
                  <td>{{ t.discountRate }}</td>
                  <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="handleDeleteTier(t)">
                      刪除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="row g-2">
              <div class="col">
                <input type="text" class="form-control form-control-sm" placeholder="階層名稱，例如「第一階」" v-model="newTier.tierLevel" />
              </div>
              <div class="col">
                <input type="number" class="form-control form-control-sm" placeholder="門檻件數" v-model.number="newTier.thresholdCount" min="1" />
              </div>
              <div class="col">
                <input type="number" class="form-control form-control-sm" placeholder="折扣，例如 0.9" v-model.number="newTier.discountRate" step="0.01" min="0" max="1" />
              </div>
              <div class="col-auto">
                <button type="button" class="btn btn-sm btn-outline-primary" @click="handleAddTier">新增階層</button>
              </div>
            </div>
          </div>
          <p v-else class="text-muted small">先儲存商品基本資料後，才能設定團購階層。</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showModal = false">取消</button>
          <button type="button" class="btn btn-primary" @click="handleSave">儲存</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 從產品選擇 Modal（TODO：目前用假資料 mockProductList，等後端 API 好了要替換成真的查詢） -->
  <div v-if="showPickProductModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showPickProductModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">從產品選擇</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showPickProductModal = false"></button>
        </div>
        <div class="modal-body">
          <input
            type="text"
            class="form-control mb-3"
            placeholder="搜尋產品名稱..."
            v-model="pickProductQuery"
          />
          <div class="list-group" style="max-height: 400px; overflow-y: auto">
            <button
              v-for="prod in filteredMockProducts"
              :key="prod.id"
              type="button"
              class="list-group-item list-group-item-action d-flex align-items-center gap-3"
              @click="handlePickProduct(prod)"
            >
              <img :src="resolveImageUrl(prod.imageUrl)" style="width: 48px; height: 48px; object-fit: cover" class="rounded" />
              <span class="fw-semibold">{{ prod.name }}</span>
              <span class="text-muted ms-auto">NT$ {{ formatCurrency(prod.price) }}</span>
            </button>
            <p v-if="filteredMockProducts.length === 0" class="text-muted text-center py-3 mb-0">
              找不到符合的產品
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showPickProductModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ 分類 / 供應商管理 Modal ============ -->
  <div v-if="showLookupModal" class="modal-backdrop fade show"></div>
  <div
    v-if="showLookupModal"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold mb-0">分類 / 供應商管理</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showLookupModal = false"></button>
        </div>
        <div class="modal-body">
          <div class="row g-4">
            <!-- 分類管理 -->
            <div class="col-md-6">
              <h6 class="fw-bold mb-2">分類</h6>
              <ul class="list-group mb-2">
                <li
                  v-for="c in categories"
                  :key="c.groupProductCategoryId"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  <template v-if="editingCategoryId === c.groupProductCategoryId">
                    <input type="text" class="form-control form-control-sm me-2" v-model="categoryEditName" />
                    <div class="d-flex gap-1">
                      <button type="button" class="btn btn-sm btn-primary" @click="saveCategoryEdit(c)">存</button>
                      <button type="button" class="btn btn-sm btn-secondary" @click="editingCategoryId = null">取消</button>
                    </div>
                  </template>
                  <template v-else>
                    <span>{{ c.categoryName }}</span>
                    <div class="d-flex gap-1">
                      <button type="button" class="btn btn-sm btn-outline-secondary" @click="startEditCategory(c)">編輯</button>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="handleDeleteCategory(c)">刪除</button>
                    </div>
                  </template>
                </li>
                <li v-if="categories.length === 0" class="list-group-item text-muted text-center">
                  尚未建立任何分類
                </li>
              </ul>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" placeholder="新分類名稱" v-model="newCategoryName" />
                <button type="button" class="btn btn-outline-primary" @click="handleCreateCategory">新增</button>
              </div>
            </div>

            <!-- 供應商管理 -->
            <div class="col-md-6">
              <h6 class="fw-bold mb-2">供應商</h6>
              <ul class="list-group mb-2">
                <li
                  v-for="s in suppliers"
                  :key="s.groupSupplierId"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  <template v-if="editingSupplierId === s.groupSupplierId">
                    <input type="text" class="form-control form-control-sm me-2" v-model="supplierEditName" />
                    <div class="d-flex gap-1">
                      <button type="button" class="btn btn-sm btn-primary" @click="saveSupplierEdit(s)">存</button>
                      <button type="button" class="btn btn-sm btn-secondary" @click="editingSupplierId = null">取消</button>
                    </div>
                  </template>
                  <template v-else>
                    <span>{{ s.supplierName }}</span>
                    <div class="d-flex gap-1">
                      <button type="button" class="btn btn-sm btn-outline-secondary" @click="startEditSupplier(s)">編輯</button>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="handleDeleteSupplier(s)">刪除</button>
                    </div>
                  </template>
                </li>
                <li v-if="suppliers.length === 0" class="list-group-item text-muted text-center">
                  尚未建立任何供應商
                </li>
              </ul>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" placeholder="新供應商名稱" v-model="newSupplierName" />
                <button type="button" class="btn btn-outline-primary" @click="handleCreateSupplier">新增</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showLookupModal = false">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getGroupProducts } from '@/api/groupShop'
import {
  getProductForEdit,
  createProduct,
  updateProduct,
  deleteProduct,
  getTiers,
  addTier,
  deleteTier,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  uploadProductImage
} from '@/api/groupShopAdmin'
// 圖片網址工具：後端上傳圖片回傳的是相對路徑（例如 /images/group-products/xxx.jpg），
// 舊示範資料則是完整網址（例如 https://picsum.photos/...），這裡統一組成完整網址
const API_BASE = 'https://localhost:7255'
const resolveImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path}`
}


// 圖片上傳中的狀態，避免使用者在上傳完成前就按下儲存
const uploadingImage = ref(false)

// 選好圖片檔案後：立刻呼叫後端上傳，成功後把回傳的路徑存進 form.productImg
const handleImageSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  uploadingImage.value = true
  try {
    form.productImg = await uploadProductImage(file)
  } catch (err) {
    alert(err.response?.data || '圖片上傳失敗，請稍後再試')
  } finally {
    uploadingImage.value = false
    e.target.value = '' // 清空 input，避免選同一個檔案時 change 事件不會再觸發
  }
}

const products = ref([])
const categories = ref([])
const suppliers = ref([])

const loadProducts = async () => {
  products.value = await getGroupProducts()
}

onMounted(async () => {
  await loadProducts()
  categories.value = await getCategories()
  suppliers.value = await getSuppliers()
})

// ---- 分類 / 供應商管理 Modal ----
const showLookupModal = ref(false)
const openLookupModal = () => {
  showLookupModal.value = true
}

// 分類：新增
const newCategoryName = ref('')
const handleCreateCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) return
  await createCategory({ categoryName: name, description: '' })
  newCategoryName.value = ''
  categories.value = await getCategories()
}
// 分類：編輯
const editingCategoryId = ref(null)
const categoryEditName = ref('')
const startEditCategory = (c) => {
  editingCategoryId.value = c.groupProductCategoryId
  categoryEditName.value = c.categoryName
}
const saveCategoryEdit = async (c) => {
  const name = categoryEditName.value.trim()
  if (!name) return
  await updateCategory(c.groupProductCategoryId, { categoryName: name, description: c.description })
  editingCategoryId.value = null
  categories.value = await getCategories()
}
// 分類：刪除
const handleDeleteCategory = async (c) => {
  if (!confirm(`確定要刪除分類「${c.categoryName}」嗎？`)) return
  try {
    await deleteCategory(c.groupProductCategoryId)
    categories.value = await getCategories()
  } catch (err) {
    alert(err.response?.data || '這個分類已經有商品在使用，不能刪除')
  }
}

// 供應商：新增
const newSupplierName = ref('')
const handleCreateSupplier = async () => {
  const name = newSupplierName.value.trim()
  if (!name) return
  await createSupplier({ supplierName: name, contactName: '', contactTitle: '', address: '', phone: '' })
  newSupplierName.value = ''
  suppliers.value = await getSuppliers()
}
// 供應商：編輯
const editingSupplierId = ref(null)
const supplierEditName = ref('')
const startEditSupplier = (s) => {
  editingSupplierId.value = s.groupSupplierId
  supplierEditName.value = s.supplierName
}
const saveSupplierEdit = async (s) => {
  const name = supplierEditName.value.trim()
  if (!name) return
  await updateSupplier(s.groupSupplierId, {
    supplierName: name,
    contactName: s.contactName,
    contactTitle: s.contactTitle,
    address: s.address,
    phone: s.phone
  })
  editingSupplierId.value = null
  suppliers.value = await getSuppliers()
}
// 供應商：刪除
const handleDeleteSupplier = async (s) => {
  if (!confirm(`確定要刪除供應商「${s.supplierName}」嗎？`)) return
  try {
    await deleteSupplier(s.groupSupplierId)
    suppliers.value = await getSuppliers()
  } catch (err) {
    alert(err.response?.data || '這個供應商已經有商品在使用，不能刪除')
  }
}

// ---- 搜尋 ----
const searchQuery = ref('')

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(p => p.name?.toLowerCase().includes(q))
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

const sortedProducts = computed(() => {
  if (!sortKey.value) return filteredProducts.value
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1
  return [...filteredProducts.value].sort((a, b) => {
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
  Math.max(1, Math.ceil(sortedProducts.value.length / pageSize))
)

const pagedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedProducts.value.slice(start, start + pageSize)
})

const goToPage = (n) => {
  if (n < 1 || n > totalPages.value) return
  currentPage.value = n
}

// 搜尋或排序條件改變時，跳回第一頁，避免停在超出範圍的頁碼
watch([searchQuery, sortKey, sortOrder], () => {
  currentPage.value = 1
})

// 刪除資料後頁數變少時，避免停在不存在的頁碼
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

const showModal = ref(false)
const editingId = ref(null)

const form = reactive({
  productName: '',
  productImg: '',
  groupSupplierId: '',
  groupProductCategoryId: '',
  price: 0,
  status: '上架中',
  description: ''
})

const resetForm = () => {
  form.productName = ''
  form.productImg = ''
  form.groupSupplierId = ''
  form.groupProductCategoryId = ''
  form.price = 0
  form.status = '上架中'
  form.description = ''
}

const tiers = ref([])
const newTier = reactive({ tierLevel: '', thresholdCount: null, discountRate: null })

const openCreateModal = () => {
  editingId.value = null
  resetForm()
  tiers.value = []
  pickedProductName.value = ''
  showModal.value = true
}

// ---- 從產品選擇（目前用假資料，等後端有「查詢產品列表」的 API 後，把 mockProductList 換成 API 呼叫即可） ----
const mockProductList = ref([
  { id: 'P001', name: '黑色棉質圓領 T 恤', imageUrl: 'https://placehold.co/100x100?text=T-Shirt', price: 390 },
  { id: 'P002', name: '刷色直筒牛仔褲', imageUrl: 'https://placehold.co/100x100?text=Jeans', price: 890 },
  { id: 'P003', name: '碎花洋裝', imageUrl: 'https://placehold.co/100x100?text=Dress', price: 690 },
  { id: 'P004', name: '針織開襟外套', imageUrl: 'https://placehold.co/100x100?text=Cardigan', price: 750 },
  { id: 'P005', name: '百褶中長裙', imageUrl: 'https://placehold.co/100x100?text=Skirt', price: 590 }
])

const showPickProductModal = ref(false)
const pickProductQuery = ref('')
const pickedProductName = ref('')

const filteredMockProducts = computed(() => {
  const q = pickProductQuery.value.trim().toLowerCase()
  if (!q) return mockProductList.value
  return mockProductList.value.filter(p => p.name.toLowerCase().includes(q))
})

const openPickProductModal = () => {
  pickProductQuery.value = ''
  showPickProductModal.value = true
}

// 選定產品後自動帶入名稱、圖片與售價，帶入後使用者仍可在表單裡手動修改
const handlePickProduct = (prod) => {
  form.productName = prod.name
  form.productImg = prod.imageUrl
  form.price = prod.price
  pickedProductName.value = prod.name
  showPickProductModal.value = false
}

const openEditModal = async (p) => {
  editingId.value = p.id
  const detail = await getProductForEdit(p.id)
  form.productName = detail.productName
  form.productImg = detail.productImg
  form.groupSupplierId = detail.groupSupplierId
  form.groupProductCategoryId = detail.groupProductCategoryId
  form.price = detail.price
  form.status = detail.status
  form.description = detail.description

  tiers.value = await getTiers(p.id)
  showModal.value = true
}

// 按下「儲存」：有 editingId 就是編輯，沒有就是新增
const handleSave = async () => {
  if (!form.productName || !form.groupSupplierId || !form.groupProductCategoryId) {
    alert('請完整填寫商品名稱、供應商與分類')
    return
  }

  const isCreating = !editingId.value

  if (editingId.value) {
    await updateProduct(editingId.value, form)
  } else {
    const created = await createProduct(form)
    editingId.value = created.id // 新增成功後直接可以繼續設定團購階層
  }

  await loadProducts()

  if (isCreating) {
    // 新增商品：不關閉視窗，留在原地讓使用者接著設定團購階層
    tiers.value = await getTiers(editingId.value)
  } else {
    // 編輯既有商品：儲存後直接關閉視窗
    showModal.value = false
  }
}

const handleDelete = async (p) => {
  if (!confirm(`確定要刪除「${p.name}」嗎？`)) return
  const res = await deleteProduct(p.id)
  if (res?.data?.message) {
    alert(res.data.message) // 後端如果改成下架而非真的刪除，會回這則訊息
  }
  await loadProducts()
}

const handleAddTier = async () => {
  if (!newTier.tierLevel || !newTier.thresholdCount || newTier.discountRate == null) {
    alert('請完整填寫階層名稱、門檻件數與折扣')
    return
  }
  const saved = await addTier(editingId.value, { ...newTier })
  tiers.value.push(saved)
  newTier.tierLevel = ''
  newTier.thresholdCount = null
  newTier.discountRate = null
}

const handleDeleteTier = async (t) => {
  if (!confirm('確定要刪除這個階層嗎？')) return
  await deleteTier(t.groupDiscountStandardId)
  tiers.value = tiers.value.filter(x => x.groupDiscountStandardId !== t.groupDiscountStandardId)
}

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 依商品狀態決定標籤顏色：已成團=藍色，已流團=灰色，其他狀態維持預設淺灰
const getStatusBadgeClass = (status) => {
  if (status === '已成團') return 'bg-primary'
  if (status === '已流團') return 'bg-secondary'
  return 'text-bg-light text-dark border'
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
