<script setup>
import AccountCard from './UserCard/AccountCard.vue'
import AddressCard from './UserCard/AddressCard.vue'
import ProfileCard from './UserCard/ProfileCard.vue'
import oAuthCard from './UserCard/oAuthCard.vue'

import '@/assets/styles/user-common.css'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

import api from '@/services/api'

import {
  faUser,
  faIdCard,
  faHouse,
  faLink,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'

const authStore = useAuthStore()
const router = useRouter()

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
          <a href="#account" class="nav-item">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faUser" />
            </span>

            <div>
              <span class="nav-title">帳戶資料</span>
              <small>Account</small>
            </div>
          </a>

          <!-- 個人資料 -->
          <a href="#profile" class="nav-item">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faIdCard" />
            </span>

            <div>
              <span class="nav-title">個人資料</span>
              <small>Profile</small>
            </div>
          </a>

          <!-- 收件資料 -->
          <a href="#address" class="nav-item">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faHouse" />
            </span>

            <div>
              <span class="nav-title">收件資料</span>
              <small>Address</small>
            </div>
          </a>

          <!-- 第三方登入 -->
          <a href="#oauth" class="nav-item">
            <span class="nav-icon">
              <FontAwesomeIcon :icon="faLink" />
            </span>

            <div>
              <span class="nav-title">第三方登入</span>
              <small>Connections</small>
            </div>
          </a>
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
        <div class="page-header">
          <p class="page-subtitle">MY ACCOUNT</p>

          <h1>帳戶設定</h1>

          <p class="page-description">管理你的會員資料、個人資訊與收件地址。</p>
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

  grid-template-columns: 240px minmax(0, 1fr);

  gap: 40px;

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
  padding: 26px 24px 20px;

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
  padding: 12px;
}

.nav-item {
  display: flex;

  align-items: center;

  gap: 13px;

  padding: 13px 14px;

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
</style>
