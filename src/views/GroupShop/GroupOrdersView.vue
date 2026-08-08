<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 這一頁拿購物車數量顯示在 header
import { useGroupCartStore } from '@/stores/groupCart'
// 訂單相關 API：查詢、取消、編輯
import { getGroupOrders, getGroupOrderDetail, cancelGroupOrder, editGroupOrder } from '@/api/groupShop'

const route = useRoute()
const cartStore = useGroupCartStore()

const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
// 購物車商品數量
const cartCount = computed(() => cartStore.items.length)

// 目前登入會員的 userId
const getUserId = () => Number(localStorage.getItem('userId')) || 1

// 訂單清單：改成向後端拿真正的資料，不再存 localStorage
// 欄位對應後端 GroupOrderListDTO，這裡把 groupOrderId 轉成 id，template 才不用改
const myOrders = reactive([])

const loadOrders = async () => {
  const rows = await getGroupOrders(getUserId())
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
  cartStore.fetchCart()
  loadOrders()
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
</script>
