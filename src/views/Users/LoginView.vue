<script setup>
import { isValidAccount, isValidPassword } from '@/utils/userValidator'
import { ref } from 'vue'

const account = ref('')
const password = ref('')

import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

import { useRouter } from 'vue-router'
import IconLine from '@/components/icons/IconLine.vue'
import IconGoogle from '@/components/icons/iconGoogle.vue'
import IconLineColorful from '@/components/icons/IconLineColorful.vue'
const router = useRouter()

async function login() {
  const data = {
    account: account.value,
    password: password.value,
  }
  // 模擬後端回傳的假資料
  const fakeResp = {
    data: {
      token: 'fake-jwt-token-123',
      user: {
        id: 1,
        name: '測試用戶',
        role: 'admin',
      },
    },
    status: 200,
  }

  // 模擬成功登入流程
  authStore.setAuth(fakeResp.data)
  alert('登入成功 (假資料)')
  router.push({ name: 'home' })
  console.log('登入結果', fakeResp)
}
</script>

<template>
  <div class="col-md-6 m-auto card p-4 mt-5 shadow" style="width: 800px">
    <h3 class="mb-4 fw-bold text-center">登入</h3>

    <div class="mb-3">
      <label class="form-label">帳號</label>
      <input type="text" class="form-control" v-model="account" />
      <span class="form-text text-danger">{{ isValidAccount(account) }}</span>
    </div>
    <div class="mb-3">
      <label class="form-label">密碼</label>
      <input type="password" class="form-control" v-model="password" />
      <span class="form-text text-danger">{{ isValidAccount(password) }}</span>
    </div>

    <button class="btn btn-primary w-100 py-2" type="button" @click="login">登入</button>
    <button
      class="btn btn-outline-primary w-100 py-2 mt-2"
      type="button"
      @click="router.push('/register')"
    >
      註冊
    </button>
    <div class="text-center mt-3">其他登入方式</div>
    <div class="d-flex gap-2">
      <button class="btn btn-outline-secondary w-50 py-2 mt-2" type="button">
        <IconGoogle /> Google 登入
      </button>
      <button class="btn btn-outline-secondary w-50 py-2 mt-2" type="button">
        <IconLineColorful /> Line 登入
      </button>
    </div>
  </div>
</template>

<style scoped></style>
