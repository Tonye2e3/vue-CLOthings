<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'

const route = useRoute()
const router = useRouter()

const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')

// 呼叫 useGroupCartStore()
const cartStore = useGroupCartStore()

// 進到購物車頁時，跟後端同步一次目前的購物車內容
onMounted(() => {
  cartStore.fetchCart()
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
