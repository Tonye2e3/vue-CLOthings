<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 團購購物車 store：跟商品詳情頁共用同一份購物車資料
import { useGroupCartStore } from '@/stores/groupCart'
// 團購商品 API：改成向後端拿真正的資料，不再用寫死的假資料
import { getGroupProducts } from '@/api/groupShop'

const route = useRoute()
const cartStore = useGroupCartStore()

const searchKeyword = ref('')

// 左側選單項目
const navItems = [
  { label: '專案瀏覽', icon: 'user', to: '/GroupShop' },
  { label: '團購紀錄', icon: 'history', to: '/GroupShop/orders' }
]
// 判斷選單項目是否為目前所在頁面（用來加上醒目樣式）
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
// 購物車商品數量：直接從 store 拿，跨頁面即時反映實際品項數
const cartCount = computed(() => cartStore.items.length)

// 商品目錄：改成向 GroupProductController 拿，欄位跟原本的假資料結構相容
// （id / name / imageUrl / listPrice / tiers[{qty,discount,unitPrice}] / orderedQty / intro）
const products = ref([])

onMounted(async () => {
  await cartStore.fetchCart()
  products.value = await getGroupProducts()
})

// 讀取購物車裡此商品目前的數量：直接從 store 裡的 items 陣列找
const cartQtyOf = (id) => {
  const item = cartStore.items.find(i => i.id === id)
  return item ? item.qty : 0
}

// 目前已訂購件數 = 後端算好的「已成立訂單」件數（orderedQty）+ 購物車裡實際加入的數量
const orderedQtyOf = (p) => p.orderedQty + cartQtyOf(p.id)

// 目前已解鎖的階層（尚未達第一階層則回傳 null）
const currentTierOf = (p) => {
  let tier = null
  for (const t of p.tiers) {
    if (orderedQtyOf(p) >= t.qty) tier = t
  }
  return tier
}

// 該階層的團購價：後端已經算好放在 tier.unitPrice，不用前端再乘一次折扣
const tierPriceOf = (p, tier) => tier.unitPrice

// 目前可享團購價（尚未解鎖任何階層則顯示原價）
const currentPriceOf = (p) => {
  const tier = currentTierOf(p)
  return tier ? tierPriceOf(p, tier) : p.listPrice
}

// 第二階層（陣列最後一個，也就是件數門檻最高、價格最低的那個階層）
const finalTierOf = (p) => p.tiers[p.tiers.length - 1]

// 判斷這個商品是否已經達到最終階層（也就是「已成團」）
const isCompleted = (p) => p.tiers.length > 0 && orderedQtyOf(p) >= finalTierOf(p).qty

// 團購進度百分比：目前件數 / 最終階層件數，最多顯示到 100%
const progressPercentOf = (p) => {
  if (p.tiers.length === 0) return 0
  return Math.min(100, Math.round((orderedQtyOf(p) / finalTierOf(p).qty) * 100))
}

// 依搜尋關鍵字篩選商品：如果搜尋框是空的，全部商品都算符合（!searchKeyword.value 為 true）；
// 有輸入文字的話，就比對商品名稱裡有沒有包含這段文字（跟課堂 ShopView.vue 的寫法一致）
const filteredProducts = computed(() =>
  products.value.filter(p =>
    !searchKeyword.value || p.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
)

// 已成團的商品清單：先套用搜尋篩選，再從篩選結果裡挑出已成團的
const completedProducts = computed(() => filteredProducts.value.filter(p => isCompleted(p)))
// 尚未成團、還在進行中的商品清單：邏輯相同，只是條件相反
const ongoingProducts = computed(() => filteredProducts.value.filter(p => !isCompleted(p)))

// 把數字格式化成千分位顯示（例如 1234 -> 1,234）
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// ============ 首頁輪播區塊 ============
// 輪播圖資料：之後要接後端管理的活動 Banner，可以整段改成 API 呼叫
const banners = ref([
  {
    image: 'https://picsum.photos/seed/clo-banner1/1400/500',
    badge: '限時優惠至 8/6',
    title: '輕便抗UV連帽外套',
    subtitle: '一件抵擋整個夏天的紫外線',
    price: 1290
  },
  {
    image: 'https://picsum.photos/seed/clo-banner2/1400/500',
    badge: '團購進行中',
    title: '團購托特包 熱銷中',
    subtitle: '滿25件即可享最低團購價',
    price: 711
  },
  {
    image: 'https://picsum.photos/seed/clo-banner3/1400/500',
    badge: '新品上市',
    title: '團購針織外套',
    subtitle: '滿15件享最低團購價',
    price: 700
  }
])
const currentSlide = ref(0)
const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + banners.value.length) % banners.value.length
}
const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % banners.value.length
}
</script>
