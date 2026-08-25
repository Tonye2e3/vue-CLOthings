<script setup>
import HeroCarousel from '@/components/home/HeroCarousel.vue'
import ProductGrid from '@/components/Shop/ProductGrid.vue'
import CategoryShowcase from '@/components/home/CategoryShowcase.vue'
</script>

<template>
  <div class="uniqlo-home">
    <main>
      <h1>2026/08/21 16:44</h1>
      <HeroCarousel />
      <ProductGrid />
    </main>
  </div>
</template>

<style scoped>
.uniqlo-home {
  --home-bg: #ffffff;
  --home-bg-soft: #f5f5f5;
  --home-text: #111111;
  --home-border: #e5e5e5;
  --home-accent: #e60012;

  background: var(--home-bg);
  color: var(--home-text);
  font-family: 'Noto Sans TC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
</style>
