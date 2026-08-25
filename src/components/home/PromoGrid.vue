<script setup>
import { ref, onMounted } from 'vue'
// 團購商品 API：改成向後端拿真正的資料，不再用寫死的假資料
import { getGroupProducts } from '@/api/groupShop'

// 圖片網址工具：後端上傳圖片回傳的是相對路徑（例如 /images/group-products/xxx.jpg），
// 這裡統一組成完整網址；圖片是靜態檔案，不能直接用 baseURL（那個多了 /api）
const API_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
const resolveImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path}`
}

// 篩選後只會剩下還在進行中的商品，標籤固定顯示「團購進行中」
const tagOf = () => '團購進行中'

// 最終階層（陣列最後一個，件數門檻最高，也就是成團目標）
const finalTierOf = (p) => p.tiers[p.tiers.length - 1]

// 是否「未達成目標」：有設定階層，且已訂購件數還沒到最終階層的門檻
// （跟後端 GetOrderedQtyMapAsync／isCompleted 的邏輯對齊：沒有階層資料的商品不列入，因為沒有目標可比）
const isNotCompleted = (p) => p.tiers.length > 0 && p.orderedQty < finalTierOf(p).qty

// 達成進度百分比，用來排序：越接近成團的排越前面
const progressPercentOf = (p) => {
  const tier = finalTierOf(p)
  return tier.qty > 0 ? p.orderedQty / tier.qty : 0
}

const displayProducts = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const products = await getGroupProducts()
    // 只顯示未達成目標的商品，越接近成團的排越前面，最多顯示 5 筆
    displayProducts.value = products
      .filter(isNotCompleted)
      .sort((a, b) => progressPercentOf(b) - progressPercentOf(a))
      .slice(0, 5)
  } catch (e) {
    displayProducts.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="promo">
    <h2 class="section-title">限時團購專區</h2>

    <p v-if="isLoading" class="state-label">載入中...</p>
    <p v-else-if="displayProducts.length === 0" class="state-label">目前尚無團購商品</p>

    <div v-else class="grid">
      <RouterLink
        v-for="p in displayProducts"
        :key="p.id"
        :to="`/GroupShop/product/${p.id}`"
        class="card"
      >
        <div class="card-image">
          <span class="card-tag">{{ tagOf(p) }}</span>
          <img
            v-if="p.imageUrl"
            :src="resolveImageUrl(p.imageUrl)"
            :alt="p.name"
            class="card-img"
          />
          <span v-else class="placeholder-label">商品圖片</span>
        </div>
        <div class="card-body">
          <h3 class="card-name">{{ p.name }}</h3>
          <p class="card-desc">{{ p.intro }}</p>
          <p class="card-price">NT${{ p.listPrice.toLocaleString() }}</p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.promo {
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 24px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 32px;
  color: var(--home-text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.state-label {
  color: #999;
  font-size: 0.9rem;
}

.card {
  display: block;
  border: 1px solid var(--home-border);
  color: inherit;
  text-decoration: none;
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}
.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}

.card-image {
  position: relative;
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, #f2f2f2, #e5e5e5);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-label {
  color: #999;
  font-size: 0.85rem;
}

.card-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--home-accent);
  color: #fff;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 2px;
}

.card-body {
  padding: 16px;
}

.card-name {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--home-text);
}

.card-desc {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 8px;
}

.card-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--home-text);
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>