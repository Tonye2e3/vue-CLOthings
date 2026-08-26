<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { RouterLink } from 'vue-router'

const route = useRoute()
const router = useRouter()
const products = ref([])
const keyword = ref('')

const API_BASE = 'https://localhost:7255'
function getImageUrl(fileName) {
  if (!fileName) return 'https://placehold.co/300x400?text=No+Image'
  return `${API_BASE}/images/product/${fileName}`
}

async function search(kw) {
  keyword.value = kw
  if (!kw) {
    products.value = []
    return
  }
  try {
    const response = await api.get('/product/search', { params: { keyword: kw } })
    products.value = response.data
  } catch (error) {
    console.error('搜尋失敗：', error)
  }
}

// 進頁面先搜一次
onMounted(() => search(route.query.keyword))

// 關鍵字變了（在搜尋頁又搜新的）重搜
watch(() => route.query.keyword, (kw) => search(kw))
</script>

<template>
  <section class="promo">
    <h2 class="section-title">「{{ keyword }}」的搜尋結果，共 {{ products.length }} 件</h2>

    <div v-if="products.length === 0" class="empty">
      找不到符合「{{ keyword }}」的商品
    </div>

    <div v-else class="grid">
      <RouterLink
        v-for="p in products"
        :key="p.productId"
        :to="{ name: 'product', params: { id: p.productId } }"
        class="card"
      >
        <div class="card-image">
          <span class="card-tag">{{ p.status }}</span>
          <img :src="getImageUrl(p.productImgFile)" :alt="p.productName" class="product-img" />
        </div>
        <div class="card-body">
          <h3 class="card-name">{{ p.productName }}</h3>
          <p class="card-desc">{{ p.description }}</p>
          <p class="card-price">TWD {{ p.price.toLocaleString() }}</p>
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
.empty {
  text-align: center;
  padding: 60px;
  color: #888;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
.card {
  border: 1px solid var(--home-border);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  text-decoration: none;
  color: inherit;
  display: block;
}
.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}
.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
}
.card-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: red;
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
.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>