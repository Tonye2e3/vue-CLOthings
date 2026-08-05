<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const navItems = [
  { label: '專案瀏覽', icon: '👤', to: '/GroupShop' },
  { label: '團購紀錄', icon: '↺', to: '/GroupShop/orders' },
  { label: '會員專區', icon: '🎖' },
  { label: '設定', icon: '⚙' },
  { label: '登出', icon: '⏻' }
]
const isActive = (to) => !!to && (to === '/GroupShop' ? route.path === to : route.path.startsWith(to))

// 會員名稱：優先帶入登入後存下的會員資料，尚未登入則顯示預設值
const memberName = ref(localStorage.getItem('memberName') || '會員')
// 購物車商品數量：目前為假資料，之後請改接實際購物車狀態（如 Pinia store）
const cartCount = ref(3)

// 主商品假資料：原價 + 兩階層團購價（滿N人即可享該階層價格）
const product = ref({
  id: 1,
  name: '團購短T',
  imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop',
  listPrice: 340,
  currentCount: 8,
  tiers: [
    { qty: 5, price: 306 },
    { qty: 10, price: 221 }
  ]
})

// 側邊搭配商品假資料
const relatedProduct = ref({
  name: '團購牛仔褲',
  imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&auto=format&fit=crop',
  description: '合身直筒版型，耐磨丹寧布料，百搭日常單品。',
  listPrice: 430,
  groupPrice: 387
})

// 商品介紹假資料
const campaign = ref({
  description: '團購短T選用親膚純棉布料，透氣不悶熱，簡約百搭款式適合日常穿搭。訂購人數越多，單價越低，滿額即可解鎖團購價。'
})

// 目前已解鎖的階層（尚未達第一階層則回傳 null）
const currentTier = computed(() => {
  let tier = null
  for (const t of product.value.tiers) {
    if (product.value.currentCount >= t.qty) tier = t
  }
  return tier
})

const currentUnitPrice = computed(() => currentTier.value ? currentTier.value.price : product.value.listPrice)

// 最終階層（滿最多人數的那個階層）
const finalTier = computed(() => product.value.tiers[product.value.tiers.length - 1])

// 尚未解鎖的下一階層
const nextTier = computed(() =>
  product.value.tiers.find(t => t.qty > product.value.currentCount)
)

const progressPercent = computed(() =>
  Math.min(100, Math.round((product.value.currentCount / finalTier.value.qty) * 100))
)

const isTierUnlocked = (tier) => product.value.currentCount >= tier.qty

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

const handleJoin = () => {
  router.push({
    path: '/GroupShop/checkout',
    query: {
      productName: product.value.name,
      qty: 1,
      unitPrice: currentUnitPrice.value
    }
  })
}
</script>

<template>
  <div class="clo-shell">
    <header class="clo-header">
      <router-link to="/GroupShop" class="clo-brand">
        <span class="brand-main">CLO</span>
        <span class="brand-sub">CLO.things</span>
      </router-link>

      <div class="clo-search">
        <input v-model="searchKeyword" type="text" placeholder="搜尋項目" />
        <button class="search-btn" type="button" aria-label="搜尋">🔍</button>
      </div>

      <div class="clo-user">
        <span class="user-greet">你好，{{ memberName }}</span>
        <router-link to="/GroupShop/checkout" class="cart-link">
          <span class="cart-icon">🛒</span>
          <span class="cart-badge">{{ cartCount }}</span>
        </router-link>
      </div>
    </header>

    <div class="clo-body">
      <aside class="clo-sidebar">
        <nav class="sidebar-nav">
          <template v-for="item in navItems" :key="item.label">
            <router-link
              v-if="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ active: isActive(item.to) }"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </router-link>
            <div v-else class="nav-item">
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </div>
          </template>
        </nav>

      </aside>

      <main class="clo-main">
    <div class="row g-4">
      <!-- 左側：主商品 -->
      <div class="col-lg-8">
        <div class="hero-card">
          <img :src="product.imageUrl" class="hero-img" :alt="product.name" />
          <div class="hero-info">
            <h4 class="fw-bold mb-2">{{ product.name }}</h4>
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>已有 {{ product.currentCount }} 人參加</span>
              <span>
                <span class="fw-bold text-accent">$ {{ formatCurrency(currentUnitPrice) }}</span>
                <span v-if="currentTier" class="unlocked-tag">已解鎖</span>
              </span>
            </div>
            <div v-if="nextTier" class="d-flex justify-content-between small text-muted">
              <span>滿 {{ nextTier.qty }} 人可享團購價</span>
              <span>還差 {{ nextTier.qty - product.currentCount }} 人，下階至 $ {{ formatCurrency(nextTier.price) }}</span>
            </div>
            <div v-else class="d-flex justify-content-between small text-muted">
              <span>已滿 {{ finalTier.qty }} 人，享最低團購價</span>
            </div>
          </div>
        </div>

        <div class="panel-card mt-4">
          <h6 class="fw-bold mb-3">團購目標與階層價格</h6>
          <div class="progress-track mb-1">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-3">
            <span>目前 {{ product.currentCount }} 人 / 滿 {{ finalTier.qty }} 人成團</span>
            <span class="fw-bold text-main">原價 ${{ formatCurrency(product.listPrice) }}</span>
          </div>

          <ul class="tier-list mb-0">
            <li v-for="t in product.tiers" :key="t.qty" :class="{ locked: !isTierUnlocked(t) }">
              <span class="tier-icon">{{ isTierUnlocked(t) ? '✔' : '🔒' }}</span>
              滿 {{ t.qty }} 人：團購價 ${{ formatCurrency(t.price) }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 右側：搭配商品 + 專案詳情 -->
      <div class="col-lg-4">
        <div class="side-card mb-3">
          <img :src="relatedProduct.imageUrl" class="side-img" :alt="relatedProduct.name" />
          <div class="p-3">
            <h6 class="fw-bold mb-1">{{ relatedProduct.name }}</h6>
            <p class="small text-muted mb-2">{{ relatedProduct.description }}</p>
            <div class="d-flex align-items-baseline gap-2 mb-3">
              <span class="fw-bold fs-5 text-accent">團購價 ${{ formatCurrency(relatedProduct.groupPrice) }}</span>
              <span class="text-muted text-decoration-line-through small">${{ formatCurrency(relatedProduct.listPrice) }}</span>
            </div>
            <button class="btn btn-main w-100">加入此團購</button>
          </div>
        </div>

        <div class="side-card dark-card p-3">
          <h6 class="fw-bold mb-2">團購專案詳情 (募資中)</h6>
          <p class="small mb-2 label-title">商品介紹</p>
          <p class="small mb-3 desc-text">{{ campaign.description }}</p>

          <p class="small mb-2 label-title">團購人數</p>
          <div class="fund-track">
            <div
              v-for="t in product.tiers"
              :key="t.qty"
              class="fund-dot"
              :class="{ filled: isTierUnlocked(t) }"
            ></div>
          </div>
          <div class="d-flex justify-content-between small desc-text mt-1">
            <span v-for="t in product.tiers" :key="t.qty">滿{{ t.qty }}人</span>
          </div>
          <p class="small desc-text mt-2 mb-0">目前已有 {{ product.currentCount }} 人參加</p>

          <button class="btn btn-main w-100 mt-3" @click="handleJoin">加入此團購</button>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.text-main { color: #4a3e3d; }
.text-accent { color: #b87352; }

.hero-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
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
  color: #4a7c59;
  margin-left: 4px;
}

.panel-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}

.progress-track {
  height: 10px;
  background-color: #ebdcd0;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background-color: #b87352;
}

.tier-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tier-list li {
  padding: 6px 0;
  font-size: 0.88rem;
  color: #4a3e3d;
  border-bottom: 1px dashed #e6dccf;
}
.tier-list li:last-child { border-bottom: none; }
.tier-list li.locked {
  color: #a9998e;
}
.tier-icon {
  display: inline-block;
  width: 18px;
}

.side-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(74, 62, 61, 0.08);
}
.side-img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}

