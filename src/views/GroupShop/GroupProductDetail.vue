<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
import { useAuthStore } from '@/stores/auth'
// 團購商品 API
import { getGroupProduct } from '@/api/groupShop'
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


const route = useRoute()
const router = useRouter()
const cartStore = useGroupCartStore()
const authStore = useAuthStore()

// 一般管理員（Admin）前台只能看不能操作，SuperAdmin 不受限
const isReadOnly = computed(() => authStore.role === 'Admin')

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
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  // 管理員（Admin）沒有購物車權限，fetchCart 會回 403，
  // 用 try/catch 包起來，避免購物車失敗連帶讓商品詳情也讀不到
  try {
    await cartStore.fetchCart()
  } catch (e) {
    // 忽略，購物車數量顯示 0 即可
  }
  const id = Number(route.params.id)
  try {
    product.value = await getGroupProduct(id)
  } catch (err) {
    // 商品不存在，或已經被後台下架（下架商品買家端一律當 404 處理）
    notFound.value = true
  } finally {
    loading.value = false
  }
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
  // 還沒登入的話，提示先註冊/登入，並導去登入頁（帶上 redirect，登入完成後會自動導回這頁）
  if (!authStore.isLoggedIn) {
    alert('請先註冊/登入會員')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  try {
    await cartStore.addItem({ id: product.value.id })
    router.push('/GroupShop/checkout') // 加入後直接到購物車頁面
  } catch (err) {
    // 例如商品剛好在使用者停留在這頁的時候被後台下架了，加入購物車那一刻後端會擋下來
    alert(err.response?.data || '加入購物車失敗，請稍後再試')
  }
}
</script>

<template>
  <div class="clo-shell">
    <!-- 購物車圖示改為右下角浮動按鈕，見頁面最下方 -->
    <div class="clo-body">
      <!-- ============ 主要內容區：商品詳情 ============ -->
      <main class="clo-main clo-main-full">
    <router-link to="/GroupShop" class="back-link mb-3">
      ← 返回商品列表
    </router-link>

    <!-- 商品不存在，或已經被後台下架：顯示提示，不要顯示空殼商品資料 -->
    <div v-if="notFound" class="text-center py-5">
      <p class="text-muted mb-3">找不到這個商品，可能已經下架或不存在</p>
      <router-link to="/GroupShop" class="btn btn-main">返回商品列表</router-link>
    </div>
    <div v-else-if="loading" class="text-center py-5 text-muted">
      載入中...
    </div>
    <div v-else class="row g-4">
      <!-- 左側：主商品 -->
      <div class="col-lg-8">
        <div class="hero-card">
          <img :src="resolveImageUrl(product.imageUrl)" class="hero-img" :alt="product.name" />
          <div class="hero-info">
            <h4 class="fw-bold mb-2">{{ product.name }}</h4>
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>已訂購 {{ orderedQty }} 件</span>
              <span>
                <span class="fw-bold text-accent">$ {{ formatCurrency(currentUnitPrice) }}</span>
                <!-- 已經解鎖團購價的時候，才會顯示「已解鎖」-->
                <span v-if="currentTier" class="unlocked-tag">已解鎖</span>
              </span>
            </div>
            <!-- 還有下一階層可以解鎖時，顯示「還差幾件」的提示 -->
            <div v-if="nextTier" class="d-flex justify-content-between small text-muted">
              <span>滿 {{ nextTier.qty }} 件可享團購價</span>
              <span>還差 {{ nextTier.qty - orderedQty }} 件，下階至 $ {{ formatCurrency(tierPriceOf(nextTier)) }}</span>
            </div>
            <!-- 已經到最高階層（沒有 nextTier）時，顯示已達最低團購價；完全沒有階層資料時顯示提示 -->
            <div v-else-if="finalTier" class="d-flex justify-content-between small text-muted">
              <span>已滿 {{ finalTier.qty }} 件，享最低團購價</span>
            </div>
            <div v-else class="d-flex justify-content-between small text-muted">
              <span>尚未設定團購階層</span>
            </div>
          </div>
        </div>

        <div class="panel-card mt-4">
          <h6 class="fw-bold mb-3">團購目標與階層價格</h6>
          <!-- 進度條：用 style 動態綁定寬度，寬度百分比來自 progressPercent -->
          <div class="progress-track mb-1">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-3">
            <span v-if="finalTier">目前 {{ orderedQty }} 件 / 滿 {{ finalTier.qty }} 件成團</span>
            <span v-else>目前 {{ orderedQty }} 件（尚未設定團購階層）</span>
            <span class="fw-bold text-main">原價 ${{ formatCurrency(product.listPrice) }}</span>
          </div>

          <!-- 把每個團購階層都列出來，並依是否解鎖顯示不同圖示與樣式 -->
          <ul class="tier-list mb-0">
            <li v-for="t in product.tiers" :key="t.qty" :class="{ locked: !isTierUnlocked(t) }">
              <span class="tier-icon">
                <!-- 已解鎖顯示打勾圖示，未解鎖顯示鎖頭圖示 -->
                <svg v-if="isTierUnlocked(t)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              滿 {{ t.qty }} 件：團購價 ${{ formatCurrency(tierPriceOf(t)) }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 右側：專案詳情 -->
      <div class="col-lg-4">
        <div class="side-card dark-card p-3">
          <!-- 圓圈進度條：顯示目前募資進度百分比 -->
          <div class="ring-wrap">
            <svg viewBox="0 0 120 120" class="progress-ring" width="120" height="120">
              <circle class="ring-track" cx="60" cy="60" r="46" fill="none" stroke-width="10" />
              <circle
                class="ring-fill"
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke-width="10"
                :stroke-dasharray="ringCircumference"
                :stroke-dashoffset="ringDashOffset"
              />
            </svg>
            <span class="ring-label">{{ progressPercent }}%</span>
          </div>

          <h6 class="fw-bold mb-2">團購專案詳情 (募資中)</h6>
          <p class="small mb-2 label-title">商品介紹</p>
          <p class="small mb-3 desc-text">{{ product.intro }}</p>

          <!-- @click 綁定按鈕點擊事件，按下去就會執行上面 script 裡定義的 handleJoin -->
          <button
            class="btn btn-main w-100 mt-3"
            :disabled="isReadOnly"
            :title="isReadOnly ? '管理員帳號僅供瀏覽，無法加入團購' : ''"
            @click="handleJoin"
          >加入此團購</button>
        </div>
      </div>
    </div>
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
  --color-bg-page: #f8f5f0;
  --color-border: #e6dccf;
  --color-hover-bg: #f1e7de;
  --color-active-bg: #ebdcd0;
  --color-dark: #6b564c;
  --color-dark-hover: #5c483f;
  --color-desc-text: #cbb9ac;

  --shadow-card: 0 1px 4px rgba(74, 62, 61, 0.08);
  --shadow-float: 0 4px 12px rgba(74, 62, 61, 0.3);
  --radius-card: 12px;
  --radius-full: 999px;

  min-height: 100vh;
  background-color: var(--color-bg-page);
  color: var(--color-text);
}

