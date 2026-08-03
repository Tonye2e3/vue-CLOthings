<script setup>
import { ref } from 'vue'

const account = ref('')
const password = ref('')

// import api from '@/services/api'
// import { useAuthStore } from '@/stores/auth'
// const authStore = useAuthStore()

import { useRouter } from 'vue-router'
const router = useRouter()

async function login() {
  const data = {
    account: account.value,
    password: password.value,
  }
  const resp = await api.post('/User/Login', data)
  // if (resp.status == 404) {
  //     alert('帳號或密碼錯誤')
  // } else if (resp.status == 200) {
  //     alert('登入成功')
  // } else {
  //     alert('登入未知錯誤')
  // }
  if (resp.data) {
    authStore.setAuth(resp.data)
    alert('登入成功')
    router.push({ name: 'home' })
    // router.push('/')
  } else {
    alert('帳號或密碼錯誤')
  }
  console.log('登入結果', resp)
}
</script>

<template>
  <div class="col-md-6 m-auto card p-4 mt-5 shadow" style="width: 800px">
    <h3 class="mb-4 fw-bold text-center">登入</h3>

    <div class="mb-3">
      <label class="form-label">帳號</label>
      <input type="text" class="form-control" v-model="account" />
    </div>
    <div class="mb-3">
      <label class="form-label">密碼</label>
      <input type="password" class="form-control" v-model="password" />
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
      <button class="btn btn-outline-secondary w-50 py-2 mt-2" type="button">google 登入</button>
      <button class="btn btn-outline-secondary w-50 py-2 mt-2" type="button">line 登入</button>
    </div>
  </div>
</template>

<style scoped></style>
