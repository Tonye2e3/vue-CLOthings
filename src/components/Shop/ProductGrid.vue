<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()

const categories = ['WOMEN', 'MEN', 'KIDS', 'BABY']

const products = ref([])

// 頁面一仔入，就打API拿商品
onMounted(async () => {
  try {
    const response = await axios.get('https://localhost:7255/api/product')
    products.value = response.data // API回傳的資料塞進products
    console.log('拿到的商品:', response.data)
  } catch (error) {
    console.log('拿商品失敗', error)
  }
})

const selectedCategory = computed(() => {
  const category = route.query.category
  return categories.includes(category) ? category : ''
})

const filteredProducts = computed(() => products.value)

const title = computed(() => '全部商品')
</script>

<template>
  <section class="promo">
    <h2 class="section-title">{{ title }}</h2>
    <div class="grid">
      <article v-for="p in filteredProducts" :key="p.productId" class="card">
        <div class="card-image">
          <span class="card-tag">{{ p.status }}</span>
          <span class="placeholder-label">商品圖片</span>
        </div>
        <div class="card-body">
          <h3 class="card-name">{{ p.productName }}</h3>
          <p class="card-desc">{{ p.description }}</p>
          <p class="card-price">TWD {{ p.price }}</p>
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
