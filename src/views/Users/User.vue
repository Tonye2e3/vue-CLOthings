<script setup>
import AccountCard from './UserCard/AccountCard.vue'
import AddressCard from './UserCard/AddressCard.vue'
import ProfileCard from './UserCard/ProfileCard.vue'
import oAuthCard from './UserCard/oAuthCard.vue'

import '@/assets/styles/user-common.css'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import api from '@/services/api'

import {
  faUser,
  faIdCard,
  faHouse,
  faLink,
  faRightFromBracket,

  faBagShopping,
  faUsers,
  faAddressCard,
  faMessage,

} from '@fortawesome/free-solid-svg-icons'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// ⭐ 修改：改成 async，因為現在要呼叫後端
async function logout() {
  try {
    // ⭐ 新增：通知後端撤銷 Refresh Token
    await api.post('/User/logout')
  } catch (error) {
    // ⭐ 新增：
    // 就算後端 Logout 發生問題
    // 前端還是要清除登入狀態
    console.error('Logout API 發生錯誤：', error)
  } finally {
    // 原本就有：清除 Pinia 的 Access Token / 使用者資料
    authStore.clearAuth()

    // 原本就有：回登入頁
    router.push({ name: 'login' })
  }
}

// 🟢 新增：回到會員設定頁，並捲動到指定 Card
async function goToSection(sectionId) {
  // 先回到會員中心首頁
  if (router.currentRoute.value.name !== 'user') {
    await router.push({ name: 'user' })
  }

  // 等 Vue 把 AccountCard / ProfileCard... 渲染出來
  requestAnimationFrame(() => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}
</script>

<template>
  <div class="user-page">
    <div class="user-container">
      <!-- ============================= -->
      <!-- 左側會員中心導覽 -->
      <!-- ============================= -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <p class="sidebar-subtitle">MEMBER CENTER</p>
          <h2 class="sidebar-title">會員中心</h2>
        </div>

        <nav class="sidebar-nav">
          <!-- 帳戶資料 -->
          <button type="button" class="nav-item nav-button" @click="goToSection('account')">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faUser" />
            </span>

            <div>
              <span class="nav-title">帳戶資料</span>
              <small>Account</small>
            </div>
          </button>

          <!-- 個人資料 --><button type="button" class="nav-item nav-button" @click="goToSection('profile')">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faIdCard" />
            </span>

            <div>
              <span class="nav-title">個人資料</span>
              <small>Profile</small>
            </div>
          </button>
          <!-- 收件資料 --><button type="button" class="nav-item nav-button" @click="goToSection('address')">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faHouse" />
            </span>

            <div>
              <span class="nav-title">收件資料</span>
              <small>Address</small>
            </div>
          </button>

          <!-- 第三方登入 --><button type="button" class="nav-item nav-button" @click="goToSection('oauth')">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faLink" />
            </span>

            <div>
              <span class="nav-title">第三方登入</span>
              <small>Connections</small>
            </div>
          </button>

          <div class="sidebar-header">
            <p class="sidebar-subtitle">Orders</p>
            <h2 class="sidebar-title">訂單</h2>
          </div>

          <!--  商城訂單 -->
          <RouterLink :to="{ name: 'UserShopOrders' }" class="nav-item">
            <span class="nav-icon">
              <font-awesome-icon :icon="faBagShopping" />
            </span>

            <div>
              <span class="nav-title">商城訂單</span>
              <small>Orders</small>
            </div>
          </RouterLink>

          <!--  團購訂單 -->
          <RouterLink :to="{ name: 'UserGroupOrders' }" class="nav-item">
            <span class="nav-icon">
              <font-awesome-icon :icon="faUsers" />
            </span>

            <div>
              <span class="nav-title">團購訂單</span>
              <small>Group Orders</small>
            </div>
          </RouterLink>

          <div class="sidebar-header">
            <p class="sidebar-subtitle">Community</p>
            <h2 class="sidebar-title">社群</h2>
          </div>

          <!--  個人頁 -->
          <RouterLink v-if="authStore.userId" :to="{
            name: 'UserCommunityProfile', params: { userId: authStore.userId }
          }" class="nav-item">

            <span class="nav-icon">
              <font-awesome-icon :icon="faAddressCard" />
            </span>

            <div>
              <span class="nav-title">社群個人頁</span>
              <small>My Page</small>
            </div>
          </RouterLink>

          <!--  訊息 -->
          <RouterLink :to="{ name: 'UserMessages' }" class="nav-item">
            <span class="nav-icon">
              <font-awesome-icon :icon="faMessage" />
            </span>

            <div>
              <span class="nav-title">訊息</span>
              <small>Messages</small>
            </div>
          </RouterLink>

        </nav>

        <div class="sidebar-footer">
          <button type="button" class="logout-btn" @click="logout">
            <FontAwesomeIcon :icon="faRightFromBracket" />
            登出
          </button>
        </div>
      </aside>

      <!-- ============================= -->
      <!-- 右側會員內容 -->
      <!-- ============================= -->
      <main class="content-area">

        <!-- ========================================== -->
        <!-- 🟡 修改：會員中心首頁才顯示原本四張 Card -->
        <!-- ========================================== -->

        <template v-if="route.name === 'user'">

          <div class="page-header">
            <p class="page-subtitle">MY ACCOUNT</p>

            <h1>帳戶設定</h1>

            <p class="page-description">
              管理你的會員資料、個人資訊與收件地址。
            </p>
          </div>

          <section id="account" class="content-section">
            <AccountCard />
          </section>

          <section id="profile" class="content-section">
            <ProfileCard />
          </section>

          <section id="address" class="content-section">
            <AddressCard />
          </section>

          <section id="oauth" class="content-section">
            <oAuthCard />
          </section>

        </template>


        <!-- ========================================== -->
        <!-- 🟢 新增：其他會員功能顯示在右側 -->
        <!-- ========================================== -->

        <RouterView v-else />

      </main>
    </div>
  </div>
