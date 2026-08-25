<script setup>
import IconGoogle from '@/components/icons/iconGoogle.vue'
import IconLineColorful from '@/components/icons/IconLineColorful.vue'
import { isValidAccount, isValidPassword } from '@/utils/UserValidator'
import { ref } from 'vue'

const account = ref('')
const password = ref('')

import api from '@/services/api'
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
  window.location.href = 'https://localhost:7255/api/User/google/login'
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
      <span class="form-text text-danger">{{ isValidPassword(password) }}</span>
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
      <button class="btn btn-outline-secondary w-50 py-2 mt-2" type="button" @click="googleLogin">
        <IconGoogle /> Google 登入
      </button>
      <button class="btn btn-outline-secondary w-50 py-2 mt-2" type="button">
        <IconLineColorful /> Line 登入
      </button>
    </div>
  </div>
</template>

<style scoped></style>
