<!-- <script setup>
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <main>
    <TheWelcome />
  </main>
</template> -->
<script setup>
// import SiteHeader from '@/components/home/SiteHeader.vue'
import HeroCarousel from '@/components/home/HeroCarousel.vue'
import PromoGrid from '@/components/home/PromoGrid.vue'
import CollabBanner from '@/components/home/CollabBanner.vue'
import CommunitySection from '@/components/home/CommunitySection.vue'
import CategoryShowcase from '@/components/home/CategoryShowcase.vue'
import SiteFooter from '@/components/home/SiteFooter.vue'
</script>

<template>
  <div class="uniqlo-home">
    <SiteHeader />
    <main>
      <HeroCarousel />
      <PromoGrid />
      <CollabBanner />
      <CommunitySection />
      <CategoryShowcase />
    </main>
    <SiteFooter />
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
