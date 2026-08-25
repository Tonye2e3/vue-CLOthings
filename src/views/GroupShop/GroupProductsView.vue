<script setup>

import { ref, computed, onMounted } from 'vue'

// 團購購物車 store：跟商品詳情頁共用同一份購物車資料
import { useGroupCartStore } from '@/stores/groupCart'
import { useAuthStore } from '@/stores/auth'
// 團購商品 API：改成向後端拿真正的資料，不再用寫死的假資料
import { getGroupProducts } from '@/api/groupShop'
// 圖片網址工具：後端上傳圖片回傳的是相對路徑（例如 /images/group-products/xxx.jpg），
// 舊示範資料則是完整網址（例如 https://picsum.photos/...），這裡統一組成完整網址
// 圖片是靜態檔案，走的不是 /api 這條路徑，不能直接用 baseURL（那個多了 /api），
// 這裡把 VITE_API_URL 尾巴的 /api 拿掉，變成純網域，圖片網址才會跟著 .env 換環境，不會在正式環境還打 localhost
const API_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
const resolveImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path}`
}


const cartStore = useGroupCartStore()
const authStore = useAuthStore()

const searchKeyword = ref('')

// 一般管理員（Admin）前台只能看不能操作，SuperAdmin 不受限
const isReadOnly = computed(() => authStore.role === 'Admin')
// 購物車商品數量：直接從 store 拿，跨頁面即時反映實際品項數
const cartCount = computed(() => cartStore.items.length)

// 商品目錄：改成向 GroupProductController 拿，欄位跟原本的假資料結構相容
// （id / name / imageUrl / listPrice / tiers[{qty,discount,unitPrice}] / orderedQty / intro）
const products = ref([])
// 商品是否還在讀取中，讀取期間顯示骨架屏（go-skeleton），跟 GroupOrdersView.vue 用同一套慣例
const isLoading = ref(true)

onMounted(async () => {
  // 管理員（Admin）沒有購物車權限，fetchCart 會回 403，
  // 用 try/catch 包起來，避免購物車失敗連帶讓商品列表也讀不到
  try {
    await cartStore.fetchCart()
  } catch (e) {
    // 忽略，購物車數量顯示 0 即可
  }
  try {
    products.value = await getGroupProducts()
  } finally {
    isLoading.value = false
  }
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
    image: resolveImageUrl('/images/product/兒童連帽外套.jpeg'),
    badge: '限時優惠至 8/6',
    title: '輕便抗UV連帽外套',
    subtitle: '一件抵擋整個夏天的紫外線',
    price: 1290
  },
  {
    image: resolveImageUrl('/images/product/帆布托特包.jpeg'),
    badge: '團購進行中',
    title: '團購托特包 熱銷中',
    subtitle: '滿25件即可享最低團購價',
    price: 711
  },
  {
    image: resolveImageUrl('/images/product/羊毛混紡針織外套.jpeg'),
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

<template>
  <div class="clo-shell">
    <!-- 搜尋欄在輪播圖下方；購物車圖示改為右下角浮動按鈕，見頁面最下方 -->
    <div class="clo-body">
      <!-- ============ 主要內容區：商品列表 ============ -->
      <main class="clo-main clo-main-full">
    <!-- ============ 首頁輪播圖 ============ -->
    <section class="carousel">
      <button class="carousel-arrow carousel-arrow-left" type="button" @click="prevSlide" aria-label="上一張">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="carousel-track">
        <div
          v-for="(banner, idx) in banners"
          v-show="idx === currentSlide"
          :key="idx"
          class="carousel-slide"
        >
          <img :src="banner.image" class="carousel-img" :alt="banner.title" />
          <div class="carousel-overlay"></div>
          <div class="carousel-content">
            <span class="carousel-badge">{{ banner.badge }}</span>
            <h3 class="carousel-title">{{ banner.title }}</h3>
            <p class="carousel-subtitle">{{ banner.subtitle }}</p>
            <p class="carousel-price">NT$&nbsp;{{ formatCurrency(banner.price) }}</p>
          </div>
        </div>
      </div>

      <button class="carousel-arrow carousel-arrow-right" type="button" @click="nextSlide" aria-label="下一張">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div class="carousel-dots">
        <span
          v-for="(banner, idx) in banners"
          :key="`dot-${idx}`"
          class="carousel-dot"
          :class="{ active: idx === currentSlide }"
          @click="currentSlide = idx"
        ></span>
      </div>
    </section>

    <!-- ============ 關鍵字搜尋（放在輪播圖下方） ============ -->
    <div class="clo-search-below mb-4">
      <input v-model="searchKeyword" type="text" placeholder="搜尋項目" />
      <button class="search-btn" type="button" aria-label="搜尋">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </div>

    <!-- 載入中：顯示骨架屏卡片 -->
    <div v-if="isLoading" class="product-grid mb-4">
      <div v-for="n in 4" :key="n" class="go-skeleton skeleton-card"></div>
    </div>

    <template v-else>
    <!-- 搜尋完全找不到符合的商品時顯示提示，避免使用者以為畫面壞掉 -->
    <div v-if="filteredProducts.length === 0" class="empty-hint">
      找不到符合「{{ searchKeyword }}」的商品
    </div>

    <!-- 未達團購數量（進行中）區塊 -->
    <section class="mb-4 go-fade-in-up">
      <div class="section-title bg-ongoing">
        <span class="section-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </span> 未達團購數量 (進行中)
      </div>
      <TransitionGroup tag="div" name="go-fade" class="product-grid">
        <div v-for="p in ongoingProducts" :key="p.id" class="product-card go-card-hover">
          <router-link :to="`/GroupShop/product/${p.id}`" class="card-img-wrap">
            <img :src="resolveImageUrl(p.imageUrl)" class="card-img" :alt="p.name" />
          </router-link>
          <div class="card-info">
            <h6 class="fw-bold mb-1">{{ p.name }}</h6>
            <div class="d-flex justify-content-between small text-muted">
              <span>已訂購 {{ orderedQtyOf(p) }} 件</span>
              <span v-if="p.tiers.length" class="text-accent fw-bold">滿{{ finalTierOf(p).qty }}件享最低團購價</span>
              <span v-else class="text-accent fw-bold">尚未設定團購階層</span>
            </div>
            <div class="card-progress-track">
              <div class="card-progress-fill bg-ongoing" :style="{ width: progressPercentOf(p) + '%' }"></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fw-bold">團購價 ${{ formatCurrency(currentPriceOf(p)) }}</span>
              <router-link
                v-if="!isReadOnly"
                :to="`/GroupShop/product/${p.id}`"
                class="btn btn-main btn-sm go-btn-tap"
              >
                加入此團購
              </router-link>
              <button v-else class="btn btn-main btn-sm" disabled title="管理員帳號僅供瀏覽，無法加入團購">
                加入此團購
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </section>

    <!-- 已達團購數量（完成）區塊 -->
    <section class="go-fade-in-up">
      <div class="section-title bg-done">
        <span class="section-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </span> 已達團購數量 (完成)
      </div>
      <TransitionGroup tag="div" name="go-fade" class="product-grid">
        <!-- v-for 把 completedProducts 陣列裡每一筆商品，重複產生一張卡片 -->
        <div v-for="p in completedProducts" :key="p.id" class="product-card go-card-hover">
          <router-link :to="`/GroupShop/product/${p.id}`" class="card-img-wrap">
            <img :src="resolveImageUrl(p.imageUrl)" class="card-img" :alt="p.name" />
          </router-link>
          <div class="card-info">
            <h6 class="fw-bold mb-1">{{ p.name }}</h6>
            <div class="d-flex justify-content-between small text-muted">
              <span>已訂購 {{ orderedQtyOf(p) }} 件</span>
              <span class="text-success fw-bold">滿{{ finalTierOf(p).qty }}件已成團</span>
            </div>
            <div class="card-progress-track">
              <div class="card-progress-fill bg-done" :style="{ width: progressPercentOf(p) + '%' }"></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fw-bold">團購價 ${{ formatCurrency(currentPriceOf(p)) }}</span>
              <span class="badge-status badge-done">已成團</span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </section>
    </template>
      </main>
    </div>

    <!-- ============ 浮動購物車按鈕（右下角，點擊直接跳到購物車畫面） ============ -->
    <router-link to="/GroupShop/checkout" class="floating-cart" aria-label="前往購物車">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
    </router-link>
  </div>
</template>

<style scoped>
/* 以下都是外觀樣式（顏色、間距、排版），跟商品邏輯無關，可以先不用管 */

.clo-shell {
  --color-text: #4a3e3d;
  --color-text-muted: #6e5f5c;
  --color-muted: #a9998e;
  --color-accent: #b87352;
  --color-success: #4a7c59;
  --color-success-bg: #e4efe8;
  --color-danger: #b8524f;
  --color-bg-page: #f8f5f0;
  --color-border: #e6dccf;
  --color-hover-bg: #f1e7de;
  --color-active-bg: #ebdcd0;
  --color-dark: #3d3332; /* 跟其他頁一致保留，這頁目前沒直接用到 */
  --color-dark-hover: #362d2c;

  /* 這份頁面 border-radius:999px 出現非常多次（進度條、徽章、搜尋框、輪播箭頭/圓點、浮動購物車），
     跟另外三份的變數命名保持一致 */
  --shadow-card: 0 1px 4px rgba(74, 62, 61, 0.08);
  --shadow-float: 0 4px 12px rgba(74, 62, 61, 0.3);
  --radius-md: 8px;
  --radius-card: 12px;
  --radius-full: 999px;

  min-height: 100vh;
  background-color: var(--color-bg-page);
  color: var(--color-text);
}

.page-header h2 { color: var(--color-text); }

.empty-hint {
  padding: 16px 18px;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: var(--radius-md);
  color: var(--color-muted);
  font-size: 0.9rem;
  box-shadow: var(--shadow-card);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}
.bg-done { background-color: var(--color-success); }
.bg-ongoing { background-color: var(--color-danger); }
.section-icon {
  display: inline-flex;
  align-items: center;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.product-card {
  background-color: #fff;
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

.card-img-wrap {
  position: relative;
  display: block;
}
.card-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.card-info {
  padding: 12px 14px 14px;
  color: var(--color-text);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-progress-track {
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-border);
  overflow: hidden;
  margin-top: 8px;
}
.card-progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.text-accent { color: var(--color-accent); }

.badge-status {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: var(--radius-full);
}
.badge-done {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.btn-main {
  background-color: var(--color-text);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.8rem;
}
.btn-main:hover {
  background-color: var(--color-dark-hover);
  color: #fff;
}
.btn-main:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* ============ 輪播下方的關鍵字搜尋 ============ */
.clo-search-below {
  max-width: 480px;
  display: flex;
  align-items: center;
  background-color: var(--color-hover-bg);
  border-radius: var(--radius-full);
  padding: 6px 8px 6px 18px;
}
.clo-search-below input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: var(--color-text);
}
.clo-search-below input::placeholder {
  color: var(--color-muted);
}
.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: var(--color-text);
  color: #fff;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  cursor: pointer;
  flex-shrink: 0;
}

/* ============ 首頁輪播圖 ============ */
.carousel {
  position: relative;
  height: 360px;
  border-radius: var(--radius-card);
  overflow: hidden;
  margin-bottom: 20px;
  background-color: #2b2624;
}
.carousel-track {
  width: 100%;
  height: 100%;
}
.carousel-slide {
  position: relative;
  width: 100%;
  height: 100%;
}
.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.carousel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0.35) 100%);
}
.carousel-content {
  position: absolute;
  left: 32px;
  bottom: 36px;
  max-width: 60%;
  color: #fff;
}
.carousel-badge {
  display: inline-block;
  background-color: var(--color-danger);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.carousel-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 8px;
}
.carousel-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0 0 12px;
}
.carousel-price {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  border: none;
  background-color: rgba(255, 255, 255, 0.85);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}
.carousel-arrow:hover {
  background-color: #fff;
}
.carousel-arrow-left { left: 16px; }
.carousel-arrow-right { right: 16px; }
.carousel-dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}
.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}
.carousel-dot.active {
  background-color: #fff;
}

/* ============ 右下角浮動購物車按鈕 ============ */
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

/* 拿掉左側導覽列後，內容區改成置中、限制最大寬度，版面才不會在寬螢幕上被拉得過開 */
.clo-main-full {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 900px) {
  .carousel { height: 260px; }
  .carousel-content { max-width: 80%; left: 20px; bottom: 24px; }
  .carousel-title { font-size: 1.25rem; }
}

/* ============ 本頁用到的特效樣式，跟 GroupOrdersView.vue 同一套命名慣例，class 一律以 go- 開頭 ============ */
/* 加了 scoped，這些 class 只作用在這個元件裡，不會跟其他檔案的同名 class 衝突 */
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

/* <TransitionGroup name="go-fade"> 用：卡片淡入 */
.go-fade-enter-active,
.go-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.go-fade-enter-from,
.go-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.go-card-hover {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.go-card-hover:hover {
  box-shadow: 0 8px 20px rgba(74, 62, 61, 0.14);
  transform: translateY(-3px);
}

.go-btn-tap {
  transition: transform 0.15s ease, filter 0.15s ease;
}
.go-btn-tap:hover {
  filter: brightness(1.06);
}
.go-btn-tap:active {
  transform: scale(0.94);
}

@keyframes goShimmer {
  0% { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.go-skeleton {
  background: linear-gradient(90deg, #ece3d8 25%, #f6f0e8 37%, #ece3d8 63%);
  background-size: 600px 100%;
  animation: goShimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius-card);
}
.skeleton-card {
  height: 260px;
}

@media (prefers-reduced-motion: reduce) {
  .go-fade-in-up,
  .go-card-hover,
  .go-btn-tap,
  .go-skeleton {
    animation-duration: 0.001s !important;
    transition-duration: 0.001s !important;
  }
}
</style>