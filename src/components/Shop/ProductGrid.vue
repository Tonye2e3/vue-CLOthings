<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const categories = ['WOMEN', 'MEN', 'KIDS', 'BABY']

const products = [
  { name: '寬版落肩T恤', desc: '柔軟純棉，寬鬆版型', price: 'NT$390', tag: '新品上市', category: 'WOMEN' },
  { name: '輕薄羽絨外套', desc: '輕量保暖，可收納', price: 'NT$1,990', tag: '期間限定', category: 'WOMEN' },
  { name: '直筒牛仔褲', desc: '百搭版型，彈性耐穿布料', price: 'NT$890', tag: '新品上市', category: 'WOMEN' },
  { name: '素色連帽外套', desc: '簡約百搭，四季皆宜', price: 'NT$1,290', tag: '新品上市', category: 'MEN' },
  { name: '修身西裝褲', desc: '俐落版型，商務休閒兩用', price: 'NT$990', tag: '期間限定', category: 'MEN' },
  { name: '針織開襟衫', desc: '簡約線條，四季皆宜', price: 'NT$690', tag: '期間限定', category: 'MEN' },
  { name: '童趣印花T恤', desc: '柔軟純棉，活動好穿脫', price: 'NT$290', tag: '新品上市', category: 'KIDS' },
  { name: '保暖刷毛外套', desc: '輕量刷毛，戶外遊玩必備', price: 'NT$690', tag: '期間限定', category: 'KIDS' },
  { name: '彈性運動褲', desc: '彈性布料，好動不受限', price: 'NT$490', tag: '新品上市', category: 'KIDS' },
  { name: '純棉包屁衣', desc: '親膚透氣，呵護寶寶肌膚', price: 'NT$290', tag: '新品上市', category: 'BABY' },
  { name: '柔軟連身衣', desc: '柔軟布料，寶寶穿著更舒適', price: 'NT$390', tag: '期間限定', category: 'BABY' },
  { name: '透氣嬰兒外套', desc: '輕薄透氣，四季皆宜', price: 'NT$590', tag: '新品上市', category: 'BABY' },
]

const selectedCategory = computed(() => {
  const category = route.query.category
  return categories.includes(category) ? category : ''
})

const filteredProducts = computed(() =>
  selectedCategory.value
    ? products.filter((p) => p.category === selectedCategory.value)
    : products,
)

const title = computed(() =>
  selectedCategory.value ? `${selectedCategory.value} 商品` : '全部商品',
)
</script>

<template>
  <section class="promo">
    <h2 class="section-title">{{ title }}</h2>
    <div class="grid">
      <article v-for="p in filteredProducts" :key="p.category + p.name" class="card">
        <div class="card-image">
          <span class="card-tag">{{ p.tag }}</span>
          <span class="placeholder-label">商品圖片</span>
        </div>
        <div class="card-body">
          <h3 class="card-name">{{ p.name }}</h3>
          <p class="card-desc">{{ p.desc }}</p>
          <p class="card-price">{{ p.price }}</p>
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