.text-main { color: var(--color-text); }
.text-accent { color: var(--color-accent); }

/* hero-card / panel-card / side-card 都是白底、大圓角、同一種陰影，合併共用部分 */
.hero-card,
.panel-card,
.side-card {
  background-color: #fff;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
.hero-card,
.side-card {
  overflow: hidden;
}
.panel-card {
  padding: 20px;
}

.hero-img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
}
.hero-info {
  padding: 16px 20px;
}
.unlocked-tag {
  font-size: 0.7rem;
  color: var(--color-success);
  margin-left: 4px;
}

.progress-track {
  height: 10px;
  background-color: var(--color-active-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
}

.tier-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tier-list li {
  padding: 6px 0;
  font-size: 0.88rem;
  color: var(--color-text);
  border-bottom: 1px dashed var(--color-border);
}
.tier-list li:last-child { border-bottom: none; }
.tier-list li.locked {
  color: var(--color-muted);
}
.tier-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
}

.dark-card {
  background-color: var(--color-hover-bg);
  color: var(--color-text);
}
.label-title {
  font-weight: 700;
  color: var(--color-text);
}
.desc-text {
  color: var(--color-text-muted);
}

.ring-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 4px auto 16px;
}
.progress-ring {
  transform: rotate(-90deg);
}
.ring-track {
  stroke: rgba(0, 0, 0, 0.12);
}
.ring-fill {
  stroke: var(--color-success);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease;
}
.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
}

.back-link {
  display: inline-block;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  text-decoration: none;
}
.back-link:hover {
  color: var(--color-text);
  text-decoration: underline;
}

.btn-main {
  background-color: var(--color-text);
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
}
.btn-main:hover {
  background-color: var(--color-dark-hover);
  color: #fff;
}
.btn-main:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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

/* 拿掉左側導覽列後，內容區改成置中、限制最大寬度，版面才不會在寬螢幕上被拉得過開 */
.clo-main-full {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

/* ============ 響應式：手機螢幕縮小內距與主圖高度 ============ */
@media (max-width: 600px) {
  .clo-main {
    padding: 16px 12px;
  }

  .hero-img {
    height: 200px;
  }

  .hero-info {
    padding: 14px 16px;
  }
}
</style>