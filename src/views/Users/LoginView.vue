<script setup>
import IconGoogle from '@/components/icons/iconGoogle.vue'
import IconLineColorful from '@/components/icons/IconLineColorful.vue'
import { isValidLoginAccount, isValidPassword } from '@/utils/UserValidator'
import { ref } from 'vue'

const account = ref('')
const password = ref('')

import api from '@/api/api'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

async function login() {
  const data = {
    account: account.value,
    password: password.value,
  }
  try {
    const resp = await api.post('/User/login', data)
    console.log('登入結果', resp)
    console.log('Pinia 登入資料', authStore)

    authStore.setAuth(resp.data)

    //測試get me功能
    // const meResp = await api.get('/User/me')
    // console.log('目前使用者：', meResp.data)

    alert('登入成功')
    router.push(route.query.redirect || '/')
  } catch (error) {
    if (error.response?.status === 401) {
      alert('帳號或密碼錯誤')
    } else {
      alert('伺服器錯誤，請稍後再試')
    }
  }
}

function googleLogin() {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/User/google/login`
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 標題 -->
      <div class="login-header">
        <p class="login-label">MEMBER LOGIN</p>
        <h1>登入會員</h1>
        <p>登入 CLOthings，探索你的專屬穿搭。</p>
      </div>

      <!-- 帳號 -->
      <div class="form-group">
        <label>帳號或電子郵件</label>

        <input
          v-model="account"
          type="text"
          class="form-input"
          placeholder="請輸入帳號或電子郵件"
          @keyup.enter="login"
        />

        <span class="error-text">
          {{ isValidLoginAccount(account) }}
        </span>
      </div>

      <!-- 密碼 -->
      <div class="form-group">
        <div class="password-label">
          <label>密碼</label>

          <RouterLink to="/forgot-password" class="forgot-password"> 忘記密碼？ </RouterLink>
        </div>

        <input
          v-model="password"
          type="password"
          class="form-input"
          placeholder="請輸入密碼"
          @keyup.enter="login"
        />

        <span class="error-text">
          {{ isValidPassword(password) }}
        </span>
      </div>

      <!-- 登入 -->
      <button type="button" class="login-btn" @click="login">登入</button>

      <!-- 註冊 -->
      <div class="register-area">
        <span>還不是會員？</span>

        <button type="button" class="register-link" @click="router.push('/register')">
          建立帳號
        </button>
      </div>

      <!-- 分隔線 -->
      <div class="divider">
        <span>或使用其他方式登入</span>
      </div>

      <!-- 第三方登入 -->
      <div class="social-login">
        <button type="button" class="social-btn" @click="googleLogin">
          <IconGoogle />
          <span>Google</span>
        </button>

        <button type="button" class="social-btn">
          <IconLineColorful />
          <span>LINE</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: flex-start;

  padding: 80px 20px;

  background: #f7f4f0;
}

.login-card {
  width: 100%;
  max-width: 520px;

  padding: 48px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 16px;

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.03),
    0 16px 40px rgba(0, 0, 0, 0.05);
}

/* =========================
   Header
========================= */

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-label {
  margin-bottom: 8px;

  color: #999999;

  font-size: 11px;
  font-weight: 700;

  letter-spacing: 2px;
}

.login-header h1 {
  margin-bottom: 10px;

  color: #222222;

  font-size: 28px;
  font-weight: 700;
}

.login-header p {
  margin: 0;

  color: #888888;

  font-size: 13px;
}

/* =========================
   Form
========================= */

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;

  margin-bottom: 8px;

  color: #333333;

  font-size: 13px;
  font-weight: 600;
}

.form-input {
  width: 100%;
  height: 46px;

  padding: 0 14px;

  border: 1px solid #dddddd;
  border-radius: 8px;

  background: #ffffff;

  color: #222222;

  font-size: 14px;

  outline: none;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-input::placeholder {
  color: #bbbbbb;
}

.form-input:focus {
  border-color: #555555;

  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}

/* =========================
   Password
========================= */

.password-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.password-label label {
  margin-bottom: 8px;
}

.forgot-password {
  margin-bottom: 8px;

  color: #777777;

  font-size: 12px;

  text-decoration: none;
}

.forgot-password:hover {
  color: #111111;

  text-decoration: underline;
}

/* =========================
   Validation
========================= */

.error-text {
  display: block;

  min-height: 18px;

  margin-top: 5px;

  color: #d9534f;

  font-size: 11px;
}

/* =========================
   Login Button
========================= */

.login-btn {
  width: 100%;
  height: 48px;

  border: none;
  border-radius: 8px;

  background: #222222;

  color: #ffffff;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.1s ease;
}

.login-btn:hover {
  background: #000000;
}

.login-btn:active {
  transform: scale(0.99);
}

/* =========================
   Register
========================= */

.register-area {
  display: flex;
  justify-content: center;
  align-items: center;

  gap: 5px;

  margin-top: 18px;

  color: #888888;

  font-size: 12px;
}

.register-link {
  padding: 0;

  border: none;

  background: transparent;

  color: #222222;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.register-link:hover {
  text-decoration: underline;
}

/* =========================
   Divider
========================= */

.divider {
  display: flex;
  align-items: center;

  gap: 14px;

  margin: 30px 0 22px;

  color: #aaaaaa;

  font-size: 11px;
}

.divider::before,
.divider::after {
  content: '';

  flex: 1;

  height: 1px;

  background: #eeeeee;
}

.divider span {
  white-space: nowrap;
}

/* =========================
   Social Login
========================= */

.social-login {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 12px;
}

.social-btn {
  height: 46px;

  display: flex;
  justify-content: center;
  align-items: center;

  gap: 9px;

  border: 1px solid #dddddd;
  border-radius: 8px;

  background: #ffffff;

  color: #333333;

  font-size: 13px;
  font-weight: 500;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.social-btn:hover {
  background: #f8f8f8;

  border-color: #bbbbbb;
}

.social-btn :deep(svg) {
  width: 20px;
  height: 20px;
}

/* =========================
   RWD
========================= */

@media (max-width: 600px) {
  .login-page {
    padding: 40px 16px;
  }

  .login-card {
    padding: 32px 24px;
  }

  .social-login {
    grid-template-columns: 1fr;
  }
}
</style>
