<script setup>
import HeroCarousel from '@/components/home/HeroCarousel.vue'
import PromoGrid from '@/components/home/PromoGrid.vue'
import CollabBanner from '@/components/home/CollabBanner.vue'
import CommunitySection from '@/components/home/CommunitySection.vue'
import CategoryShowcase from '@/components/home/CategoryShowcase.vue'
</script>

<template>
  <div class="clo-home">
    <main>
      <HeroCarousel />
      <PromoGrid />
      <CollabBanner />
      <CommunitySection />
      <CategoryShowcase />
    </main>
  </div>
</template>

<style scoped>
.clo-home {
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
