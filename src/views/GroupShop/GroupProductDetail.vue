<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
// 團購商品 API
import { getGroupProduct } from '@/api/groupShop'

const route = useRoute()
const router = useRouter()
const cartStore = useGroupCartStore()

// 左側選單要顯示的項目清單
const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]

// 判斷某個選單項目是不是「目前所在的頁面」，是的話會加上 active 樣式（醒目提示）
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')

// 購物車商品數量：直接從 store 拿
const cartCount = computed(() => cartStore.items.length)

// 商品資料：改成向後端拿，不再用寫死的 catalog
// 先給預設空殼，避免 API 還沒回來時 template 存取 product.xxx 噴錯
const product = ref({
  id: 0,
  name: '',
  imageUrl: '',
  listPrice: 0,
  intro: '',
  tiers: [],
  orderedQty: 0
})

onMounted(async () => {
  await cartStore.fetchCart()
  const id = Number(route.params.id)
  product.value = await getGroupProduct(id)
})

// 讀取購物車裡此商品目前的數量
const cartQtyOf = (id) => {
  const item = cartStore.items.find(i => i.id === id)
  return item ? item.qty : 0
}

// 目前已訂購件數 = 後端算好的「已成立訂單」件數 + 購物車裡實際加入的數量
const orderedQty = computed(() => product.value.orderedQty + cartQtyOf(product.value.id))

// 目前已解鎖的階層（尚未達第一階層則回傳 null）
const currentTier = computed(() => {
  let tier = null
  for (const t of product.value.tiers) {
    if (orderedQty.value >= t.qty) tier = t
  }
  return tier
})

// 該階層的團購價：後端已經算好放在 tier.unitPrice
const tierPriceOf = (tier) => tier.unitPrice

// 目前應該顯示的單價：有解鎖階層就用階層價，否則用原價
const currentUnitPrice = computed(() => currentTier.value ? tierPriceOf(currentTier.value) : product.value.listPrice)

// 第二階層
const finalTier = computed(() => product.value.tiers[product.value.tiers.length - 1])

// 第一階層
const nextTier = computed(() =>
  product.value.tiers.find(t => t.qty > orderedQty.value)
)

// 進度條百分比：目前件數 / 最終階層件數，最多顯示到 100%
const progressPercent = computed(() => {
  if (!finalTier.value) return 0
  return Math.min(100, Math.round((orderedQty.value / finalTier.value.qty) * 100))
})

// 圓形進度條的幾何參數：半徑固定，周長依半徑算出，再依百分比算出要留白的長度
const ringRadius = 46
const ringCircumference = 2 * Math.PI * ringRadius
const ringDashOffset = computed(() => ringCircumference * (1 - progressPercent.value / 100))

// 判斷某個階層是否已經解鎖
const isTierUnlocked = (tier) => orderedQty.value >= tier.qty

// 把數字格式化成「千分位」顯示，例如 1234 會變成 1,234，方便閱讀價格
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 按下「加入此團購」時執行的動作：改成呼叫後端加入購物車 API
const handleJoin = async () => {
  await cartStore.addItem({ id: product.value.id })
  router.push('/GroupShop/checkout') // 加入後直接到購物車頁面
}
</script>
