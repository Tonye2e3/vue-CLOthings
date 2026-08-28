<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()

const products = ref([])
const categories = ref([])

const selectedCategoryId = computed(() => {
  const id = route.query.categoryId // 網址參數改用 categoryId
  return id ? Number(id) : null // 網址參數是文字，轉成數字才能跟 id 比對
})

const filteredProducts = computed(() => {
  if (!selectedCategoryId.value) {
    return products.value // 沒選分類 → 全部商品
  }

  return products.value.filter((p) => p.productCategoryId === selectedCategoryId.value)
})

const title = computed(() => {
  if (!selectedCategoryId.value) return '全部商品'
  // 找出目前分類的名稱來顯示
  const cat = categories.value.find((c) => c.productCategoryId === selectedCategoryId.value)
  return cat ? `${cat.categoryName} 商品` : '全部商品'
})

function getImageUrl(fileName) {
  if (!fileName) {
    return 'https://placehold.co/300x400?text=No+Image'
  }

  const baseUrl = import.meta.env.VITE_API_URL

  return `${baseUrl}/images/product/${fileName}`
}

// 頁面一仔入，就打API拿商品
onMounted(async () => {
  try {
    // 同時打「商品」和「分類」兩個 API
    const productRes = await api.get('/product')
    products.value = productRes.data

    const categoryRes = await api.get('/productCategory')
    categories.value = categoryRes.data
  } catch (error) {
    console.error('載入資料失敗：', error)
  }
})
</script>

<template>
  <section class="promo">
    <h2 class="section-title">{{ title }}</h2>
    <div class="category-filter">
      <RouterLink :to="{ query: {} }" class="cat-btn" :class="{ active: !selectedCategoryId }">
        全部
      </RouterLink>
      <RouterLink v-for="cat in categories" :key="cat.productCategoryId"
        :to="{ query: { categoryId: cat.productCategoryId } }" class="cat-btn"
        :class="{ active: selectedCategoryId === cat.productCategoryId }">
        {{ cat.categoryName }}
      </RouterLink>
    </div>
    <div class="grid">
      <RouterLink v-for="p in filteredProducts" :key="p.productId"
        :to="{ name: 'product', params: { id: p.productId } }" class="card">
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
.card {
  border: 1px solid var(--home-border);
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
  text-decoration: none;
  /* 拿掉連結底線 */
  color: inherit;
  /* 文字用原本顏色，不要變成連結藍色 */
  display: block;
  /* 讓它像區塊一樣（RouterLink 預設是行內） */
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

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}

.cat-btn {
  padding: 8px 16px;
  border: 1px solid var(--home-border);
  border-radius: 4px;
  text-decoration: none;
  color: var(--home-text);
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.cat-btn:hover,
.cat-btn.active {
  background: var(--home-text);
  color: #fff;
  border-color: var(--home-text);
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.placeholder-label {
  color: #999;
  font-size: 0.85rem;
}

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

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
