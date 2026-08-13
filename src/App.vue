<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
//======== SiteHeader.vue 開始==========
import { RouterLink } from 'vue-router'
import IconSearch from '@/components/icons/IconSearch.vue'
import IconHeart from '@/components/icons/IconHeart.vue'
import IconUser from '@/components/icons/IconUser.vue'
import IconCart from '@/components/icons/IconCart.vue'
//======== Sitefooter.vue 開始==========
import IconFacebook from '@/components/icons/IconFacebook.vue'
import IconInstagram from '@/components/icons/IconInstagram.vue'
import IconLine from '@/components/icons/IconLine.vue'
import IconYoutube from '@/components/icons/IconYoutube.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

//======== SiteHeader.vue 開始==========
const navItems = [
  { label: 'Home', to: { name: 'home' } },
  { label: 'Shop', to: { name: 'shop' } },
  { label: 'Community', to: { name: 'Community' } },
  { label: 'Group Buying', to: { name: 'GroupProducts' } },
]

// 判斷目前是不是在「團購 Group」相關頁面：在這些頁面時，導覽列自己的購物車圖示要隱藏
// （團購頁面有自己的購物車機制，避免使用者混淆是哪一個購物車）
const isGroupSection = computed(() => route.path.startsWith('/GroupShop'))
//======== Sitefooter.vue 開始==========
const footerLinks = [
  { label: '客服中心', routeName: 'service' },
  { label: '常見問題（FAQ）', routeName: null },
  { label: '公司資訊', routeName: 'about' },
  { label: '隱私政策', routeName: null },
]

function logout() {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink :to="{ name: 'home' }" aria-label="首頁"
        ><img src="@/assets/CLO.things LOGO.png" alt="CLO.things logo" class="logo"
      /></RouterLink>
      <nav class="main-nav">
        <RouterLink v-for="item in navItems" :key="item.label" :to="item.to" class="nav-link">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header-actions">
        <button class="icon-btn" type="button" aria-label="搜尋">
          <IconSearch />
        </button>

        <RouterLink :to="{ name: 'favorite' }" class="icon-btn" aria-label="收藏">
          <IconHeart />
        </RouterLink>
        <RouterLink
          v-if="authStore.isLoggedIn"
          :to="{ name: 'user' }"
          class="icon-btn"
          aria-label="帳號"
        >
          <IconUser />
        </RouterLink>
        <RouterLink
          v-else
          :to="{ name: 'login' }"
          v-if="!isGroupSection"
          class="icon-btn"
          aria-label="帳號"
        >
          <IconUser />
        </RouterLink>
        <RouterLink
          v-if="!isGroupSection"
          :to="{ name: 'cart' }"
          class="icon-btn"
          aria-label="購物車"
        >
          <IconCart />
        </RouterLink>
      </div>
    </div>
  </header>

  <div class="main-container">
    <!--頁面內容預留區-->
    <RouterView />
  </div>
  <footer class="site-footer">
    <div class="footer-inner">
      <nav class="footer-links">
        <template v-for="l in footerLinks" :key="l.label">
          <!-- 有 routeName 的 → 用 RouterLink 連到內部頁面 -->
          <RouterLink v-if="l.routeName" :to="{ name: l.routeName }">
            {{ l.label }}
          </RouterLink>
          <!-- !!!!!!還沒做的頁面 → 暫時用 <a href="#">，之後補!!!!! -->
          <a v-else href="#">{{ l.label }}</a>
        </template>
      </nav>

      <div class="social-icons">
        <a href="#" aria-label="Facebook">
          <IconFacebook />
        </a>
        <a href="#" aria-label="Instagram">
          <IconInstagram />
        </a>
        <a href="#" aria-label="LINE">
          <IconLine />
        </a>
        <a href="#" aria-label="YouTube">
          <IconYoutube />
        </a>
      </div>

      <p class="copyright">© 2026 CLOthings. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.main-container {
  width: 100%;
  max-width: 1200px;
  /* 依照設計需求調整內容的最大寬度 */
  margin: 0 auto;
  /* 上下 0，左右自動置中 */
  padding: 0 20px;
  /* 手機和平板時的左右安全邊距 */
  box-sizing: border-box;
}

.logo {
  height: 40px;
  padding-left: 15px;
  object-fit: cover;
  /* 保持圖片比例填滿 */
  overflow: hidden;
  /* 超出部分裁掉 */
  justify-self: start;
  /* 靠左 */
  /*border-radius: 50%;  讓元素變成圓形 */
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--home-bg);
  border-bottom: 1px solid var(--home-border);
  background-color: #f9f4f0;
}

.header-inner {
  max-width: 1180px;
  /* width: 100%; */
  margin: 0 auto;
  height: 64px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  /* 這個是左右安全邊距，可依需求調整大小 */
  box-sizing: border-box;
  position: relative;
}

.main-nav {
  display: flex;
  gap: 32px;
  justify-self: center;
  /* 永遠置中 */
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
  justify-self: end;
  /* 靠右 */
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

/* SiteFooter */
.site-footer {
  border-top: 1px solid var(--home-border);
  background: var(--home-bg-soft);
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
}

.footer-links a {
  color: var(--home-text);
  text-decoration: none;
  font-size: 0.85rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.footer-links a:hover {
  opacity: 1;
  color: var(--home-accent);
}

.social-icons {
  display: flex;
  gap: 16px;
}

.social-icons a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--home-text);
  border: 1px solid var(--home-border);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.social-icons a:hover {
  background: var(--home-accent);
  color: #fff;
  border-color: var(--home-accent);
}

.copyright {
  font-size: 0.75rem;
  color: #888;
}
</style>