</template>

<style scoped>
/* =========================
   整個會員中心背景
========================= */

.user-page {
  min-height: 100vh;
  background: #f9f4f0;
  padding: 48px 24px 80px;
}

/* =========================
   主要 Layout
========================= */

.user-container {
  width: 100%;
  max-width: 1200px;

  margin: 0 auto;

  display: grid;

  grid-template-columns: 200px minmax(0, 1fr);

  gap: 10px;

  align-items: start;
}

/* =========================
   Sidebar
========================= */

.sidebar {
  position: sticky;

  top: 100px;

  background: #ffffff;

  border: 1px solid #e6e6e6;

  border-radius: 16px;

  overflow: hidden;

  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.sidebar-header {
  padding: 10px 18px 15px;

  border-bottom: 1px solid #eeeeee;
}

.sidebar-subtitle {
  margin: 0 0 5px;

  font-size: 11px;

  font-weight: 700;

  letter-spacing: 1.5px;

  color: #999999;
}

.sidebar-title {
  margin: 0;

  font-size: 22px;

  font-weight: 700;

  color: #181818;
}

/* =========================
   Navigation
========================= */

.sidebar-nav {
  padding: 8px;
}

.nav-item {
  display: flex;

  align-items: center;

  gap: 13px;

  padding: 5px 10px;

  margin-bottom: 4px;

  border-radius: 10px;

  text-decoration: none;

  color: #444444;

  transition: all 0.2s ease;
}

.nav-item:hover {
  background: #f3f3f3;

  color: #111111;

  transform: translateX(3px);
}

.nav-icon {
  width: 30px;

  font-size: 18px;

  text-align: center;
}

.nav-item div {
  display: flex;

  flex-direction: column;

  gap: 1px;
}

.nav-title {
  font-size: 14px;

  font-weight: 600;
}

.nav-item small {
  font-size: 11px;

  color: #aaaaaa;
}

/* =========================
   登出
========================= */

.sidebar-footer {
  padding: 14px 18px 18px;

  border-top: 1px solid #eeeeee;
}

.logout-btn {
  width: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  padding: 10px;

  border: none;

  border-radius: 9px;

  background: transparent;

  color: #dc3545;

  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.logout-btn:hover {
  background: #fff1f1;
}

/* =========================
   右側內容
========================= */

.content-area {
  min-width: 0;
}

.page-header {
  margin-bottom: 30px;
}

.page-subtitle {
  margin-bottom: 5px;

  color: #999999;

  font-size: 11px;

  font-weight: 700;

  letter-spacing: 1.8px;
}

.page-header h1 {
  margin: 0 0 8px;

  font-size: 32px;

  font-weight: 700;

  color: #181818;
}

.page-description {
  margin: 0;

  color: #777777;

  font-size: 14px;
}

/* =========================
   每個 Card 區塊
========================= */

.content-section {
  scroll-margin-top: 110px;

  margin-bottom: 28px;
}

/* =========================
   平板 / 手機
========================= */

@media (max-width: 900px) {
  .user-container {
    grid-template-columns: 1fr;

    gap: 25px;
  }

  .sidebar {
    position: static;
  }

  .sidebar-nav {
    display: grid;

    grid-template-columns: repeat(2, 1fr);

    gap: 5px;
  }

  .nav-item {
    margin: 0;
  }
}

@media (max-width: 576px) {
  .user-page {
    padding: 25px 14px 60px;
  }

  .sidebar-nav {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 26px;
  }
}

/* 🟢 新增：Sidebar 功能分類標題 */
.nav-group-title {
  margin: 18px 14px 8px;

  padding-top: 16px;

  border-top: 1px solid #eeeeee;

  color: #999999;

  font-size: 11px;

  font-weight: 700;

  letter-spacing: 1.2px;
}

/* 🟢 新增：讓 button 看起來跟原本導覽列一樣 */
.nav-button {
  width: 100%;
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}
</style>