.dark-card {
  background-color: #3d3332;
  color: #f1e7de;
}
.label-title {
  font-weight: 700;
  color: #fff;
}
.desc-text {
  color: #cbb9ac;
}

.fund-track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
.fund-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background-color: #6e5f5c;
  z-index: 1;
}
.fund-dot.filled {
  background-color: #b87352;
}
.fund-track::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 5px;
  right: 5px;
  height: 2px;
  background-color: #6e5f5c;
  transform: translateY(-50%);
  z-index: 0;
}

.btn-main {
  background-color: #4a3e3d;
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
}
.btn-main:hover {
  background-color: #362d2c;
  color: #fff;
}

.clo-shell {
  min-height: 100vh;
  background-color: #f8f5f0;
  color: #4a3e3d;
}

.clo-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 28px;
  background-color: #fff;
  border-bottom: 1px solid #e6dccf;
}

.clo-brand {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-decoration: none;
  color: #4a3e3d;
  flex-shrink: 0;
}
.brand-main {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 2px;
}
.brand-sub {
  font-size: 0.65rem;
  letter-spacing: 1px;
  color: #b87352;
}

.clo-search {
  flex: 1;
  max-width: 480px;
  display: flex;
  align-items: center;
  background-color: #f1e7de;
  border-radius: 999px;
  padding: 6px 8px 6px 18px;
}
.clo-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: #4a3e3d;
}
.clo-search input::placeholder {
  color: #a9998e;
}
.search-btn {
  border: none;
  background-color: #4a3e3d;
  color: #fff;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
}

.clo-user {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-left: auto;
  flex-shrink: 0;
}
.user-greet {
  font-size: 0.9rem;
  white-space: nowrap;
}
.cart-link {
  position: relative;
  display: inline-flex;
  color: #4a3e3d;
  text-decoration: none;
  font-size: 1.3rem;
}
.cart-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background-color: #b87352;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.clo-body {
  display: flex;
  align-items: flex-start;
}

.clo-sidebar {
  width: 220px;
  flex-shrink: 0;
  min-height: calc(100vh - 65px);
  background-color: #f8f5f0;
  border-right: 1px solid #e6dccf;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: #6e5f5c;
  text-decoration: none;
  font-size: 0.92rem;
  border-left: 3px solid transparent;
  cursor: pointer;
}
.nav-item:hover {
  background-color: #f1e7de;
}
.nav-item.active {
  color: #4a3e3d;
  font-weight: 700;
  background-color: #ebdcd0;
  border-left-color: #b87352;
}
.nav-icon {
  width: 18px;
  text-align: center;
}


.clo-main {
  flex: 1;
  padding: 28px 32px;
  min-width: 0;
}

@media (max-width: 900px) {
  .clo-search { display: none; }
  .clo-sidebar { width: 72px; }
  .nav-item span:last-child { display: none; }
}
</style>