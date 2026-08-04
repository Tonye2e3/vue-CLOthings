<script setup>
import { RouterLink } from 'vue-router'
import IconSearch from '@/components/icons/IconSearch.vue'
import IconHeart from '@/components/icons/IconHeart.vue'
import IconUser from '@/components/icons/IconUser.vue'
import IconCart from '@/components/icons/IconCart.vue'

const navItems = [
  { label: 'Home', to: { name: 'home' } },
  { label: 'Shop', to: { name: 'sampleShop' } },
  { label: 'Community', to: { name: 'sampleCommunity' } },
  { label: 'Group Buying', to: { name: 'sampleGroupShop' } },
]
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink :to="{ name: 'home' }" class="logo">CLOthings</RouterLink>

      <nav class="main-nav">
        <RouterLink v-for="item in navItems" :key="item.label" :to="item.to" class="nav-link">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header-actions">
        <button class="icon-btn" type="button" aria-label="搜尋"><IconSearch /></button>
        <button class="icon-btn" type="button" aria-label="收藏"><IconHeart /></button>
        <RouterLink :to="{ name: 'login' }" class="icon-btn" aria-label="帳號"
          ><IconUser
        /></RouterLink>
        <button class="icon-btn" type="button" aria-label="購物車"><IconCart /></button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--home-bg);
  border-bottom: 1px solid var(--home-border);
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 24px;
}

.logo {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.05em;
  color: var(--home-text);
  text-decoration: none;
  flex-shrink: 0;
}

.main-nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  color: var(--home-text);
  text-decoration: none;
  font-size: 0.9rem;
  letter-spacing: 0.03em;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition:
    border-color 0.25s ease,
    opacity 0.25s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  border-color: var(--home-accent);
}

.header-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--home-text);
  cursor: pointer;
  border-radius: 50%;
  transition:
    background-color 0.2s ease,
    transform 0.15s ease;
}

.icon-btn:hover {
  background: var(--home-bg-soft);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .main-nav {
    display: none;
  }
}
</style>
