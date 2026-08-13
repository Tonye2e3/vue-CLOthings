<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const API_BASE = 'https://localhost:7255'

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
  // 沒有圖檔名時，回傳佔位圖（防呆：有些商品可能還沒圖）
  if (!fileName) {
    return 'https://placehold.co/300x400?text=No+Image'
  }

  // 暫時加這段來偵查，測完刪
  console.log('我選的分類 id:', selectedCategoryId.value, '型別:', typeof selectedCategoryId.value)
  console.log(
    '商品們的分類 id:',
    products.value.map((p) => p.productCategoryId),
  )
  console.log('第一個商品分類 id 的型別:', typeof products.value[0]?.productCategoryId)

  return `${API_BASE}/images/product/${fileName}`
}

// 頁面一仔入，就打API拿商品
onMounted(async () => {
  try {
    // 同時打「商品」和「分類」兩個 API
    const productRes = await axios.get(`${API_BASE}/api/product`)
    products.value = productRes.data

    const categoryRes = await axios.get(`${API_BASE}/api/productCategory`)
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
      <RouterLink
        v-for="cat in categories"
        :key="cat.productCategoryId"
        :to="{ query: { categoryId: cat.productCategoryId } }"
        class="cat-btn"
        :class="{ active: selectedCategoryId === cat.productCategoryId }"
      >
        {{ cat.categoryName }}
      </RouterLink>
    </div>
    <div class="grid">
      <article v-for="p in filteredProducts" :key="p.productId" class="card">
        <div class="card-image">
          <span class="card-tag">{{ p.status }}</span>
          <img :src="getImageUrl(p.productImgFile)" :alt="p.productName" class="product-img" />
        </div>
        <div class="card-body">
          <h3 class="card-name">{{ p.productName }}</h3>
          <p class="card-desc">{{ p.description }}</p>
          <p class="card-price">TWD {{ p.price.toLocaleString() }}</p>
        </div>
      </article>
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

.card {
  border: 1px solid var(--home-border);
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

.product-img {
  width: 258.4px;
  height: 344.3px;
  object-fit: cover; /* 圖片填滿、裁切多餘部分，不變形 */
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
