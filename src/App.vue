<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
//======== SiteHeader.vue 開始==========
import { RouterLink } from 'vue-router'
import IconSearch from '@/components/icons/IconSearch.vue'
import IconHeart from '@/components/icons/IconHeart.vue'
import IconUser from '@/components/icons/IconUser.vue'
import IconCart from '@/components/icons/IconCart.vue'
//======== SiteHeader.vue 結束==========
//======== Sitefooter.vue 開始==========

//======== Sitefooter.vue 結束==========

const authStore = useAuthStore()
const router = useRouter()

//======== SiteHeader.vue 開始==========
const navItems = [
  { label: 'Home', to: { name: 'home' } },
  { label: 'Shop', to: { name: 'Shop' } },
  { label: 'Community', to: { name: 'Community' } },
  { label: 'Group Buying', to: { name: 'GroupProducts' } },
]
//======== SiteHeader.vue 結束==========
function logout() {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<template>
  <header class="site-header navbar" style="background-color: #f9f4f0">
    <div class="header-inner">
      <img src="@/assets/CLO.things LOGO.png" alt="CLO.things logo" class="logo" />
      <nav class="main-nav">
        <RouterLink v-for="item in navItems" :key="item.label" :to="item.to" class="nav-link">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header-actions">
        <button class="icon-btn" type="button" aria-label="搜尋"><IconSearch /></button>
        <button class="icon-btn" type="button" aria-label="收藏"><IconHeart /></button>
        <RouterLink :to="{ name: 'user' }" class="icon-btn" aria-label="帳號"
          ><IconUser
        /></RouterLink>
        <button class="icon-btn" type="button" aria-label="購物車"><IconCart /></button>
      </div>
    </div>
  </header>

  <!-- <header class="navbar">
    <div class="nav-left">
      <img src="@/assets/CLOthingsLogo.svg" alt="CLO.things logo" class="logo" />
      <span class="brand">CLO.things</span>
    </div>

    <nav class="nav-center">
      <RouterLink to="/">首頁</RouterLink>
      <RouterLink to="/categories">分類</RouterLink>
      <RouterLink :to="{ name: 'Community' }">社群</RouterLink>
      <RouterLink :to="{ name: 'GroupProducts' }">團購</RouterLink>
      <RouterLink :to="{ name: 'sampleShop' }">購物車</RouterLink>
    </nav>

    <div class="nav-right">
      <!- //搜尋欄
       <input type="text" placeholder="Search in site" />
      <i class="fa fa-search"></i>  -->
  <!-- <RouterLink :to="{ name: 'user' }">使用者</RouterLink>
      <RouterLink :to="{ name: 'login' }">登入</RouterLink>
      <RouterLink :to="{ name: 'register' }">註冊</RouterLink>
      <a href="/logout">登出</a>
    </div>
  </header>  -->

  <div style="margin: auto 300px">
    <!--頁面內容預留區-->
    <RouterView />
  </div>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #9d7762;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  margin-right: 0.5rem;
  /*border-radius: 50%;  讓元素變成圓形 */
  object-fit: cover; /* 保持圖片比例填滿 */
  overflow: hidden; /* 超出部分裁掉 */
}

.brand {
  font-weight: 600;
  font-size: 1.1rem;
}

.nav-center a {
  margin: 0 0.8rem;
  color: #000000;
  text-decoration: none;
}

.nav-center a:hover {
  color: #000000;
}

.nav-right {
  display: flex;
  align-items: center;
  color: #000000;
}

.nav-right input {
  border: 1px solid #000000;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
}

.nav-right i {
  margin-left: 0.4rem;
  color: #666;
}
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
