<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
// 結帳 API
import { checkoutGroupOrder } from '@/api/groupShop'

const route = useRoute()
const router = useRouter()
const cartStore = useGroupCartStore()

const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')

onMounted(() => {
  cartStore.fetchCart()
})

// 目前登入會員的 userId（跟 groupCart.js 用同一套邏輯，之後接上真正登入流程後統一調整即可）
const getUserId = () => Number(localStorage.getItem('userId')) || 1

const cartItems = computed(() => cartStore.items)
const cartCount = computed(() => cartItems.value.length)

// 單價後端已經算好了，購物車裡的每一項本身就帶著 unitPrice，不用再自己查商品目錄算一次
const unitPriceOf = (item) => item.unitPrice

// 商品小計：每項「單價 x 數量」加總
const subtotal = computed(() =>
  cartItems.value.reduce((sum, i) => sum + unitPriceOf(i) * i.qty, 0)
)

// 滿 $1,000 免運，未滿則加收運費 $60
const freight = computed(() => (subtotal.value >= 1000 ? 0 : 60))
const grandTotal = computed(() => subtotal.value + freight.value)

// 收件人資訊
const orderInfo = reactive({
  shipName: '',
  shipPhone: '',
  shipAddress: '',
  pickupMethod: '宅配到府',
  paymentMethod: '信用卡付款'
})

// 把數字格式化成千分位顯示（例如 1234 -> 1,234）
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 按下「返回購物車」時，跳回購物車頁面
const backToCart = () => {
  router.push('/GroupShop/checkout')
}

// 按下「確認送出訂單」時執行的動作：改成呼叫後端結帳 API，
// 不用再自己組訂單物件存 localStorage、也不用自己維護「已成立件數」
const handleSubmit = async () => {
  // 先檢查必填欄位有沒有填寫，沒填就跳出提示並中斷（return）
  if (!orderInfo.shipName || !orderInfo.shipPhone || !orderInfo.shipAddress) {
    alert('請完整填寫收件人姓名、電話與地址')
    return
  }
  // 購物車是空的也不能送出訂單
  if (cartItems.value.length === 0) {
    alert('購物車是空的，請先加入商品')
    return
  }

  try {
    await checkoutGroupOrder({
      userId: getUserId(),
      shipName: orderInfo.shipName,
      shipPhone: orderInfo.shipPhone,
      shipAddress: orderInfo.shipAddress,
      pickupMethod: orderInfo.pickupMethod,
      paymentMethod: orderInfo.paymentMethod
    })

    alert('訂單已送出！即將轉至訂單列表頁面。')
    cartStore.items = [] // 後端結帳成功時已經清空購物車了，這裡同步一下畫面
    router.push('/GroupShop/orders') // 跳轉到「我的團購訂單」頁面
  } catch (err) {
    // 後端檢查沒過（例如購物車是空的）會回傳錯誤訊息，直接顯示出來
    alert(err.response?.data || '訂單送出失敗，請稍後再試')
  }
}
</script>
