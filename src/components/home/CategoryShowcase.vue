<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const categories = [
  { label: 'ALL', bg: '#e0e0e0' },
  { label: 'WOMEN', bg: '#eeeeee' },
  { label: 'MEN', bg: '#e5e5e5' },
  { label: 'KIDS', bg: '#efefef' },
  { label: 'BABY', bg: '#f2f2f2' },
]
</script>

<template>
  <section class="categories">
    <h2 class="section-title">分類選購</h2>
    <div class="cat-grid">
      <RouterLink
        v-for="c in categories"
        :key="c.label"
        :to="{ name: route.name, query: { category: c.label } }"
        class="cat-card"
        :class="{ active: route.query.category === c.label }"
        :style="{ background: c.bg }"
      >
        <span>{{ c.label }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.categories {
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

.cat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
}

.cat-card {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--home-text);
  font-weight: 700;
  letter-spacing: 0.08em;
  border: 1px solid var(--home-border);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}
.cat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.cat-card.active {
  outline: 2px solid var(--home-accent);
  outline-offset: -2px;
}

@media (max-width: 1024px) {
  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
